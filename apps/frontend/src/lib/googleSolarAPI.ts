/**
 * Google Solar API Integration Service
 * Fornece dados de potencial solar e análise de telhados
 */

interface GoogleSolarRequest {
  location: {
    latitude: number;
    longitude: number;
  };
  requiredQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  pixelSizeMeters?: number;
  radiusMeters?: number;
}

interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: Array<{
    pitchDegrees: number;
    azimuthDegrees: number;
    panelsCount: number;
    yearlyEnergyDcKwh: number;
    segmentIndex: number;
  }>;
}

interface GoogleSolarResponse {
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    wholeRoofStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    roofSegmentStats: Array<{
      pitchDegrees: number;
      azimuthDegrees: number;
      stats: {
        areaMeters2: number;
        sunshineQuantiles: number[];
        groundAreaMeters2: number;
      };
      center: {
        latitude: number;
        longitude: number;
      };
      boundingBox: {
        sw: { latitude: number; longitude: number };
        ne: { latitude: number; longitude: number };
      };
    }>;
    solarPanelConfigs: SolarPanelConfig[];
    financialAnalyses: Array<{
      monthlyBill: {
        currencyCode: string;
        units: string;
      };
      defaultBill: boolean;
      averageKwhPerMonth: number;
      panelConfigIndex: number;
    }>;
  };
  imagery: {
    quality: string;
    processingMonth: {
      year: number;
      month: number;
    };
  };
}

class GoogleSolarAPIService {
  private apiKey: string;
  private baseURL = 'https://solar.googleapis.com/v1';

