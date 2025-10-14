import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { PvgisApiService, PvgisData } from '../../../infrastructure/external-apis/PvgisApiService';

import { CalculationLogger } from '../../../domain/services/CalculationLogger';

export interface GetPVGISMRDataRequest {
  latitude: number;
  longitude: number;
  azimuth?: number;
  tilt?: number;
  raddatabase?: string;
  useCache?: boolean;
}

export interface GetPVGISMRDataResponse {
  irradiationData: PvgisData;
  metadata: {
    source: string;
    timestamp: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    parameters: {
      azimuth?: number;
      tilt?: number;
      raddatabase?: string;
    };
    cacheHit: boolean;
  };
}

export class GetPVGISMRDataUseCase implements IUseCase<GetPVGISMRDataRequest, Result<GetPVGISMRDataResponse>> {
  private cache: Map<string, { data: GetPVGISMRDataResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    private pvgisApiService: PvgisApiService,
    private logger: CalculationLogger
  ) {}

  async execute(request: GetPVGISMRDataRequest): Promise<Result<GetPVGISMRDataResponse>> {
    this.logger.info('GetPVGISMRDataUseCase', 'Iniciando obtenção de dados de irradiação MR', {
      coordinates: { lat: request.latitude, lng: request.longitude },
      parameters: {
        azimuth: request.azimuth,
        tilt: request.tilt,
        raddatabase: request.raddatabase
      }
    });
    
    try {
      // 1. Validações de negócio
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return Result.failure(validation.errors.join(', '));
      }

      this.logger.info('Validação', 'Requisição validada com sucesso', {
        coordinates: { lat: request.latitude, lng: request.longitude },
        dataSource: request.raddatabase || 'PVGIS-SARAH2',
        useCache: request.useCache
      });

      // 2. Verificar cache (se habilitado)
      const cacheKey = this.generateCacheKey(request);
      if (request.useCache) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          this.logger.info('Cache', 'Dados recuperados do cache', { cacheKey });
          return Result.success({
            ...cached.data,
            metadata: { ...cached.data.metadata, cacheHit: true }
          });
        }
      }

      // 3. Buscar dados da API PVGIS MR (Monthly Radiation)
      this.logger.info('API', 'Buscando dados da API PVGIS MR', {
        endpoint: 'MRcalc',
        params: {
          lat: request.latitude,
          lng: request.longitude,
          tilt: request.tilt || 0,
          azimuth: request.azimuth || 0,
          raddatabase: request.raddatabase || 'PVGIS-SARAH2'
        }
      });

      const irradiationData = await this.pvgisApiService.getMonthlyRadiation(
        request.latitude,
        request.longitude,
        {
          angle: request.tilt || 0,
          aspect: request.azimuth || 0
        }
      );

      // 4. Processar e validar resposta
      const processedData = this.processIrradiationData(irradiationData, request);

      // 5. Salvar no cache
      if (request.useCache) {
        this.cache.set(cacheKey, { data: processedData, timestamp: Date.now() });
        this.logger.info('Cache', 'Dados salvos no cache', { cacheKey });
      }

      // 6. Retornar resultado
      this.logger.result('Sucesso', 'Dados de irradiação MR obtidos com sucesso', {
        hasMonthlyData: !!processedData.irradiationData.outputs?.monthly_radiation,
        dataPoints: processedData.irradiationData.outputs?.monthly_radiation?.length || 0,
        source: processedData.metadata.source
      });

      return Result.success({
        ...processedData,
        metadata: { ...processedData.metadata, cacheHit: false }
      });

    } catch (error: any) {
      this.logger.error('Erro', 'Falha ao obter dados de irradiação MR', {
        error: error.message,
        stack: error.stack
      });

      if (error.response?.status === 400) {
        return Result.failure('Parâmetros inválidos para a API PVGIS');
      }

      if (error.response?.status === 404) {
        return Result.failure('Localização não encontrada na base de dados PVGIS');
      }

      if (error.response?.status >= 500) {
        return Result.failure('Serviço PVGIS temporariamente indisponível');
      }

      return Result.failure(`Erro ao obter dados de irradiação MR: ${error.message}`);
    }
  }

  private validateRequest(request: GetPVGISMRDataRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate coordinates
    if (!request.latitude || !request.longitude) {
      errors.push('Latitude e longitude são obrigatórias');
    }

    if (request.latitude && (request.latitude < -90 || request.latitude > 90)) {
      errors.push('Latitude deve estar entre -90 e 90 graus');
    }

    if (request.longitude && (request.longitude < -180 || request.longitude > 180)) {
      errors.push('Longitude deve estar entre -180 e 180 graus');
    }

    // Validate optional parameters
    if (request.tilt !== undefined && (request.tilt < 0 || request.tilt > 90)) {
      errors.push('Inclinação deve estar entre 0 e 90 graus');
    }

    if (request.azimuth !== undefined && (request.azimuth < -180 || request.azimuth > 180)) {
      errors.push('Azimute deve estar entre -180 e 180 graus');
    }

    if (request.raddatabase && !['PVGIS-SARAH2', 'PVGIS-ERA5', 'PVGIS-COSMO'].includes(request.raddatabase)) {
      errors.push('Base de dados de radiação inválida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateCacheKey(request: GetPVGISMRDataRequest): string {
    const { latitude, longitude, azimuth = 0, tilt = 0, raddatabase = 'PVGIS-SARAH2' } = request;
    return `pvgis_mr_${latitude}_${longitude}_${azimuth}_${tilt}_${raddatabase}`;
  }

  private processIrradiationData(
    data: PvgisData, 
    request: GetPVGISMRDataRequest
  ): GetPVGISMRDataResponse {
    // Validate response structure
    if (!data.outputs || !data.outputs.monthly_radiation) {
      throw new Error('Resposta inválida da API PVGIS: dados mensais não encontrados');
    }

    if (!Array.isArray(data.outputs.monthly_radiation) || data.outputs.monthly_radiation.length !== 12) {
      throw new Error('Dados mensais de irradiação inválidos: esperado 12 meses');
    }

    // Validate data quality
    const invalidMonths = data.outputs.monthly_radiation
      .map((value, index) => ({ value, month: index + 1 }))
      .filter(item => item.value < 0 || !isFinite(item.value));

    if (invalidMonths.length > 0) {
      this.logger.info('Validação', 'Meses com dados inválidos encontrados', {
        invalidMonths: invalidMonths.map(item => item.month)
      });
    }

    return {
      irradiationData: data,
      metadata: {
        source: 'PVGIS-MR',
        timestamp: new Date().toISOString(),
        coordinates: {
          latitude: request.latitude,
          longitude: request.longitude
        },
        parameters: {
          azimuth: request.azimuth,
          tilt: request.tilt,
          raddatabase: request.raddatabase
        },
        cacheHit: false
      }
    };
  }
}