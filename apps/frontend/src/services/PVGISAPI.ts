/**
 * PVGIS API Integration
 * 
 * PVGIS (Photovoltaic Geographical Information System) fornece dados de irradiação solar
 * e estimativas de produção fotovoltaica baseados em dados meteorológicos históricos.
 * 
 * Documentação: https://joint-research-centre.ec.europa.eu/pvgis-photovoltaic-geographical-information-system_en
 */

interface Location {
  latitude: number;
  longitude: number;
}

interface PVGISMonthlyData {
  month: number;
  E_d: number; // Daily energy output (kWh)
  E_m: number; // Monthly energy output (kWh) 
  H_d: number; // Daily irradiation (kWh/m²)
  H_m: number; // Monthly irradiation (kWh/m²)
  SD_m: number; // Standard deviation of monthly irradiation
  // Componentes de radiação (quando components=1)
  Gb_d?: number; // Daily beam irradiation (kWh/m²)
  Gd_d?: number; // Daily diffuse irradiation (kWh/m²)
  Gr_d?: number; // Daily reflected irradiation (kWh/m²)
  // Dados horários ótimos (quando hourlyoptimal=1)
  optimal_angle?: number; // Ângulo ótimo calculado
}

interface PVGISTotals {
  E_d: number; // Daily energy output (kWh/day)
  E_m: number; // Monthly energy output (kWh/month)
  E_y: number; // Yearly energy output (kWh/year)
  H_d: number; // Daily irradiation (kWh/m²/day)
  H_m: number; // Monthly irradiation (kWh/m²/month)
  H_y: number; // Yearly irradiation (kWh/m²/year)
  SD_m: number; // Standard deviation of monthly values
  SD_y: number; // Standard deviation of yearly values
  l_aoi: number; // Angular losses (%)
  l_spec: number; // Spectral losses (%)
  l_tg: number; // Temperature and irradiance losses (%)
  l_total: number; // Total losses (%)
  // Componentes de radiação totais (quando components=1)
  Gb_y?: number; // Yearly beam irradiation (kWh/m²/year)
  Gd_y?: number; // Yearly diffuse irradiation (kWh/m²/year)
  Gr_y?: number; // Yearly reflected irradiation (kWh/m²/year)
  // Ângulo ótimo anual (quando hourlyoptimal=1)
  optimal_inclination?: number; // Ângulo de inclinação ótimo anual
  optimal_azimuth?: number; // Azimute ótimo anual
}

interface PVGISRequest {
  location: Location;
  peakpower: number; // kWp
  loss?: number; // System losses (%)
  angle?: number; // Panel tilt angle (degrees)
  aspect?: number; // Panel azimuth angle (degrees from south)
  mountingplace?: 'free' | 'building'; // Mounting type
  trackingtype?: 0 | 1 | 2; // 0=fixed, 1=single-axis, 2=dual-axis
  pvtechchoice?: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown'; // PV technology
  database?: 'PVGIS-SARAH2' | 'PVGIS-NSRDB' | 'PVGIS-ERA5'; // Database
  startyear?: number;
  endyear?: number;
  components?: number; // Include radiation components
  hourlyoptimal?: number; // Use hourly optimal angle
  js?: 1; // Return JSON format
}

interface PVGISResponse {
  inputs: {
    location: {
      latitude: number;
      longitude: number;
      elevation: number;
    };
    meteo_data: {
      radiation_db: string;
      meteo_db: string;
      year_min: number;
      year_max: number;
      use_horizon: boolean;
      horizon_db: string;
    };
    mounting_system: {
      fixed: {
        slope: {
          value: number;
          optimal: boolean;
        };
        azimuth: {
          value: number;
          optimal: boolean;
        };
        type: string;
      };
    };
    pv_module: {
      technology: string;
      peak_power: number;
      system_loss: number;
    };
  };
  outputs: {
    monthly: PVGISMonthlyData[];
    totals: PVGISTotals;
    // Dados de componentes de radiação (quando components=1)
    radiation_components?: {
      beam: PVGISMonthlyData[];
      diffuse: PVGISMonthlyData[];
      reflected: PVGISMonthlyData[];
    };
    // Dados horários ótimos (quando hourlyoptimal=1)
    hourly_optimal?: {
      angles: Array<{
        hour: number;
        optimal_angle: number;
        irradiation: number;
      }>;
      annual_optimal: {
        inclination: number;
        azimuth: number;
      };
    };
  };
}

interface PVGISHorizonRequest {
  location: Location;
}

interface PVGISHorizonResponse {
  inputs: {
    location: {
      latitude: number;
      longitude: number;
      elevation: number;
    };
  };
  outputs: {
    horizon_profile: Array<{
      A: number; // Azimuth angle (degrees)
      H_hor: number; // Horizon elevation angle (degrees)
    }>;
  };
}

interface PVGISDailyRadiationRequest {
  location: Location;
  start: string; // YYYYMMDD
  end: string; // YYYYMMDD
  database?: 'PVGIS-SARAH2' | 'PVGIS-ERA5';
  angle?: number;
  aspect?: number;
  components?: number;
  hourlyoptimal?: number;
}

