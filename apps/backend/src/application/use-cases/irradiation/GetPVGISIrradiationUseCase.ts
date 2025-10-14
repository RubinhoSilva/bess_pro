import { Result } from '../../common/Result';
import { IUseCase } from '../../common/IUseCase';
import { PvgisApiService } from '../../../infrastructure/external-apis/PvgisApiService';
import { CalculationLogger } from '../../../domain/services/CalculationLogger';

export interface GetPVGISIrradiationRequest {
  latitude: number;
  longitude: number;
  tilt?: number;
  azimuth?: number;
  dataSource?: 'pvgis' | 'nasa';
  useCache?: boolean;
}

export interface GetPVGISIrradiationResponse {
  irradiationData: any;
  metadata: {
    source: string;
    timestamp: string;
    coordinates: { lat: number; lng: number };
    cacheHit: boolean;
  };
}

/**
 * Use case for getting solar irradiation data from PVGIS API
 * 
 * This use case handles fetching solar irradiation data from PVGIS or NASA,
 * with caching support and proper validation for Docker environments.
 */
export class GetPVGISIrradiationUseCase implements IUseCase<GetPVGISIrradiationRequest, Result<GetPVGISIrradiationResponse>> {
  private cache: Map<string, { data: GetPVGISIrradiationResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    private pvgisApiService: PvgisApiService
  ) {}

  async execute(request: GetPVGISIrradiationRequest): Promise<Result<GetPVGISIrradiationResponse>> {
    const logger = new CalculationLogger(`pvgis-${Date.now()}`);
    
    try {
      // 1. Validações de negócio
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return Result.failure(validation.errors.join(', '));
      }

      logger.info('Validação', 'Requisição validada com sucesso', {
        coordinates: { lat: request.latitude, lng: request.longitude },
        dataSource: request.dataSource || 'pvgis',
        useCache: request.useCache
      });

      // 2. Verificar cache (se habilitado)
      const cacheKey = this.generateCacheKey(request);
      if (request.useCache) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          logger.info('Cache', 'Dados recuperados do cache', { cacheKey });
          return Result.success({
            ...cached.data,
            metadata: { ...cached.data.metadata, cacheHit: true }
          });
        }
      }

      // 3. Buscar dados da API PVGIS
      logger.info('API', 'Buscando dados da API PVGIS', {
        endpoint: 'monthly',
        params: {
          lat: request.latitude,
          lng: request.longitude,
          tilt: request.tilt || 0,
          azimuth: request.azimuth || 0,
          source: request.dataSource || 'pvgis'
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
      const processedData = this.processIrradiationData(irradiationData, request, logger);

      // 5. Salvar no cache
      if (request.useCache) {
        this.saveToCache(cacheKey, processedData);
        logger.info('Cache', 'Dados salvos no cache', { cacheKey });
      }

      // 6. Retornar resultado
      logger.result('Sucesso', 'Dados de irradiação obtidos com sucesso', {
        hasMonthlyData: !!processedData.irradiationData.outputs?.monthly,
        dataPoints: processedData.irradiationData.outputs?.monthly?.length || 0,
        source: processedData.metadata.source
      });

      return Result.success({
        ...processedData,
        metadata: { ...processedData.metadata, cacheHit: false }
      });

    } catch (error: any) {
      logger.error('Erro', 'Falha ao obter dados de irradiação', {
        error: error.message,
        stack: error.stack
      });
      
      return Result.failure(`Erro ao buscar dados PVGIS: ${error.message}`);
    }
  }

  /**
   * Validates the request according to business rules
   */
  private validateRequest(request: GetPVGISIrradiationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate coordinates
    if (!this.isValidCoordinates(request.latitude, request.longitude)) {
      errors.push('Coordenadas inválidas. Latitude deve estar entre -90 e 90, longitude entre -180 e 180');
    }

    // Validate tilt
    if (request.tilt !== undefined) {
      if (typeof request.tilt !== 'number' || request.tilt < 0 || request.tilt > 90) {
        errors.push('Inclinação (tilt) deve ser um número entre 0 e 90 graus');
      }
    }

    // Validate azimuth
    if (request.azimuth !== undefined) {
      if (typeof request.azimuth !== 'number' || request.azimuth < -180 || request.azimuth > 180) {
        errors.push('Azimute deve ser um número entre -180 e 180 graus');
      }
    }

    // Validate data source
    if (request.dataSource && !['pvgis', 'nasa'].includes(request.dataSource)) {
      errors.push('Fonte de dados deve ser "pvgis" ou "nasa"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates geographic coordinates
   */
  private isValidCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 && 
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }

  /**
   * Generates cache key for the request
   */
  private generateCacheKey(request: GetPVGISIrradiationRequest): string {
    const key = {
      lat: request.latitude.toFixed(4),
      lng: request.longitude.toFixed(4),
      tilt: request.tilt || 0,
      azimuth: request.azimuth || 0,
      source: request.dataSource || 'pvgis'
    };
    return Buffer.from(JSON.stringify(key)).toString('base64');
  }

  /**
   * Gets data from cache if valid
   */
  private getFromCache(key: string): { data: GetPVGISIrradiationResponse; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Saves data to cache
   */
  private saveToCache(key: string, data: GetPVGISIrradiationResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanCache();
    }
  }

  /**
   * Removes expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Processes irradiation data from API response
   */
  private processIrradiationData(
    data: any, 
    request: GetPVGISIrradiationRequest, 
    logger: CalculationLogger
  ): GetPVGISIrradiationResponse {
    logger.info('Processamento', 'Processando dados da API PVGIS', {
      hasOutputs: !!data.outputs,
      hasMonthly: !!data.outputs?.monthly,
      monthlyCount: data.outputs?.monthly?.length || 0
    });

    // Validate response structure
    if (!data.outputs) {
      throw new Error('Resposta da API PVGIS não contém dados de saída');
    }

    if (!data.outputs.monthly || !Array.isArray(data.outputs.monthly)) {
      throw new Error('Resposta da API PVGIS não contém dados mensais válidos');
    }

    // Extract coordinates from response or use request
    const coordinates = {
      lat: data.inputs?.location?.latitude || request.latitude,
      lng: data.inputs?.location?.longitude || request.longitude
    };

    return {
      irradiationData: data,
      metadata: {
        source: 'PVGIS',
        timestamp: new Date().toISOString(),
        coordinates,
        cacheHit: false
      }
    };
  }
}