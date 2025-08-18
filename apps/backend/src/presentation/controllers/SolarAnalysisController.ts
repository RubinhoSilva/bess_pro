import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AnalyzeSolarPotentialUseCase } from '../../application/use-cases/solar/AnalyzeSolarPotentialUseCase';
// Simple logger implementation
class Logger {
  private static instance: Logger;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);
  }
  
  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

// Validation functions to replace Zod schemas
function validateAnalyzeSolarPotential(body: any): { success: boolean; data?: any; error?: { issues: Array<{ message: string }> } } {
  const errors: Array<{ message: string }> = [];
  
  if (typeof body.latitude !== 'number') {
    errors.push({ message: 'Latitude deve ser um número' });
  } else if (body.latitude < -90 || body.latitude > 90) {
    errors.push({ message: 'Latitude deve estar entre -90 e 90' });
  }
  
  if (typeof body.longitude !== 'number') {
    errors.push({ message: 'Longitude deve ser um número' });
  } else if (body.longitude < -180 || body.longitude > 180) {
    errors.push({ message: 'Longitude deve estar entre -180 e 180' });
  }
  
  if (body.monthlyEnergyBill !== undefined && (typeof body.monthlyEnergyBill !== 'number' || body.monthlyEnergyBill <= 0)) {
    errors.push({ message: 'Conta mensal deve ser um valor positivo' });
  }
  
  if (body.panelWattage !== undefined) {
    if (typeof body.panelWattage !== 'number' || body.panelWattage <= 0) {
      errors.push({ message: 'Potência do painel deve ser um valor positivo' });
    } else if (body.panelWattage < 100 || body.panelWattage > 1000) {
      errors.push({ message: 'Potência deve estar entre 100W e 1000W' });
    }
  }
  
  if (body.systemEfficiency !== undefined) {
    if (typeof body.systemEfficiency !== 'number' || body.systemEfficiency < 0.1 || body.systemEfficiency > 1) {
      errors.push({ message: 'Eficiência deve estar entre 10% e 100%' });
    }
  }
  
  if (errors.length > 0) {
    return { success: false, error: { issues: errors } };
  }
  
  return {
    success: true,
    data: {
      latitude: body.latitude,
      longitude: body.longitude,
      monthlyEnergyBill: body.monthlyEnergyBill,
      panelWattage: body.panelWattage,
      systemEfficiency: body.systemEfficiency,
      includeImageryData: body.includeImageryData || false
    }
  };
}

function validateGetSolarPotential(query: any): { success: boolean; data?: { latitude: number; longitude: number }; errors?: string[] } {
  const errors: string[] = [];
  
  const latitude = parseFloat(query.latitude);
  const longitude = parseFloat(query.longitude);
  
  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.push('Latitude inválida');
  }
  
  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.push('Longitude inválida');
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return {
    success: true,
    data: { latitude, longitude }
  };
}

export class SolarAnalysisController extends BaseController {
  private logger = Logger.getInstance();

  constructor(
    private analyzeSolarPotentialUseCase: AnalyzeSolarPotentialUseCase
  ) {
    super();
  }

