import { Result } from '../../common/Result';
import { PvgisApiService } from '../../../infrastructure/external-apis/PvgisApiService';

interface AnalyzeSolarPotentialRequest {
  latitude: number;
  longitude: number;
  systemSizeKw?: number;
  tilt?: number;
  azimuth?: number;
}

interface AnalyzeSolarPotentialResponse {
  irradianceData: {
    monthly: number[];
    annual: number;
  };
  optimalTilt: number;
  estimatedGeneration: {
    monthly: number[];
    annual: number;
  };
  losses: {
    system: number;
    angular: number;
    temperature: number;
    total: number;
  };
  metadata: {
    analysisDate: Date;
    dataSource: 'pvgis';
    location: {
      latitude: number;
      longitude: number;
    };
  };
}

export class AnalyzeSolarPotentialUseCase {
  constructor(private pvgisApiService: PvgisApiService) {}

  async execute(request: AnalyzeSolarPotentialRequest): Promise<Result<AnalyzeSolarPotentialResponse>> {
    try {
      const { latitude, longitude, systemSizeKw = 1, tilt = 30, azimuth = 180 } = request;

      // Get PVGIS monthly radiation data
      const pvgisResponse = await this.pvgisApiService.getMonthlyRadiation(latitude, longitude, {
        peakpower: systemSizeKw,
        angle: tilt,
        aspect: azimuth,
        loss: 14
      });

      // Extract monthly irradiance data
      const monthlyIrradiance: number[] = pvgisResponse.outputs.monthly_radiation || [];
      const annualIrradiance = monthlyIrradiance.reduce((sum: number, month: number) => sum + month, 0);
      
      // Calculate estimated generation (simplified)
      const monthlyGeneration: number[] = monthlyIrradiance.map((irradiance: number) => 
        irradiance * systemSizeKw * 30 * 0.85 // Simplified calculation
      );
      const annualGeneration = monthlyGeneration.reduce((sum: number, month: number) => sum + month, 0);

      const response: AnalyzeSolarPotentialResponse = {
        irradianceData: {
          monthly: monthlyIrradiance,
          annual: annualIrradiance
        },
        optimalTilt: tilt, // Using provided tilt as optimal (simplified)
        estimatedGeneration: {
          monthly: monthlyGeneration,
          annual: annualGeneration
        },
        losses: {
          system: 14, // Default system losses
          angular: 3,
          temperature: 8,
          total: 25
        },
        metadata: {
          analysisDate: new Date(),
          dataSource: 'pvgis',
          location: {
            latitude,
            longitude
          }
        }
      };

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro na análise solar: ${error.message}`);
    }
  }
}