interface PVGISDailyRadiationResponse {
  inputs: {
    location: {
      latitude: number;
      longitude: number;
      elevation: number;
    };
    meteo_data: {
      radiation_db: string;
      year_min: number;
      year_max: number;
    };
    plane: {
      slope: number;
      azimuth: number;
    };
  };
  outputs: Array<{
    time: string; // YYYYMMDD
    G_d: number; // Daily global irradiation (Wh/m²)
    Gb_d: number; // Daily beam irradiation (Wh/m²)
    Gd_d: number; // Daily diffuse irradiation (Wh/m²)
    Gr_d?: number; // Daily reflected irradiation (Wh/m²) - quando components=1
    T2m: number; // 2-m air temperature (°C)
    WS10m: number; // 10-m wind speed (m/s)
    Int: number; // Data quality flag
    // Ângulos ótimos horários (quando hourlyoptimal=1)
    optimal_angle?: number;
    optimal_azimuth?: number;
  }>;
}

export class PVGISAPI {
  private baseURL = (() => {
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isDevelopment 
    ? 'http://localhost:8010/api/v1/irradiation/pvgis'
    : '/api/v1/irradiation/pvgis';
})();

  /**
   * Obtém estimativas de produção fotovoltaica
   */
  async getPVEstimation(request: PVGISRequest): Promise<PVGISResponse> {
    const {
      location,
      peakpower,
      loss = 14,
      angle = 35,
      aspect = 180,
      mountingplace = 'free',
      trackingtype = 0,
      pvtechchoice = 'crystSi',
      database = 'PVGIS-SARAH2',
      startyear = 2016,
      endyear = 2020,
      components = 1,
      hourlyoptimal = 1,
      js = 1
    } = request;

    const params = new URLSearchParams({
      lat: location.latitude.toString(),
      lon: location.longitude.toString(),
      peakpower: peakpower.toString(),
      loss: loss.toString(),
      angle: angle.toString(),
      aspect: aspect.toString(),
      mountingplace,
      trackingtype: trackingtype.toString(),
      pvtechchoice,
      raddatabase: database,
      startyear: startyear.toString(),
      endyear: endyear.toString(),
      components: components.toString(),
      hourlyoptimal: hourlyoptimal.toString(),
      js: js.toString()
    });

    try {
      // Endpoint PVGIS agora é público - não requer autenticação
      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`PVGIS API Error: ${response.status} - ${response.statusText}`);
      }

