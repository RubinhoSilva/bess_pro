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
      const requestParams = {
        lat: latitude,
        lon: longitude,
        pvcalculation: params.pvcalculation || 1,
        peakpower: params.peakpower || 1,
        loss: params.loss || 14,
        mountingplace: params.mountingplace || 'free',
        angle: params.angle,
        aspect: params.aspect,
      };

      // Construir a URL completa com parâmetros para logging
      const baseUrl = this.client.defaults.baseURL;
      const endpoint = '/PVcalc';
      const queryParams = new URLSearchParams();
      
      // Adicionar todos os parâmetros à string de query
      Object.entries(requestParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const fullUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;
      
      console.log('🌐 PVGIS PVcalc URL COMPLETA:', fullUrl);
      console.log('📋 PARÂMETROS PVGIS PVcalc:', requestParams);

      const response = await this.client.get('/PVcalc', {
        params: requestParams,
      });

      console.log('✅ PVGIS PVcalc resposta recebida com sucesso');

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
      components?: number;
      hourlyoptimal?: number;
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
        components: params.components || 1,
        hourlyoptimal: params.hourlyoptimal || 1,
      };

      // Construir a URL completa com parâmetros para logging
      const baseUrl = this.client.defaults.baseURL;
      const endpoint = '/MRcalc';
      const queryParams = new URLSearchParams();
      
      // Adicionar todos os parâmetros à string de query
      Object.entries(requestParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const fullUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;
      
      logger?.info('PVGIS', 'Parâmetros da requisição configurados', requestParams);
      logger?.info('PVGIS', 'URL da API configurada', { 
        baseUrl: baseUrl,
        endpoint: endpoint,
        timeout: this.client.defaults.timeout 
      });

      // LOG DETALHADO DA URL COMPLETA ENVIADA PARA PVGIS
      logger?.info('PVGIS', '🌐 URL COMPLETA ENVIADA PARA PVGIS', { 
        fullUrl: fullUrl,
        urlLength: fullUrl.length,
        parametersCount: Object.keys(requestParams).length
      });
      
      console.log('🌐 PVGIS URL COMPLETA:', fullUrl);
      console.log('📋 PARÂMETROS PVGIS:', requestParams);

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

      // Log detalhado dos dados horários se disponíveis
      if (response.data?.outputs?.hourly) {
        logger?.info('PVGIS', 'Dados horários PVGIS detectados', {
          totalHours: response.data.outputs.hourly.length,
          firstHour: response.data.outputs.hourly[0],
          lastHour: response.data.outputs.hourly[response.data.outputs.hourly.length - 1],
          sampleHours: response.data.outputs.hourly.slice(0, 24), // Primeiras 24 horas
          avgIrradiation: response.data.outputs.hourly.reduce((sum: number, hour: any) => sum + (hour['H(i)'] || hour.irradiation || 0), 0) / response.data.outputs.hourly.length
        });
        
        // Log das primeiras 48 horas para análise detalhada
        const first48Hours = response.data.outputs.hourly.slice(0, 48);
        logger?.info('PVGIS', 'Análise das primeiras 48 horas', {
          hourlyData: first48Hours.map((hour: any, index: number) => ({
            hour: index,
            timestamp: hour.time || `Hour-${index}`,
            irradiation: hour['H(i)'] || hour.irradiation || hour['G(i)'] || 0,
            directRadiation: hour['Gb(i)'] || hour.direct || 0,
            diffuseRadiation: hour['Gd(i)'] || hour.diffuse || 0,
            temperature: hour.T2m || hour.temperature || 0,
            optimalAngle: hour.optimal_angle || 0
          }))
        });
      }

      // Log dos componentes de radiação se disponíveis
      if (response.data?.outputs?.radiation_components) {
        logger?.info('PVGIS', 'Componentes de radiação detectados', {
          hasBeam: !!response.data.outputs.radiation_components.beam,
          hasDiffuse: !!response.data.outputs.radiation_components.diffuse,
          hasReflected: !!response.data.outputs.radiation_components.reflected,
          beamSample: response.data.outputs.radiation_components.beam?.slice(0, 3),
          diffuseSample: response.data.outputs.radiation_components.diffuse?.slice(0, 3)
        });
      }

      // Log dos ângulos ótimos se disponíveis
      if (response.data?.outputs?.optimal_angles) {
        logger?.info('PVGIS', 'Ângulos ótimos detectados', {
          optimalInclination: response.data.outputs.optimal_angles.inclination,
          optimalAzimuth: response.data.outputs.optimal_angles.azimuth,
          hourlyOptimalSample: response.data.outputs.optimal_angles.hourly?.slice(0, 12)
        });
      }

      console.log('✅ Resposta PVGIS recebida com sucesso');
      
      // Debug: Log da estrutura completa da resposta PVGIS
      console.log('📊 PVGIS Response Structure:', {
        hasInputs: !!response.data?.inputs,
        hasOutputs: !!response.data?.outputs,
        outputKeys: response.data?.outputs ? Object.keys(response.data.outputs) : [],
        responseSize: JSON.stringify(response.data).length,
        requestParams: requestParams
      });
      
      // Log específico para dados horários (se existirem)
      if (response.data?.outputs?.hourly || response.data?.outputs?.['hourly_radiation']) {
        const hourlyData = response.data.outputs.hourly || response.data.outputs['hourly_radiation'];
        console.log('🕐 Dados Horários PVGIS:', {
          totalHours: hourlyData.length,
          firstEntry: hourlyData[0],
          lastEntry: hourlyData[hourlyData.length - 1],
          structureKeys: Object.keys(hourlyData[0] || {}),
          sampleData: hourlyData.slice(0, 5)
        });
      }
      
      // Log para dados de componentes
      if (response.data?.outputs?.components || response.data?.outputs?.radiation_components) {
        const components = response.data.outputs.components || response.data.outputs.radiation_components;
        console.log('🌈 Componentes de Radiação:', {
          structure: typeof components,
          keys: typeof components === 'object' ? Object.keys(components) : 'N/A',
          sample: components
        });
      }
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