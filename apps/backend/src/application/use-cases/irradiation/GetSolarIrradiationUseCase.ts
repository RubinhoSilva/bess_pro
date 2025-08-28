import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { SolarIrradiationService, IrradiationData } from "@/infrastructure/external-apis/SolarIrradiationService";
import { CalculationLogger } from "@/domain/services/CalculationLogger";

export interface GetSolarIrradiationCommand {
  latitude: number;
  longitude: number;
  preferredSource?: 'PVGIS' | 'NASA' | 'AUTO';
  useCache?: boolean;
}

export interface SolarIrradiationResponseDto {
  irradiation_data: IrradiationData;
  data_quality: {
    is_valid: boolean;
    warnings: string[];
    confidence_score: number; // 0-100
    data_age: string;
  };
  recommendations: {
    optimal_panel_tilt: number;
    optimal_panel_azimuth: number;
    best_installation_months: number[];
    seasonal_adjustments: Array<{
      month: number;
      recommended_tilt: number;
      expected_performance: number; // % of annual average
    }>;
  };
  location_info: {
    country: string;
    region: string;
    climate_zone: string;
    solar_potential: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  };
}

export class GetSolarIrradiationUseCase implements IUseCase<GetSolarIrradiationCommand, Result<SolarIrradiationResponseDto>> {
  
  async execute(command: GetSolarIrradiationCommand): Promise<Result<SolarIrradiationResponseDto>> {
    const logger = new CalculationLogger(`irradiation-${Date.now()}`);
    
    try {
      logger.context('Irradiação', 'Iniciando busca de dados de irradiação solar', 
        { latitude: command.latitude, longitude: command.longitude, source: command.preferredSource },
        'Obtendo dados de irradiação solar para dimensionamento de sistema fotovoltaico'
      );

      // Validar coordenadas
      if (command.latitude < -90 || command.latitude > 90) {
        logger.error('Validação', 'Latitude inválida', { latitude: command.latitude });
        return Result.failure('Latitude deve estar entre -90 e 90 graus');
      }
      
      if (command.longitude < -180 || command.longitude > 180) {
        logger.error('Validação', 'Longitude inválida', { longitude: command.longitude });
        return Result.failure('Longitude deve estar entre -180 e 180 graus');
      }

      logger.result('Validação', 'Coordenadas validadas com sucesso', { 
        latitude: command.latitude, 
        longitude: command.longitude 
      });

      // Obter dados de irradiação
      const useCache = command.useCache !== false; // padrão: usar cache
      let irradiationData: IrradiationData;

      if (useCache) {
        irradiationData = await SolarIrradiationService.getCachedIrradiationData(
          command.latitude,
          command.longitude,
          command.preferredSource || 'AUTO'
        );
      } else {
        irradiationData = await SolarIrradiationService.getIrradiationData(
          command.latitude,
          command.longitude,
          command.preferredSource || 'AUTO'
        );
      }

      // Validar qualidade dos dados
      const dataQuality = SolarIrradiationService.validateIrradiationData(irradiationData);
      
      // Calcular score de confiança
      const confidenceScore = this.calculateConfidenceScore(irradiationData, dataQuality);
      
      // Gerar recomendações
      const recommendations = this.generateRecommendations(irradiationData);
      
      // Obter informações da localização
      const locationInfo = this.getLocationInfo(command.latitude, command.longitude, irradiationData);

      const response: SolarIrradiationResponseDto = {
        irradiation_data: irradiationData,
        data_quality: {
          is_valid: dataQuality.isValid,
          warnings: dataQuality.warnings,
          confidence_score: confidenceScore,
          data_age: this.getDataAge(irradiationData.source)
        },
        recommendations,
        location_info: locationInfo
      };

      return Result.success(response);

    } catch (error: any) {
      return Result.failure(`Erro ao obter dados de irradiação solar: ${error.message}`);
    }
  }

