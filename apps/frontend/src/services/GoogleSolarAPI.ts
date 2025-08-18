/**
 * Google Solar API Integration
 * 
 * A Google Solar API fornece dados de potencial solar baseados em imagens de satélite
 * e dados meteorológicos para análise de viabilidade de instalação solar.
 * 
 * Documentação: https://developers.google.com/maps/documentation/solar
 */

interface GoogleSolarAPIConfig {
  apiKey: string;
  baseURL: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

interface SolarPotentialRequest {
  location: Location;
  radiusMeters?: number;
  view?: 'FULL_LAYERS' | 'DSM_LAYER' | 'IMAGERY_LAYER' | 'IMAGERY_AND_ANNUAL_FLUX_LAYERS' | 'IMAGERY_AND_ALL_FLUX_LAYERS';
  requiredQuality?: 'HIGH' | 'MEDIUM' | 'LOW';
  pixelSizeMeters?: number;
  panelCapacityWatts?: number;
  panelHeightMeters?: number;
  panelWidthMeters?: number;
  panelLifetimeYears?: number;
  azimuthDegrees?: number;
  tiltDegrees?: number;
}

interface SolarPanel {
  center: Location;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  segmentIndex: number;
  yearlyEnergyDcKwh: number;
}

interface RoofSegment {
  segmentIndex: number;
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: {
    centerPoint: Location;
    boundingBox: {
      sw: Location;
      ne: Location;
    };
    planeHeightAtCenterMeters: number;
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  center: Location;
  boundingBox: {
    sw: Location;
    ne: Location;
  };
  planeHeightAtCenterMeters: number;
}

interface FinancialAnalysis {
  monthlyBill: {
    currencyCode: string;
    units: string;
  };
  defaultBill: boolean;
  averageKwhPerMonth: number;
  panelConfigIndex: number;
}

interface SolarPotentialResponse {
  name: string;
  center: Location;
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
      center: Location;
      boundingBox: {
        sw: Location;
        ne: Location;
      };
      planeHeightAtCenterMeters: number;
    }>;
    solarPanels: SolarPanel[];
    solarPanelConfigs: Array<{
      panelsCount: number;
      yearlyEnergyDcKwh: number;
      roofSegmentSummaries: Array<{
        segmentIndex: number;
        panelsCount: number;
        yearlyEnergyDcKwh: number;
      }>;
    }>;
    financialAnalyses: FinancialAnalysis[];
  };
}

