import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { PvgisApiService, PvgisData } from '../../../infrastructure/external-apis/PvgisApiService';

import { CalculationLogger } from '../../../domain/services/CalculationLogger';

export interface GetPVGISMonthlyComponentsRequest {
  latitude: number;
  longitude: number;
  azimuth?: number;
  tilt?: number;
  raddatabase?: string;
  useCache?: boolean;
}

export interface MonthlyComponent {
  month: number;
  monthName: string;
  globalHorizontalIrradiation: number; // G_h (kWh/m²)
  directNormalIrradiation: number; // G_n (kWh/m²)
  diffuseHorizontalIrradiation: number; // G_d (kWh/m²)
  globalInclinedIrradiation: number; // G_t (kWh/m²)
  optimalInclination: number;
  optimalAzimuth: number;
}

export interface GetPVGISMonthlyComponentsResponse {
  monthlyComponents: MonthlyComponent[];
  metadata: {
    source: string;
    timestamp: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    parameters: {
      azimuth?: number;
      tilt?: number;
      raddatabase?: string;
    };
    cacheHit: boolean;
  };
}

export class GetPVGISMonthlyComponentsUseCase implements IUseCase<GetPVGISMonthlyComponentsRequest, Result<GetPVGISMonthlyComponentsResponse>> {
  private readonly monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  private cache: Map<string, { data: GetPVGISMonthlyComponentsResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    private pvgisApiService: PvgisApiService,
    private logger: CalculationLogger
  ) {}