  private calculateConfidenceScore(data: IrradiationData, quality: { isValid: boolean; warnings: string[] }): number {
    let score = 100;

    // Penalizar por warnings
    score -= quality.warnings.length * 10;

    // Ajustar por fonte de dados
    switch (data.source) {
      case 'PVGIS':
        score -= 0; // Melhor fonte
        break;
      case 'NASA':
        score -= 5; // Boa fonte
        break;
      case 'INMET':
        score -= 15; // Dados estimados
        break;
      default:
        score -= 20;
    }

    // Verificar consistência dos dados
    const monthlySum = data.monthly_irradiation.reduce((sum, val) => sum + val, 0);
    const annualDiff = Math.abs(monthlySum - data.annual_irradiation) / data.annual_irradiation;
    if (annualDiff > 0.05) score -= 15;

    // Verificar valores extremos
    const minMonthly = Math.min(...data.monthly_irradiation);
    const maxMonthly = Math.max(...data.monthly_irradiation);
    const variation = (maxMonthly - minMonthly) / ((maxMonthly + minMonthly) / 2);
    
    if (variation > 1.0) score -= 10; // Variação muito alta
    if (variation < 0.2) score -= 10; // Variação muito baixa

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(data: IrradiationData) {
    // Meses com melhor irradiação para instalação
    const monthlyWithIndex = data.monthly_irradiation.map((value, index) => ({ value, month: index + 1 }));
    monthlyWithIndex.sort((a, b) => b.value - a.value);
    const bestInstallationMonths = monthlyWithIndex.slice(0, 6).map(item => item.month);

    // Ajustes sazonais de inclinação
    const seasonalAdjustments = data.monthly_irradiation.map((irradiation, index) => {
      const month = index + 1;
      let tiltAdjustment = 0;
      
      // Ajustar inclinação baseado na sazonalidade
      if (data.location.latitude >= 0) { // Hemisfério Norte
        if (month >= 4 && month <= 9) { // Verão
          tiltAdjustment = -15;
        } else { // Inverno
          tiltAdjustment = 15;
        }
      } else { // Hemisfério Sul
        if (month >= 10 || month <= 3) { // Verão
          tiltAdjustment = -15;
        } else { // Inverno
          tiltAdjustment = 15;
        }
      }

      const recommendedTilt = Math.max(0, Math.min(60, data.optimal_tilt + tiltAdjustment));
      const expectedPerformance = (irradiation / (data.annual_irradiation / 12)) * 100;

      return {
        month,
        recommended_tilt: recommendedTilt,
        expected_performance: Math.round(expectedPerformance)
      };
    });

    return {
      optimal_panel_tilt: data.optimal_tilt,
      optimal_panel_azimuth: data.optimal_azimuth,
      best_installation_months: bestInstallationMonths.sort((a, b) => a - b),
      seasonal_adjustments: seasonalAdjustments
    };
  }

  private getLocationInfo(latitude: number, longitude: number, data: IrradiationData) {
    // Determinar país/região baseado nas coordenadas
    let country = 'Unknown';
    let region = 'Unknown';
    let climateZone = 'Temperate';

    // Brasil
    if (latitude > -34 && latitude < 5 && longitude > -74 && longitude < -34) {
      country = 'Brazil';
      if (latitude > -10) {
        region = 'Northeast';
        climateZone = 'Tropical';
      } else if (latitude > -20) {
        region = 'Central-West';
        climateZone = 'Tropical Savanna';
      } else if (latitude > -30) {
        region = 'Southeast/South';
        climateZone = 'Subtropical';
      } else {
        region = 'South';
        climateZone = 'Temperate';
      }
    }
    // Europa
    else if (latitude > 35 && latitude < 72 && longitude > -25 && longitude < 45) {
      country = 'Europe';
      region = latitude > 55 ? 'Northern Europe' : 'Southern Europe';
      climateZone = latitude > 55 ? 'Continental' : 'Mediterranean';
    }
    // América do Norte
    else if (latitude > 25 && latitude < 72 && longitude > -170 && longitude < -50) {
      country = 'North America';
      region = latitude > 50 ? 'Northern' : 'Southern';
      climateZone = 'Continental';
    }

    // Determinar potencial solar
    let solarPotential: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
    
    if (data.annual_irradiation > 2000) {
      solarPotential = 'Excellent';
    } else if (data.annual_irradiation > 1600) {
      solarPotential = 'Very Good';
    } else if (data.annual_irradiation > 1200) {
      solarPotential = 'Good';
    } else if (data.annual_irradiation > 900) {
      solarPotential = 'Fair';
    } else {
      solarPotential = 'Poor';
    }

    return {
      country,
      region,
      climate_zone: climateZone,
      solar_potential: solarPotential
    };
  }

  private getDataAge(source: string): string {
    switch (source) {
      case 'PVGIS':
        return '2016-2020 (Atual)';
      case 'NASA':
        return '2020 (Recente)';
      case 'INMET':
        return 'Estimativa (Baseado em dados históricos)';
      default:
        return 'Desconhecido';
    }
  }
}