  constructor() {
    // Em produção, isso viria de uma variável de ambiente
    this.apiKey = import.meta.env.VITE_GOOGLE_SOLAR_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Solar API key não configurada');
    }
  }

  /**
   * Busca dados de potencial solar para uma localização específica
   */
  async getSolarPotential(request: GoogleSolarRequest): Promise<GoogleSolarResponse> {
    if (!this.apiKey) {
      throw new Error('Google Solar API key não configurada');
    }

    const url = `${this.baseURL}/buildingInsights:findClosest`;
    
    const params = new URLSearchParams({
      'location.latitude': request.location.latitude.toString(),
      'location.longitude': request.location.longitude.toString(),
      'requiredQuality': request.requiredQuality,
      'key': this.apiKey,
    });

    if (request.pixelSizeMeters) {
      params.append('pixelSizeMeters', request.pixelSizeMeters.toString());
    }

    if (request.radiusMeters) {
      params.append('radiusMeters', request.radiusMeters.toString());
    }

    try {
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Solar API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data as GoogleSolarResponse;
    } catch (error) {
      console.error('Erro ao buscar dados do Google Solar API:', error);
      throw error;
    }
  }

  /**
   * Obtém camadas de dados solares (imagery layers)
   */
  async getDataLayers(lat: number, lng: number, radiusMeters: number = 100) {
    if (!this.apiKey) {
      throw new Error('Google Solar API key não configurada');
    }

    const url = `${this.baseURL}/dataLayers:get`;
    
    const params = new URLSearchParams({
      'location.latitude': lat.toString(),
      'location.longitude': lng.toString(),
      'radiusMeters': radiusMeters.toString(),
      'view': 'FULL_LAYERS',
      'requiredQuality': 'HIGH',
      'pixelSizeMeters': '0.5',
      'key': this.apiKey,
    });

    try {
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Solar API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar data layers:', error);
      throw error;
    }
  }

  /**
   * Converte dados do Google Solar API para formato do nosso sistema
   */
  formatSolarDataForBESS(solarData: GoogleSolarResponse) {
    const potential = solarData.solarPotential;
    
    return {
      location: {
        latitude: solarData.center.latitude,
        longitude: solarData.center.longitude,
        address: `${solarData.administrativeArea}, ${solarData.regionCode}`,
        postalCode: solarData.postalCode,
      },
      roofAnalysis: {
        totalAreaM2: potential.wholeRoofStats.areaMeters2,
        usableAreaM2: potential.maxArrayAreaMeters2,
        maxPanelsCount: potential.maxArrayPanelsCount,
        panelSpecs: {
          powerWatts: potential.panelCapacityWatts,
          heightMeters: potential.panelHeightMeters,
          widthMeters: potential.panelWidthMeters,
          lifetimeYears: potential.panelLifetimeYears,
        },
      },
      solarPotential: {
        maxSunshineHoursPerYear: potential.maxSunshineHoursPerYear,
        averageSunshineQuantile: this.calculateAverageSunshine(potential.wholeRoofStats.sunshineQuantiles),
        carbonOffsetKgPerMwh: potential.carbonOffsetFactorKgPerMwh,
      },
      configurations: potential.solarPanelConfigs.map((config, index) => ({
        id: `config_${index}`,
        panelsCount: config.panelsCount,
        annualEnergyKwh: config.yearlyEnergyDcKwh,
        powerKw: (config.panelsCount * potential.panelCapacityWatts) / 1000,
        roofSegments: config.roofSegmentSummaries?.map(segment => ({
          azimuth: segment.azimuthDegrees,
          tilt: segment.pitchDegrees,
          panelsCount: segment.panelsCount,
          annualEnergyKwh: segment.yearlyEnergyDcKwh,
        })) || [],
      })),
      imagery: {
        date: solarData.imageryDate,
        quality: solarData.imagery.quality,
      },
    };
  }

  /**
   * Calcula média das quantis de irradiação
   */
  private calculateAverageSunshine(quantiles: number[]): number {
    if (!quantiles || quantiles.length === 0) return 0;
    return quantiles.reduce((sum, val) => sum + val, 0) / quantiles.length;
  }

  /**
   * Verifica se a API está disponível e configurada
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Simula dados do Google Solar API para desenvolvimento/testes
   */
  generateMockData(lat: number, lng: number): Promise<GoogleSolarResponse> {
    return Promise.resolve({
      name: `building_${Date.now()}`,
      center: { latitude: lat, longitude: lng },
      imageryDate: { year: 2023, month: 8, day: 15 },
      postalCode: '01000-000',
      administrativeArea: 'São Paulo',
      statisticalArea: 'SP',
      regionCode: 'BR',
      solarPotential: {
        maxArrayPanelsCount: 50,
        panelCapacityWatts: 400,
        panelHeightMeters: 2.0,
        panelWidthMeters: 1.0,
        panelLifetimeYears: 25,
        maxArrayAreaMeters2: 100,
        maxSunshineHoursPerYear: 2200,
        carbonOffsetFactorKgPerMwh: 500,
        wholeRoofStats: {
          areaMeters2: 150,
          sunshineQuantiles: [4.5, 4.8, 5.0, 5.2, 5.5, 5.8, 6.0, 5.9, 5.7, 5.3, 4.9, 4.6],
          groundAreaMeters2: 150,
        },
        roofSegmentStats: [
          {
            pitchDegrees: 30,
            azimuthDegrees: 180,
            stats: {
              areaMeters2: 75,
              sunshineQuantiles: [4.8, 5.1, 5.3, 5.5, 5.8, 6.1, 6.3, 6.2, 6.0, 5.6, 5.2, 4.9],
              groundAreaMeters2: 75,
            },
            center: { latitude: lat, longitude: lng },
            boundingBox: {
              sw: { latitude: lat - 0.001, longitude: lng - 0.001 },
              ne: { latitude: lat + 0.001, longitude: lng + 0.001 },
            },
          },
        ],
        solarPanelConfigs: [
          {
            panelsCount: 25,
            yearlyEnergyDcKwh: 15000,
            roofSegmentSummaries: [
              {
                pitchDegrees: 30,
                azimuthDegrees: 180,
                panelsCount: 25,
                yearlyEnergyDcKwh: 15000,
                segmentIndex: 0,
              },
            ],
          },
          {
            panelsCount: 40,
            yearlyEnergyDcKwh: 22000,
            roofSegmentSummaries: [
              {
                pitchDegrees: 30,
                azimuthDegrees: 180,
                panelsCount: 40,
                yearlyEnergyDcKwh: 22000,
                segmentIndex: 0,
              },
            ],
          },
        ],
        financialAnalyses: [
          {
            monthlyBill: { currencyCode: 'BRL', units: '500' },
            defaultBill: true,
            averageKwhPerMonth: 350,
            panelConfigIndex: 0,
          },
        ],
      },
      imagery: {
        quality: 'HIGH',
        processingMonth: { year: 2023, month: 8 },
      },
    });
  }
}

export const googleSolarAPI = new GoogleSolarAPIService();
export type { GoogleSolarResponse, GoogleSolarRequest };