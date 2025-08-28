import axios, { AxiosInstance } from 'axios';
import { CalculationLogger } from '../../domain/services/CalculationLogger';

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
    } = {},
    logger?: CalculationLogger
  ): Promise<any> {
    try {
      logger?.context('PVGIS', 'Iniciando requisição à API PVGIS MRcalc', 
        { latitude, longitude, params }, 
        'Consultando a base de dados PVGIS (Photovoltaic Geographical Information System) para obter dados de irradiação solar mensal'
      );
      
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

      logger?.info('PVGIS', 'Parâmetros da requisição configurados', requestParams);
      logger?.info('PVGIS', 'URL da API', { 
        url: `${this.client.defaults.baseURL}/MRcalc`,
        timeout: this.client.defaults.timeout 
      });

      const startTime = Date.now();
      const response = await this.client.get('/MRcalc', {
        params: requestParams,
      });
      const responseTime = Date.now() - startTime;

      logger?.result('PVGIS', 'Dados PVGIS recebidos com sucesso', { 
        responseTimeMs: responseTime,
        dataSize: JSON.stringify(response.data).length,
        hasMonthlyData: !!response.data?.outputs?.monthly,
        hasTotals: !!response.data?.outputs?.totals
      });

      // Log dos dados mensais se disponíveis
      if (response.data?.outputs?.monthly) {
        logger?.info('PVGIS', 'Dados mensais PVGIS processados', {
          monthly: response.data.outputs.monthly,
          fonte: 'PVGIS-SARAH2 Database',
          periodo: `${requestParams.startyear}-${requestParams.endyear}`
        });
      }

      console.log('✅ Resposta PVGIS recebida com sucesso');
      return response.data;
    } catch (error: any) {
      logger?.error('PVGIS', 'Erro na requisição PVGIS MRcalc', { 
        message: error.message,
        latitude,
        longitude,
        params 
      });
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