interface BuildingInsightsRequest {
  location: Location;
  requiredQuality?: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface BuildingInsightsResponse {
  name: string;
  center: Location;
  boundingBox: {
    sw: Location;
    ne: Location;
  };
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  imageryProcessedDate: {
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
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    wholeRoofStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    roofSegmentStats: RoofSegment[];
  };
}

export class GoogleSolarAPI {
  private config: GoogleSolarAPIConfig;

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseURL: 'https://solar.googleapis.com/v1'
    };
  }

  /**
   * Obtém insights básicos sobre um edifício para análise solar
   */
  async getBuildingInsights(request: BuildingInsightsRequest): Promise<BuildingInsightsResponse> {
    const { location, requiredQuality = 'HIGH' } = request;
    
    const params = new URLSearchParams({
      'location.latitude': location.latitude.toString(),
      'location.longitude': location.longitude.toString(),
      'requiredQuality': requiredQuality,
      'key': this.config.apiKey
    });

    try {
      const response = await fetch(`${this.config.baseURL}/buildingInsights:findClosest?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Google Solar API Error: ${response.status} - ${response.statusText}`);
      }

      const data: BuildingInsightsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar Building Insights:', error);
      throw error;
    }
  }

  /**
   * Obtém análise completa de potencial solar para um local
   */
  async getSolarPotential(request: SolarPotentialRequest): Promise<SolarPotentialResponse> {
    const {
      location,
      radiusMeters = 50,
      view = 'FULL_LAYERS',
      requiredQuality = 'HIGH',
      pixelSizeMeters = 0.5,
      panelCapacityWatts = 250,
      panelHeightMeters = 1.65,
      panelWidthMeters = 0.992,
      panelLifetimeYears = 20,
      azimuthDegrees,
      tiltDegrees
    } = request;

    const params = new URLSearchParams({
      'location.latitude': location.latitude.toString(),
      'location.longitude': location.longitude.toString(),
      'radiusMeters': radiusMeters.toString(),
      'view': view,
      'requiredQuality': requiredQuality,
      'pixelSizeMeters': pixelSizeMeters.toString(),
      'panelCapacityWatts': panelCapacityWatts.toString(),
      'panelHeightMeters': panelHeightMeters.toString(),
      'panelWidthMeters': panelWidthMeters.toString(),
      'panelLifetimeYears': panelLifetimeYears.toString(),
      'key': this.config.apiKey
    });

    if (azimuthDegrees !== undefined) {
      params.append('azimuthDegrees', azimuthDegrees.toString());
    }
    if (tiltDegrees !== undefined) {
      params.append('tiltDegrees', tiltDegrees.toString());
    }

    try {
      const response = await fetch(`${this.config.baseURL}/solarPotential:findClosest?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Google Solar API Error: ${response.status} - ${response.statusText}`);
      }

      const data: SolarPotentialResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar Solar Potential:', error);
      throw error;
    }
  }

  /**
   * Calcula estimativas de produção baseadas nos dados da Google Solar API
   */
  calculateProductionEstimates(solarData: SolarPotentialResponse, systemSizeKw: number): {
    annualProductionKwh: number;
    monthlyProductionKwh: number[];
    roofAreaUsedM2: number;
    panelsCount: number;
    carbonOffset: number;
    sunshineHoursPerYear: number;
  } {
    const { solarPotential } = solarData;
    
    // Encontrar a configuração de painel mais próxima do sistema desejado
    const targetPanelsCount = Math.round((systemSizeKw * 1000) / solarPotential.panelCapacityWatts);
    
    let bestConfig = solarPotential.solarPanelConfigs[0];
    let minDiff = Math.abs(bestConfig.panelsCount - targetPanelsCount);
    
    for (const config of solarPotential.solarPanelConfigs) {
      const diff = Math.abs(config.panelsCount - targetPanelsCount);
      if (diff < minDiff) {
        minDiff = diff;
        bestConfig = config;
      }
    }

    // Calcular produção anual
    const annualProductionKwh = bestConfig.yearlyEnergyDcKwh;
    
    // Estimar produção mensal (baseada em padrões sazonais)
    const monthlyFactors = [0.7, 0.8, 0.95, 1.1, 1.2, 1.25, 1.3, 1.25, 1.1, 0.9, 0.75, 0.65];
    const monthlyProductionKwh = monthlyFactors.map(factor => 
      (annualProductionKwh * factor) / 12
    );

    // Área do telhado utilizada
    const roofAreaUsedM2 = bestConfig.panelsCount * 
      (solarPotential.panelHeightMeters * solarPotential.panelWidthMeters);

    // Offset de carbono
    const carbonOffset = (annualProductionKwh / 1000) * solarPotential.carbonOffsetFactorKgPerMwh;

    return {
      annualProductionKwh,
      monthlyProductionKwh,
      roofAreaUsedM2,
      panelsCount: bestConfig.panelsCount,
      carbonOffset,
      sunshineHoursPerYear: solarPotential.maxSunshineHoursPerYear
    };
  }

  /**
   * Converte dados do Google Solar API para formato compatível com o sistema
   */
  convertToSystemFormat(solarData: SolarPotentialResponse, location: Location): {
    irradiacaoMensal: number[];
    area: number;
    orientacao: {
      azimute: number;
      inclinacao: number;
    };
    potencialSolar: number;
    coordenadas: Location;
  } {
    const { solarPotential } = solarData;
    
    // Calcular irradiação mensal média (kWh/m²/dia)
    const totalSunshineHours = solarPotential.maxSunshineHoursPerYear;
    const avgDailyIrradiation = totalSunshineHours / 365 * 0.8; // Fator de conversão aproximado
    
    // Distribuição sazonal da irradiação
    const seasonalFactors = [0.65, 0.75, 0.9, 1.1, 1.25, 1.35, 1.4, 1.35, 1.15, 0.95, 0.7, 0.6];
    const irradiacaoMensal = seasonalFactors.map(factor => avgDailyIrradiation * factor);

    // Melhor orientação baseada nos segmentos do telhado
    let bestSegment = solarPotential.roofSegmentStats[0];
    let maxArea = 0;
    
    for (const segment of solarPotential.roofSegmentStats) {
      if (segment.stats.areaMeters2 > maxArea) {
        maxArea = segment.stats.areaMeters2;
        bestSegment = segment;
      }
    }

    return {
      irradiacaoMensal,
      area: solarPotential.wholeRoofStats.areaMeters2,
      orientacao: {
        azimute: bestSegment?.azimuthDegrees || 180,
        inclinacao: bestSegment?.pitchDegrees || 20
      },
      potencialSolar: solarPotential.maxArrayPanelsCount,
      coordenadas: location
    };
  }
}

// Singleton instance
let googleSolarInstance: GoogleSolarAPI | null = null;

export const getGoogleSolarAPI = (apiKey?: string): GoogleSolarAPI => {
  if (!googleSolarInstance) {
    const key = apiKey || import.meta.env.VITE_GOOGLE_SOLAR_API_KEY || '';
    if (!key) {
      throw new Error('Google Solar API key não configurada. Configure VITE_GOOGLE_SOLAR_API_KEY.');
    }
    googleSolarInstance = new GoogleSolarAPI(key);
  }
  return googleSolarInstance;
};

export type {
  Location,
  SolarPotentialRequest,
  SolarPotentialResponse,
  BuildingInsightsRequest,
  BuildingInsightsResponse,
  SolarPanel,
  RoofSegment,
  FinancialAnalysis
};