      const data: PVGISResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados PVGIS:', error);
      throw error;
    }
  }

  /**
   * Obtém perfil de horizonte para análise de sombreamento
   */
  async getHorizonProfile(request: PVGISHorizonRequest): Promise<PVGISHorizonResponse> {
    const { location } = request;

    const params = new URLSearchParams({
      lat: location.latitude.toString(),
      lon: location.longitude.toString(),
      outputformat: 'json'
    });

    try {
      const response = await fetch(`${this.baseURL}/horizon?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`PVGIS Horizon API Error: ${response.status} - ${response.statusText}`);
      }

      const data: PVGISHorizonResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil de horizonte PVGIS:', error);
      throw error;
    }
  }

  /**
   * Obtém dados de irradiação diária
   */
  async getDailyRadiation(request: PVGISDailyRadiationRequest): Promise<PVGISDailyRadiationResponse> {
    const {
      location,
      start,
      end,
      database = 'PVGIS-SARAH2',
      angle = 0,
      aspect = 180,
      components = 1,
      hourlyoptimal = 1
    } = request;

    const params = new URLSearchParams({
      lat: location.latitude.toString(),
      lon: location.longitude.toString(),
      start,
      end,
      raddatabase: database,
      angle: angle.toString(),
      aspect: aspect.toString(),
      components: components.toString(),
      hourlyoptimal: hourlyoptimal.toString(),
      outputformat: 'json'
    });

    try {
      const response = await fetch(`${this.baseURL}/DRcalc?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`PVGIS Daily Radiation API Error: ${response.status} - ${response.statusText}`);
      }

      const data: PVGISDailyRadiationResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar irradiação diária PVGIS:', error);
      throw error;
    }
  }

  /**
   * Encontra a inclinação ótima para um local
   */
  async getOptimalInclination(location: Location): Promise<{
    optimalInclination: number;
    annualYield: number;
    monthlyYields: number[];
  }> {
    // Testar diferentes inclinações para encontrar a ótima
    const testAngles = [0, 10, 20, 25, 30, 35, 40, 45, 50, 60];
    let bestAngle = 30;
    let bestYield = 0;
    let bestMonthlyYields: number[] = [];

    for (const angle of testAngles) {
      try {
        const result = await this.getPVEstimation({
          location,
          peakpower: 1, // 1kWp para comparação
          angle,
          aspect: 180 // Sul
        });

        const annualYield = result.outputs.totals.E_y;
        if (annualYield > bestYield) {
          bestYield = annualYield;
          bestAngle = angle;
          bestMonthlyYields = result.outputs.monthly.map(m => m.E_m);
        }
      } catch (error) {
        console.warn(`Erro ao testar ângulo ${angle}:`, error);
      }
    }

    return {
      optimalInclination: bestAngle,
      annualYield: bestYield,
      monthlyYields: bestMonthlyYields
    };
  }

  /**
   * Converte dados PVGIS para formato do sistema
   */
  convertToSystemFormat(pvgisData: PVGISResponse): {
    irradiacaoMensal: number[];
    irradiacaoAnual: number;
    temperaturaMedia: number;
    perdas: {
      angular: number;
      espectral: number;
      temperatura: number;
      total: number;
    };
    producaoEstimada: {
      diaria: number;
      mensal: number[];
      anual: number;
    };
    coordenadas: Location;
    elevacao: number;
    // Dados adicionais dos novos parâmetros
    componentesRadiacao?: {
      direta: number[];
      difusa: number[];
      refletida: number[];
    };
    angulosOtimos?: {
      inclinacao: number;
      azimute: number;
    };
  } {
    const { inputs, outputs } = pvgisData;
    
    // Converter irradiação mensal de kWh/m²/month para kWh/m²/day
    const irradiacaoMensal = outputs.monthly.map(month => month.H_d);
    
    // Calcular irradiação anual média
    const irradiacaoAnual = outputs.totals.H_y;
    
    // Temperatura média estimada (PVGIS não retorna diretamente, usar aproximação)
    const temperaturaMedia = 20; // Valor padrão, pode ser melhorado com dados climáticos
    
    // Processar componentes de radiação se disponíveis
    const componentesRadiacao = outputs.radiation_components ? {
      direta: outputs.radiation_components.beam.map(month => month.H_d),
      difusa: outputs.radiation_components.diffuse.map(month => month.H_d),
      refletida: outputs.radiation_components.reflected.map(month => month.H_d)
    } : undefined;

    // Processar ângulos ótimos se disponíveis
    const angulosOtimos = outputs.hourly_optimal ? {
      inclinacao: outputs.hourly_optimal.annual_optimal.inclination,
      azimute: outputs.hourly_optimal.annual_optimal.azimuth
    } : undefined;

    return {
      irradiacaoMensal,
      irradiacaoAnual,
      temperaturaMedia,
      perdas: {
        angular: outputs.totals.l_aoi,
        espectral: outputs.totals.l_spec,
        temperatura: outputs.totals.l_tg,
        total: outputs.totals.l_total
      },
      producaoEstimada: {
        diaria: outputs.totals.E_d,
        mensal: outputs.monthly.map(month => month.E_m),
        anual: outputs.totals.E_y
      },
      coordenadas: {
        latitude: inputs.location.latitude,
        longitude: inputs.location.longitude
      },
      elevacao: inputs.location.elevation,
      componentesRadiacao,
      angulosOtimos
    };
  }

  /**
   * Calcula fator de correção para diferentes tecnologias de módulos
   */
  getTechnologyCorrection(technology: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown'): number {
    const corrections = {
      'crystSi': 1.0,    // Silício cristalino (referência)
      'CIS': 0.95,       // Copper Indium Selenide
      'CdTe': 0.92,      // Cadmium Telluride
      'Unknown': 0.98    // Tecnologia desconhecida
    };
    
    return corrections[technology] || 1.0;
  }

  /**
   * Estima perdas por sombreamento baseado no perfil de horizonte
   */
  calculateShadingLosses(horizonData: PVGISHorizonResponse, panelTilt: number = 30): number {
    const horizonProfile = horizonData.outputs.horizon_profile;
    
    // Calcular perdas por sombreamento baseado no perfil de horizonte
    // Esta é uma aproximação simplificada
    let totalShadingFactor = 0;
    let validPoints = 0;

    for (const point of horizonProfile) {
      // Considerar apenas azimutes relevantes para painéis solares (90° - 270°)
      if (point.A >= 90 && point.A <= 270) {
        // Calcular fator de sombreamento baseado na elevação do horizonte
        const shadingFactor = Math.max(0, Math.min(1, point.H_hor / 30)); // 30° como referência
        totalShadingFactor += shadingFactor;
        validPoints++;
      }
    }

    if (validPoints === 0) return 0;

    const averageShadingFactor = totalShadingFactor / validPoints;
    
    // Converter fator de sombreamento em porcentagem de perda
    return Math.round(averageShadingFactor * 100 * 0.1); // Máximo 10% de perdas por sombreamento
  }
}

// Singleton instance
let pvgisInstance: PVGISAPI | null = null;

export const getPVGISAPI = (): PVGISAPI => {
  if (!pvgisInstance) {
    pvgisInstance = new PVGISAPI();
  }
  return pvgisInstance;
};

export type {
  Location,
  PVGISRequest,
  PVGISResponse,
  PVGISMonthlyData,
  PVGISTotals,
  PVGISHorizonRequest,
  PVGISHorizonResponse,
  PVGISDailyRadiationRequest,
  PVGISDailyRadiationResponse
};