import axios, { AxiosInstance } from 'axios';

export interface PvgisConfig {
  baseUrl: string;
  defaultParams: {
    outputformat: string;
    browser: number;
  };
}

export interface PvgisData {
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
    };
  };
  outputs: {
    monthly_radiation: number[];
    totals: {
      fixed: {
        E_d: number;
        E_m: number;
        E_y: number;
        H_sun: number;
      };
    };
  };
}

export class PvgisApiService {
  private client: AxiosInstance;

  constructor(private config: PvgisConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      params: config.defaultParams,
      timeout: 60000, // 60 segundos
    });
  }

  async getMonthlyRadiation(
    latitude: number, 
    longitude: number,
    params: {
      pvcalculation?: number;
      peakpower?: number;
      loss?: number;
      mountingplace?: string;
      angle?: number;
      aspect?: number;
    } = {}
  ): Promise<PvgisData> {
    try {
      const response = await this.client.get('/PVcalc', {
        params: {
          lat: latitude,
          lon: longitude,
          pvcalculation: params.pvcalculation || 1,
          peakpower: params.peakpower || 1,
          loss: params.loss || 14,
          mountingplace: params.mountingplace || 'free',
          angle: params.angle,
          aspect: params.aspect,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao buscar dados do PVGIS: ${error.message}`);
    }
  }

  async getMonthlyRadiationCalc(
    latitude: number,
    longitude: number,
    params: {
      raddatabase?: string;
      outputformat?: string;
      startyear?: number;
      endyear?: number;
      mountingplace?: string;
      angle?: number;
      aspect?: number;
    } = {}
  ): Promise<any> {
    try {
      console.log('🌞 Iniciando requisição PVGIS MRcalc:', { latitude, longitude, params });
      
      const requestParams = {
        lat: latitude,
        lon: longitude,
        raddatabase: params.raddatabase || 'PVGIS-SARAH2',
        outputformat: params.outputformat || 'json',
        startyear: params.startyear || 2016,
        endyear: params.endyear || 2020,
        mountingplace: params.mountingplace || 'free',
        angle: params.angle || 0,
        aspect: params.aspect || 0,
      };

      console.log('📝 Parâmetros da requisição:', requestParams);
      console.log('🔗 URL completa:', `${this.client.defaults.baseURL}/MRcalc`);

      const response = await this.client.get('/MRcalc', {
        params: requestParams,
      });

      console.log('✅ Resposta PVGIS recebida com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro na requisição PVGIS MRcalc:', error.message);
      throw new Error(`Erro ao buscar dados MRcalc do PVGIS: ${error.message}`);
    }
  }

  async getHourlyRadiation(
    latitude: number,
    longitude: number,
    year: number
  ): Promise<any> {
    try {
      const response = await this.client.get('/seriescalc', {
        params: {
          lat: latitude,
          lon: longitude,
          startyear: year,
          endyear: year,
          pvcalculation: 1,
          peakpower: 1,
          loss: 14,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao buscar dados horários do PVGIS: ${error.message}`);
    }
  }
}