  async execute(request: GetPVGISMonthlyComponentsRequest): Promise<Result<GetPVGISMonthlyComponentsResponse>> {
    this.logger.info('GetPVGISMonthlyComponentsUseCase', 'Iniciando obtenção de componentes mensais', {
      coordinates: { lat: request.latitude, lng: request.longitude },
      parameters: {
        azimuth: request.azimuth,
        tilt: request.tilt,
        raddatabase: request.raddatabase
      }
    });
    
    try {
      // 1. Validações de negócio
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return Result.failure(validation.errors.join(', '));
      }

      this.logger.info('Validação', 'Requisição validada com sucesso', {
        coordinates: { lat: request.latitude, lng: request.longitude },
        dataSource: request.raddatabase || 'PVGIS-SARAH2',
        useCache: request.useCache
      });

      // 2. Verificar cache (se habilitado)
      const cacheKey = this.generateCacheKey(request);
      if (request.useCache) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          this.logger.info('Cache', 'Dados recuperados do cache', { cacheKey });
          return Result.success({
            ...cached.data,
            metadata: { ...cached.data.metadata, cacheHit: true }
          });
        }
      }

      // 3. Buscar dados da API PVGIS para componentes mensais
      this.logger.info('API', 'Buscando dados de componentes mensais da API PVGIS', {
        endpoint: 'seriescalc',
        params: {
          lat: request.latitude,
          lng: request.longitude,
          tilt: request.tilt || 0,
          azimuth: request.azimuth || 0,
          raddatabase: request.raddatabase || 'PVGIS-SARAH2'
        }
      });

      const irradiationData = await this.pvgisApiService.getMonthlyRadiation(
        request.latitude,
        request.longitude,
        {
          angle: request.tilt || 0,
          aspect: request.azimuth || 0
        }
      );

      // 4. Processar componentes mensais
      const monthlyComponents = this.processMonthlyComponents(irradiationData, request);

      // 5. Salvar no cache
      const responseData = {
        monthlyComponents,
        metadata: {
          source: 'PVGIS-Monthly-Components',
          timestamp: new Date().toISOString(),
          coordinates: {
            latitude: request.latitude,
            longitude: request.longitude
          },
          parameters: {
            azimuth: request.azimuth,
            tilt: request.tilt,
            raddatabase: request.raddatabase
          },
          cacheHit: false
        }
      };

      if (request.useCache) {
        this.cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        this.logger.info('Cache', 'Dados salvos no cache', { cacheKey });
      }

      // 6. Retornar resultado
      this.logger.result('Sucesso', 'Componentes mensais obtidos com sucesso', {
        monthsProcessed: monthlyComponents.length,
        averageGlobalIrradiation: monthlyComponents.reduce((sum, comp) => sum + comp.globalHorizontalIrradiation, 0) / 12,
        source: responseData.metadata.source
      });

      return Result.success(responseData);

    } catch (error: any) {
      this.logger.error('Erro', 'Falha ao obter componentes mensais', {
        error: error.message,
        stack: error.stack
      });

      if (error.response?.status === 400) {
        return Result.failure('Parâmetros inválidos para a API PVGIS');
      }

      if (error.response?.status === 404) {
        return Result.failure('Localização não encontrada na base de dados PVGIS');
      }

      if (error.response?.status >= 500) {
        return Result.failure('Serviço PVGIS temporariamente indisponível');
      }

      return Result.failure(`Erro ao obter componentes mensais: ${error.message}`);
    }
  }

  private validateRequest(request: GetPVGISMonthlyComponentsRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate coordinates
    if (!request.latitude || !request.longitude) {
      errors.push('Latitude e longitude são obrigatórias');
    }

    if (request.latitude && (request.latitude < -90 || request.latitude > 90)) {
      errors.push('Latitude deve estar entre -90 e 90 graus');
    }

    if (request.longitude && (request.longitude < -180 || request.longitude > 180)) {
      errors.push('Longitude deve estar entre -180 e 180 graus');
    }

    // Validate optional parameters
    if (request.tilt !== undefined && (request.tilt < 0 || request.tilt > 90)) {
      errors.push('Inclinação deve estar entre 0 e 90 graus');
    }

    if (request.azimuth !== undefined && (request.azimuth < -180 || request.azimuth > 180)) {
      errors.push('Azimute deve estar entre -180 e 180 graus');
    }

    if (request.raddatabase && !['PVGIS-SARAH2', 'PVGIS-ERA5', 'PVGIS-COSMO'].includes(request.raddatabase)) {
      errors.push('Base de dados de radiação inválida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateCacheKey(request: GetPVGISMonthlyComponentsRequest): string {
    const { latitude, longitude, azimuth = 0, tilt = 0, raddatabase = 'PVGIS-SARAH2' } = request;
    return `pvgis_monthly_components_${latitude}_${longitude}_${azimuth}_${tilt}_${raddatabase}`;
  }

  private processMonthlyComponents(
    data: PvgisData, 
    request: GetPVGISMonthlyComponentsRequest
  ): MonthlyComponent[] {
    // Validate response structure
    if (!data.outputs || !data.outputs.monthly_radiation) {
      throw new Error('Resposta inválida da API PVGIS: dados mensais não encontrados');
    }

    if (!Array.isArray(data.outputs.monthly_radiation) || data.outputs.monthly_radiation.length !== 12) {
      throw new Error('Dados mensais de irradiação inválidos: esperado 12 meses');
    }

    // Process monthly radiation data into components
    const monthlyComponents: MonthlyComponent[] = data.outputs.monthly_radiation.map((monthlyValue, index) => {
      const month = index + 1;
      
      // For PVGIS, we need to estimate components from the available data
      // This is a simplified approach - in a real implementation, you might need
      // additional API calls or more sophisticated calculations
      
      return {
        month,
        monthName: this.monthNames[index],
        globalHorizontalIrradiation: monthlyValue, // G_h
        directNormalIrradiation: this.estimateDirectNormal(monthlyValue, request.tilt || 0), // G_n
        diffuseHorizontalIrradiation: this.estimateDiffuseHorizontal(monthlyValue), // G_d
        globalInclinedIrradiation: this.calculateGlobalInclined(monthlyValue, request.tilt || 0, request.azimuth || 0), // G_t
        optimalInclination: this.calculateOptimalInclination(month, request.latitude),
        optimalAzimuth: 0 // Assuming north hemisphere, south-facing is optimal (azimuth = 0)
      };
    });

    // Validate processed data
    const invalidMonths = monthlyComponents.filter(comp => 
      comp.globalHorizontalIrradiation < 0 || 
      !isFinite(comp.globalHorizontalIrradiation) ||
      comp.directNormalIrradiation < 0 ||
      !isFinite(comp.directNormalIrradiation) ||
      comp.diffuseHorizontalIrradiation < 0 ||
      !isFinite(comp.diffuseHorizontalIrradiation) ||
      comp.globalInclinedIrradiation < 0 ||
      !isFinite(comp.globalInclinedIrradiation)
    );

    if (invalidMonths.length > 0) {
      this.logger.info('Validação', 'Meses com dados inválidos encontrados', {
        invalidMonths: invalidMonths.map(comp => comp.month)
      });
    }

    return monthlyComponents;
  }

  private estimateDirectNormal(globalHorizontal: number, tilt: number): number {
    // Simplified estimation - in reality this depends on many factors
    // This is a rough approximation for demonstration purposes
    const tiltFactor = Math.cos((tilt * Math.PI) / 180);
    return globalHorizontal * (0.7 + 0.3 * tiltFactor);
  }

  private estimateDiffuseHorizontal(globalHorizontal: number): number {
    // Simplified estimation - typically diffuse is 20-40% of global
    return globalHorizontal * 0.3;
  }

  private calculateGlobalInclined(globalHorizontal: number, tilt: number, azimuth: number): number {
    // Simplified calculation for inclined surface
    const tiltRad = (tilt * Math.PI) / 180;
    const azimuthRad = (azimuth * Math.PI) / 180;
    
    // Basic geometric factor for inclined surface
    const geometricFactor = Math.cos(tiltRad) + 0.3 * Math.sin(tiltRad) * Math.cos(azimuthRad);
    
    return globalHorizontal * Math.max(0, geometricFactor);
  }

  private calculateOptimalInclination(month: number, latitude: number): number {
    // Simplified optimal inclination calculation
    // In reality, this varies by month and location
    const baseInclination = Math.abs(latitude);
    
    // Seasonal adjustment
    const seasonalFactors = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9];
    
    return baseInclination * seasonalFactors[month - 1];
  }
}