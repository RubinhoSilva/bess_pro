import axios, { AxiosResponse } from 'axios';

export interface IrradiationData {
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
  };
  monthly_irradiation: number[]; // kWh/m²/day for each month
  annual_irradiation: number; // kWh/m²/year
  optimal_tilt: number; // degrees
  optimal_azimuth: number; // degrees
  temperature_data: {
    monthly_avg: number[]; // °C for each month
    annual_avg: number; // °C
  };
  sun_hours: number[]; // hours per month
  source: 'PVGIS' | 'NASA' | 'NREL' | 'INMET';
}

export interface PVGISResponse {
  outputs: {
    monthly: Array<{
      month: number;
      H_sun: number; // Sun hours
      H_m: number; // Monthly irradiation
      T2m: number; // Temperature
    }>;
    totals: {
      H_y: number; // Yearly irradiation
      H_m: number; // Monthly average
    };
    meta: {
      latitude: number;
      longitude: number;
      elevation: number;
      timezone: string;
    };
  };
}

export interface NASAResponse {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: Record<string, number>; // Monthly values
      T2M: Record<string, number>; // Temperature
    };
  };
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export class SolarIrradiationService {
  private static readonly PVGIS_BASE_URL = 'https://re.jrc.ec.europa.eu/api/v5_2';
  private static readonly NASA_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
  private static readonly INMET_BASE_URL = 'https://apitempo.inmet.gov.br/radiacao';

  /**
   * Obter dados de irradiação solar usando múltiplas fontes
   */
  static async getIrradiationData(
    latitude: number,
    longitude: number,
    preferredSource: 'PVGIS' | 'NASA' | 'AUTO' = 'AUTO'
  ): Promise<IrradiationData> {
    // Validação de coordenadas
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90 graus');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180 graus');
    }

    let data: IrradiationData | null = null;
    const errors: string[] = [];

    // Tentar fontes em ordem de preferência
    const sources = preferredSource === 'AUTO' 
      ? ['PVGIS', 'NASA', 'INMET']
      : [preferredSource, 'PVGIS', 'NASA'];

    for (const source of sources) {
      try {
        switch (source) {
          case 'PVGIS':
            data = await this.getPVGISData(latitude, longitude);
            break;
          case 'NASA':
            data = await this.getNASAData(latitude, longitude);
            break;
          case 'INMET':
            data = await this.getINMETData(latitude, longitude);
            break;
        }
        if (data) break;
      } catch (error: any) {
        errors.push(`${source}: ${error.message}`);
        continue;
      }
    }

    if (!data) {
      throw new Error(`Falha ao obter dados de irradiação: ${errors.join('; ')}`);
    }

    return data;
  }

  /**
   * Obter dados do PVGIS (European Commission)
   */
  private static async getPVGISData(latitude: number, longitude: number): Promise<IrradiationData> {
    const url = `${this.PVGIS_BASE_URL}/seriescalc`;
    const params = {
      lat: latitude,
      lon: longitude,
      raddatabase: 'PVGIS-SARAH2',
      browser: '0',
      outputformat: 'json',
      usehorizon: '1',
      userhorizon: '',
      startyear: '2016',
      endyear: '2020',
      pvcalculation: '1',
      peakpower: '1',
      pvtechchoice: 'crystSi',
      mountingplace: 'free',
      loss: '14',
      trackingtype: '0',
      tilt: 'nan', // Otimizar automaticamente
      azim: '0'
    };

    try {
      const response: AxiosResponse<PVGISResponse> = await axios.get(url, { 
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'BESS-Pro Solar Calculator'
        }
      });

      if (!response.data?.outputs) {
        throw new Error('Resposta inválida do PVGIS');
      }

      const outputs = response.data.outputs;
      const monthly = outputs.monthly || [];
      const meta = outputs.meta || {};

      // Processar dados mensais
      const monthly_irradiation = new Array(12).fill(0);
      const temperature_data = new Array(12).fill(20);
      const sun_hours = new Array(12).fill(0);

      monthly.forEach(item => {
        if (item.month >= 1 && item.month <= 12) {
          monthly_irradiation[item.month - 1] = item.H_m || 0;
          temperature_data[item.month - 1] = item.T2m || 20;
          sun_hours[item.month - 1] = item.H_sun || 0;
        }
      });

      // Calcular totais
      const annual_irradiation = outputs.totals?.H_y || 
        monthly_irradiation.reduce((sum, val) => sum + val, 0) * 30.44; // médias mensais * dias médios

      const annual_avg_temp = temperature_data.reduce((sum, val) => sum + val, 0) / 12;

      return {
        location: {
          latitude: meta.latitude || latitude,
          longitude: meta.longitude || longitude,
          elevation: meta.elevation || 0,
          timezone: meta.timezone || 'UTC'
        },
        monthly_irradiation,
        annual_irradiation,
        optimal_tilt: this.calculateOptimalTilt(latitude),
        optimal_azimuth: latitude >= 0 ? 180 : 0, // Sul para hemisfério norte, Norte para sul
        temperature_data: {
          monthly_avg: temperature_data,
          annual_avg: annual_avg_temp
        },
        sun_hours,
        source: 'PVGIS'
      };
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout ao acessar PVGIS - tente novamente');
      }
      throw new Error(`Erro PVGIS: ${error.message}`);
    }
  }

  /**
   * Obter dados da NASA POWER
   */
  private static async getNASAData(latitude: number, longitude: number): Promise<IrradiationData> {
    const url = this.NASA_BASE_URL;
    const params = {
      parameters: 'ALLSKY_SFC_SW_DWN,T2M',
      community: 'RE',
      longitude: longitude,
      latitude: latitude,
      start: '2020',
      end: '2020',
      format: 'JSON'
    };

    try {
      const response: AxiosResponse<NASAResponse> = await axios.get(url, { 
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'BESS-Pro Solar Calculator'
        }
      });

      if (!response.data?.properties?.parameter) {
        throw new Error('Resposta inválida da NASA');
      }

      const data = response.data.properties.parameter;
      const irradiation = data.ALLSKY_SFC_SW_DWN || {};
      const temperature = data.T2M || {};

      // Converter dados mensais
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const monthly_irradiation = months.map(month => {
        const key = `2020${month}`;
        return (irradiation[key] || 0) * 30.44 / 1000; // kWh/m²/month
      });

      const temperature_data = months.map(month => {
        const key = `2020${month}`;
        return temperature[key] || 20;
      });

      const annual_irradiation = monthly_irradiation.reduce((sum, val) => sum + val, 0);
      const annual_avg_temp = temperature_data.reduce((sum, val) => sum + val, 0) / 12;

      // Estimativa de horas de sol (simplificada)
      const sun_hours = monthly_irradiation.map(irr => Math.min(irr / 6, 12));

      return {
        location: {
          latitude,
          longitude,
          elevation: 0, // NASA não fornece elevação
          timezone: this.getTimezoneFromLongitude(longitude)
        },
        monthly_irradiation,
        annual_irradiation,
        optimal_tilt: this.calculateOptimalTilt(latitude),
        optimal_azimuth: latitude >= 0 ? 180 : 0,
        temperature_data: {
          monthly_avg: temperature_data,
          annual_avg: annual_avg_temp
        },
        sun_hours,
        source: 'NASA'
      };
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout ao acessar NASA POWER - tente novamente');
      }
      throw new Error(`Erro NASA: ${error.message}`);
    }
  }

  /**
   * Obter dados do INMET (para Brasil)
   */
  private static async getINMETData(latitude: number, longitude: number): Promise<IrradiationData> {
    // Verificar se está no Brasil
    if (latitude > 5 || latitude < -34 || longitude > -34 || longitude < -74) {
      throw new Error('INMET disponível apenas para território brasileiro');
    }

    // Para implementação futura - INMET não tem API pública de irradiação
    // Por enquanto, usar dados estimados para o Brasil
    const brazilian_irradiation = this.getBrazilianIrradiationEstimate(latitude, longitude);
    
    return {
      ...brazilian_irradiation,
      source: 'INMET'
    };
  }

  /**
   * Estimativa de irradiação para o Brasil baseada em dados históricos
   */
  private static getBrazilianIrradiationEstimate(latitude: number, longitude: number): IrradiationData {
    // Dados estimados baseados no Atlas Solar Brasileiro
    const base_irradiation = 4.5; // kWh/m²/day média nacional
    
    // Ajuste por região
    let regional_factor = 1.0;
    if (latitude > -10) { // Nordeste
      regional_factor = 1.3;
    } else if (latitude > -20) { // Centro-Oeste
      regional_factor = 1.1;
    } else if (latitude > -30) { // Sudeste
      regional_factor = 1.0;
    } else { // Sul
      regional_factor = 0.9;
    }

    const daily_irradiation = base_irradiation * regional_factor;
    
    // Variação sazonal (verão/inverno)
    const seasonal_variation = [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2];
    const monthly_irradiation = seasonal_variation.map(factor => daily_irradiation * factor * 30.44);
    
    const annual_irradiation = monthly_irradiation.reduce((sum, val) => sum + val, 0);
    
    // Temperatura estimada
    const base_temp = latitude > -15 ? 26 : latitude > -25 ? 22 : 18;
    const temp_variation = [2, 1, 0, -2, -4, -5, -4, -2, 0, 1, 2, 2];
    const temperature_data = temp_variation.map(delta => base_temp + delta);
    
    const sun_hours = [7, 7.5, 6, 5.5, 5, 4.5, 5, 5.5, 6, 6.5, 7, 7.5];

    return {
      location: {
        latitude,
        longitude,
        elevation: 0,
        timezone: 'America/Sao_Paulo'
      },
      monthly_irradiation,
      annual_irradiation,
      optimal_tilt: this.calculateOptimalTilt(latitude),
      optimal_azimuth: 180, // Sul
      temperature_data: {
        monthly_avg: temperature_data,
        annual_avg: temperature_data.reduce((sum, val) => sum + val, 0) / 12
      },
      sun_hours,
      source: 'INMET'
    };
  }

  /**
   * Calcular inclinação ótima baseada na latitude
   */
  private static calculateOptimalTilt(latitude: number): number {
    // Regra geral: inclinação ótima = latitude ± 15°
    const abs_latitude = Math.abs(latitude);
    
    if (abs_latitude < 15) {
      return 15; // Mínimo para auto-limpeza
    } else if (abs_latitude > 60) {
      return 45; // Máximo prático
    } else {
      return Math.round(abs_latitude);
    }
  }

  /**
   * Estimar timezone baseado na longitude
   */
  private static getTimezoneFromLongitude(longitude: number): string {
    const offset = Math.round(longitude / 15);
    
    // Timezones específicos para regiões conhecidas
    if (longitude > -75 && longitude < -34) {
      return 'America/Sao_Paulo'; // Brasil
    } else if (longitude > -180 && longitude < -60) {
      return 'America/New_York';
    } else if (longitude > -15 && longitude < 45) {
      return 'Europe/Berlin';
    } else {
      return `UTC${offset >= 0 ? '+' : ''}${offset}`;
    }
  }

  /**
   * Validar qualidade dos dados obtidos
   */
  static validateIrradiationData(data: IrradiationData): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;

    // Verificar valores de irradiação
    if (data.annual_irradiation < 800 || data.annual_irradiation > 2500) {
      warnings.push(`Irradiação anual suspeita: ${data.annual_irradiation.toFixed(1)} kWh/m²/ano`);
    }

    // Verificar dados mensais
    data.monthly_irradiation.forEach((value, index) => {
      if (value < 50 || value > 250) {
        warnings.push(`Irradiação do mês ${index + 1} suspeita: ${value.toFixed(1)} kWh/m²/mês`);
      }
    });

    // Verificar temperaturas
    const avgTemp = data.temperature_data.annual_avg;
    if (avgTemp < -20 || avgTemp > 50) {
      warnings.push(`Temperatura média suspeita: ${avgTemp.toFixed(1)}°C`);
      isValid = false;
    }

    // Verificar consistência
    const calculatedAnnual = data.monthly_irradiation.reduce((sum, val) => sum + val, 0);
    const difference = Math.abs(calculatedAnnual - data.annual_irradiation) / data.annual_irradiation;
    
    if (difference > 0.1) { // 10% de diferença
      warnings.push('Inconsistência entre dados mensais e anuais');
    }

    return { isValid, warnings };
  }

  /**
   * Interpolar dados para coordenadas específicas
   */
  static async getInterpolatedData(
    latitude: number,
    longitude: number,
    radius: number = 0.5 // graus
  ): Promise<IrradiationData> {
    // Para implementação futura: interpolar dados de pontos próximos
    // Por enquanto, retornar dados do ponto mais próximo
    return this.getIrradiationData(latitude, longitude);
  }

  /**
   * Cache de dados para evitar chamadas desnecessárias
   */
  private static cache = new Map<string, { data: IrradiationData; timestamp: number }>();
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  static async getCachedIrradiationData(
    latitude: number,
    longitude: number,
    preferredSource: 'PVGIS' | 'NASA' | 'AUTO' = 'AUTO'
  ): Promise<IrradiationData> {
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)},${preferredSource}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.getIrradiationData(latitude, longitude, preferredSource);
    this.cache.set(key, { data, timestamp: Date.now() });
    
    return data;
  }
}