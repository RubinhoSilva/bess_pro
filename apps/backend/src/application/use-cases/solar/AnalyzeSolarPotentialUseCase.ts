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

      // Get PVGIS data
      const pvgisResponse = await this.pvgisApiService.getPVEstimation({
        location: { latitude, longitude },
        peakpower: systemSizeKw,
        angle: tilt,
        aspect: azimuth
      });

      // Get optimal inclination
      const optimalData = await this.pvgisApiService.getOptimalInclination({
        latitude,
        longitude
      });

      // Convert PVGIS data to our format
      const monthlyIrradiance = pvgisResponse.outputs.monthly.map(month => month.H_sun);
      const monthlyGeneration = pvgisResponse.outputs.monthly.map(month => month.E_m);
      const annualGeneration = pvgisResponse.outputs.totals.E_y;
      const annualIrradiance = monthlyIrradiance.reduce((sum, month) => sum + month, 0);

      const response: AnalyzeSolarPotentialResponse = {
        irradianceData: {
          monthly: monthlyIrradiance,
          annual: annualIrradiance
        },
        optimalTilt: optimalData.optimalInclination,
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