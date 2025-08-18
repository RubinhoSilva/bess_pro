import { Result } from '../../common/Result';

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
import { GoogleSolarApiService, SolarAnalysisResult, BuildingInsights } from '../../../infrastructure/external-apis/GoogleSolarApiService';

interface AnalyzeSolarPotentialRequest {
  latitude: number;
  longitude: number;
  monthlyEnergyBill?: number;
  panelWattage?: number;
  systemEfficiency?: number;
  includeImageryData?: boolean;
}

interface AnalyzeSolarPotentialResponse {
  buildingInsights: BuildingInsights;
  analysis: SolarAnalysisResult;
  imageryUrls?: {
    rgb: string;
    dsm: string;
    mask: string;
    annualFlux: string;
  };
  metadata: {
    analysisDate: Date;
    dataSource: 'google-solar-api';
    imageQuality: 'HIGH' | 'MEDIUM' | 'LOW';
    cacheHit: boolean;
  };
}

export class AnalyzeSolarPotentialUseCase {
  private logger = Logger.getInstance();

  constructor(
    private googleSolarService: GoogleSolarApiService
  ) {}

  async execute(request: AnalyzeSolarPotentialRequest): Promise<Result<AnalyzeSolarPotentialResponse>> {
    try {
      this.logger.info(`Analyzing solar potential for location: ${request.latitude}, ${request.longitude}`);

      // Validate coordinates
      if (!this.isValidCoordinate(request.latitude, request.longitude)) {
        return Result.failure('Coordenadas inválidas fornecidas');
      }

      // Get building insights
      const buildingResult = await this.googleSolarService.getBuildingInsights(
        request.latitude,
        request.longitude,
        'MEDIUM'
      );

      if (!buildingResult.isSuccess) {
        return Result.failure(`Falha ao obter insights do edifício: ${buildingResult.error}`);
      }

      const buildingInsights = buildingResult.value;

      // Perform comprehensive solar analysis
      const analysisResult = await this.googleSolarService.performSolarAnalysis(
        request.latitude,
        request.longitude,
        {
          monthlyBill: request.monthlyEnergyBill,
          panelWattage: request.panelWattage,
          systemEfficiency: request.systemEfficiency
        }
      );

      if (!analysisResult.isSuccess) {
        return Result.failure(`Falha na análise solar: ${analysisResult.error}`);
      }

      const analysis = analysisResult.value;

      // Get imagery data if requested
      let imageryUrls: AnalyzeSolarPotentialResponse['imageryUrls'];
      
      if (request.includeImageryData) {
        const dataLayersResult = await this.googleSolarService.getDataLayers(
          request.latitude,
          request.longitude,
          100,
          'FULL_LAYERS'
        );

        if (dataLayersResult.isSuccess && dataLayersResult.value) {
          const layers = dataLayersResult.value;
          imageryUrls = {
            rgb: layers.rgbUrl,
            dsm: layers.dsmUrl,
            mask: layers.maskUrl,
            annualFlux: layers.annualFluxUrl
          };
        }
      }

      // Prepare response
      const response: AnalyzeSolarPotentialResponse = {
        buildingInsights: buildingResult.value!,
        analysis: analysisResult.value!,
        imageryUrls,
        metadata: {
          analysisDate: new Date(),
          dataSource: 'google-solar-api',
          imageQuality: buildingResult.value!.imageryQuality,
          cacheHit: false // Would need cache hit tracking
        }
      };

      this.logger.info(`Solar analysis completed successfully. Viability score: ${analysisResult.value!.viabilityScore}%`);

      return Result.success(response);

    } catch (error: any) {
      const message = `Erro inesperado na análise de potencial solar: ${error.message}`;
      this.logger.error(message, error);
      return Result.failure(message);
    }
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }
}