  /**
   * POST /api/v1/solar/analyze
   * Comprehensive solar potential analysis
   */
  async analyzeSolarPotential(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = validateAnalyzeSolarPotential(req.body);
      
      if (!validationResult.success) {
        this.badRequest(res, 'Dados de entrada inválidos: ' + validationResult.error!.issues.map(i => i.message).join(', '));
        return;
      }

      const data = validationResult.data;
      
      this.logger.info(`Solar analysis request for: ${data.latitude}, ${data.longitude}`);

      const result = await this.analyzeSolarPotentialUseCase.execute({
        latitude: data.latitude,
        longitude: data.longitude,
        monthlyEnergyBill: data.monthlyEnergyBill,
        panelWattage: data.panelWattage,
        systemEfficiency: data.systemEfficiency,
        includeImageryData: data.includeImageryData
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      const analysis = result.value;

      res.status(200).json({
        success: true,
        data: analysis,
        message: 'Análise solar concluída com sucesso'
      });

    } catch (error: any) {
      this.logger.error('Erro no controller de análise solar', error);
      this.internalServerError(res, 'Erro interno na análise solar');
    }
  }

  /**
   * GET /api/v1/solar/potential
   * Quick solar potential lookup
   */
  async getSolarPotential(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = validateGetSolarPotential(req.query);
      
      if (!validationResult.success) {
        this.badRequest(res, 'Parâmetros de consulta inválidos: ' + validationResult.errors!.join(', '));
        return;
      }

      const { latitude, longitude } = validationResult.data!;

      const result = await this.analyzeSolarPotentialUseCase.execute({
        latitude,
        longitude,
        includeImageryData: false
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      // Return simplified response for quick lookup
      const { buildingInsights, analysis } = result.value!;
      
      res.status(200).json({
        success: true,
        data: {
          location: {
            latitude,
            longitude,
            postalCode: buildingInsights.postalCode,
            administrativeArea: buildingInsights.administrativeArea
          },
          solarPotential: {
            maxPanelsCount: buildingInsights.solarPotential.maxArrayPanelsCount,
            maxAreaMeters2: buildingInsights.solarPotential.maxArrayAreaMeters2,
            maxSunshineHours: buildingInsights.solarPotential.maxSunshineHoursPerYear,
            viabilityScore: analysis.viabilityScore,
            roofComplexity: analysis.roofComplexity,
            estimatedGeneration: analysis.annualGeneration
          },
          imageQuality: buildingInsights.imageryQuality,
          dataDate: buildingInsights.imageryDate
        },
        message: 'Potencial solar obtido com sucesso'
      });

    } catch (error: any) {
      this.logger.error('Erro na consulta de potencial solar', error);
      this.internalServerError(res, 'Erro interno na consulta solar');
    }
  }

  /**
   * GET /api/v1/solar/recommendations/:latitude/:longitude
   * Get solar recommendations for a location
   */
  async getSolarRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const latitude = parseFloat(req.params.latitude);
      const longitude = parseFloat(req.params.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        this.badRequest(res, 'Coordenadas inválidas');
        return;
      }

      const result = await this.analyzeSolarPotentialUseCase.execute({
        latitude,
        longitude,
        monthlyEnergyBill: 200, // Default bill for recommendations
        includeImageryData: false
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      const { analysis, buildingInsights } = result.value!;

      res.status(200).json({
        success: true,
        data: {
          viabilityScore: analysis.viabilityScore,
          recommendations: analysis.recommendations,
          optimalConfiguration: {
            tilt: analysis.optimalTilt,
            azimuth: analysis.optimalAzimuth,
            panelCount: buildingInsights.solarPotential.maxArrayPanelsCount
          },
          financialProjection: {
            annualSavings: analysis.savings.annual,
            paybackPeriod: analysis.savings.paybackYears,
            estimatedGeneration: analysis.annualGeneration
          },
          roofAnalysis: {
            complexity: analysis.roofComplexity,
            availableArea: buildingInsights.solarPotential.maxArrayAreaMeters2,
            sunshineHours: buildingInsights.solarPotential.maxSunshineHoursPerYear
          }
        },
        message: 'Recomendações solares geradas com sucesso'
      });

    } catch (error: any) {
      this.logger.error('Erro na geração de recomendações solares', error);
      this.internalServerError(res, 'Erro interno nas recomendações');
    }
  }

  /**
   * POST /api/v1/solar/bulk-analyze
   * Analyze multiple locations at once
   */
  async bulkAnalyzeSolar(req: Request, res: Response): Promise<void> {
    try {
      const locations = req.body.locations as Array<{
        id: string;
        latitude: number;
        longitude: number;
        monthlyBill?: number;
      }>;

      if (!Array.isArray(locations) || locations.length === 0) {
        this.badRequest(res, 'Lista de localizações é obrigatória');
        return;
      }

      if (locations.length > 10) {
        this.badRequest(res, 'Máximo de 10 localizações por requisição');
        return;
      }

      const results = await Promise.allSettled(
        locations.map(location => 
          this.analyzeSolarPotentialUseCase.execute({
            latitude: location.latitude,
            longitude: location.longitude,
            monthlyEnergyBill: location.monthlyBill,
            includeImageryData: false
          })
        )
      );

      const processedResults = results.map((result, index) => {
        const location = locations[index];
        
        if (result.status === 'fulfilled' && result.value.isSuccess) {
          const analysis = result.value.value!;
          return {
            id: location.id,
            success: true,
            data: {
              viabilityScore: analysis.analysis.viabilityScore,
              roofComplexity: analysis.analysis.roofComplexity,
              estimatedGeneration: analysis.analysis.annualGeneration,
              annualSavings: analysis.analysis.savings.annual,
              paybackYears: analysis.analysis.savings.paybackYears
            }
          };
        } else {
          const error = result.status === 'fulfilled' 
            ? result.value.error 
            : (result as PromiseRejectedResult).reason?.message || 'Erro desconhecido';
            
          return {
            id: location.id,
            success: false,
            error
          };
        }
      });

      const successCount = processedResults.filter(r => r.success).length;

      res.status(200).json({
        success: true,
        data: {
          results: processedResults,
          summary: {
            total: locations.length,
            successful: successCount,
            failed: locations.length - successCount
          }
        },
        message: `Análise em lote concluída: ${successCount}/${locations.length} sucessos`
      });

    } catch (error: any) {
      this.logger.error('Erro na análise solar em lote', error);
      this.internalServerError(res, 'Erro interno na análise em lote');
    }
  }
}