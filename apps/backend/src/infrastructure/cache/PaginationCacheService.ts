import Redis from 'ioredis';
import { PaginationRequest, OffsetPaginationRequest, PaginationResponse, OffsetPaginationResponse } from '../../shared/interfaces/Pagination';

export class PaginationCacheService {
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutos
  private keyPrefix: string = 'pagination:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // Cache para paginação cursor-based
  async getCachedCursorPagination<T>(
    cacheKey: string
  ): Promise<PaginationResponse<T> | null> {
    try {
      const cachedData = await this.redis.get(this.buildKey(cacheKey));
      if (!cachedData) return null;

      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error getting cached cursor pagination:', error);
      return null;
    }
  }

  async setCachedCursorPagination<T>(
    cacheKey: string,
    data: PaginationResponse<T>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      await this.redis.setex(
        this.buildKey(cacheKey),
        ttl,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error setting cached cursor pagination:', error);
    }
  }

  // Cache para paginação offset-based
  async getCachedOffsetPagination<T>(
    cacheKey: string
  ): Promise<OffsetPaginationResponse<T> | null> {
    try {
      const cachedData = await this.redis.get(this.buildKey(cacheKey));
      if (!cachedData) return null;

      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error getting cached offset pagination:', error);
      return null;
    }
  }

  async setCachedOffsetPagination<T>(
    cacheKey: string,
    data: OffsetPaginationResponse<T>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      await this.redis.setex(
        this.buildKey(cacheKey),
        ttl,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error setting cached offset pagination:', error);
    }
  }

  // Cache para contagens
  async getCachedCount(
    cacheKey: string
  ): Promise<number | null> {
    try {
      const cachedCount = await this.redis.get(this.buildCountKey(cacheKey));
      if (cachedCount === null) return null;

      return parseInt(cachedCount, 10);
    } catch (error) {
      console.error('Error getting cached count:', error);
      return null;
    }
  }

  async setCachedCount(
    cacheKey: string,
    count: number,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      await this.redis.setex(
        this.buildCountKey(cacheKey),
        ttl,
        count.toString()
      );
    } catch (error) {
      console.error('Error setting cached count:', error);
    }
  }

  // Invalidação de cache
  async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(this.buildKey(pattern));
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  async invalidateCacheByUserId(userId: string): Promise<void> {
    await this.invalidateCache(`*:user:${userId}:*`);
  }

  async invalidateCacheByClientId(clientId: string): Promise<void> {
    await this.invalidateCache(`*:client:${clientId}:*`);
  }

  // Geração de chaves de cache
  buildCacheKey(params: {
    entity: string;
    userId?: string;
    clientId?: string;
    filters?: Record<string, any>;
    pagination: PaginationRequest | OffsetPaginationRequest;
  }): string {
    const { entity, userId, clientId, filters, pagination } = params;
    
    const keyParts = [entity];
    
    if (userId) keyParts.push(`user:${userId}`);
    if (clientId) keyParts.push(`client:${clientId}`);
    
    // Serializar filtros de forma consistente
    if (filters && Object.keys(filters).length > 0) {
      const sortedFilters = Object.keys(filters)
        .sort()
        .reduce((result, key) => {
          if (filters[key] !== undefined) {
            result[key] = filters[key];
          }
          return result;
        }, {} as Record<string, any>);
      
      const filtersString = JSON.stringify(sortedFilters);
      const filtersHash = this.generateHash(filtersString);
      keyParts.push(`filters:${filtersHash}`);
    }
    
    // Adicionar parâmetros de paginação
    if ('cursor' in pagination) {
      // Cursor-based pagination
      keyParts.push(`cursor:${(pagination as any).cursor || 'start'}`);
      keyParts.push(`limit:${pagination.limit}`);
      keyParts.push(`sort:${(pagination as any).sortBy || 'alertDate'}:${(pagination as any).sortOrder || 'desc'}`);
    } else {
      // Offset-based pagination
      keyParts.push(`page:${(pagination as any).page}`);
      keyParts.push(`limit:${pagination.limit}`);
      keyParts.push(`sort:${(pagination as any).sortBy || 'alertDate'}:${(pagination as any).sortOrder || 'desc'}`);
    }
    
    return keyParts.join(':');
  }

  // Cache inteligente com warming
  async getOrSetCachedData<T>(
    cacheKey: string,
    dataFetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      // Tentar buscar do cache primeiro
      const cachedData = await this.redis.get(this.buildKey(cacheKey));
      if (cachedData) {
        // Asynchronously refresh cache if TTL is close to expiring
        const remaining = await this.redis.ttl(this.buildKey(cacheKey));
        if (remaining < ttl * 0.2) { // Refresh when 20% of TTL remains
          this.refreshCacheAsync(cacheKey, dataFetcher, ttl);
        }
        return JSON.parse(cachedData);
      }

      // Cache miss - buscar dados e cachear
      const data = await dataFetcher();
      await this.redis.setex(
        this.buildKey(cacheKey),
        ttl,
        JSON.stringify(data)
      );
      
      return data;
    } catch (error) {
      console.error('Error in cache getOrSet:', error);
      // Fallback para buscar dados diretamente se cache falhar
      return await dataFetcher();
    }
  }

  // Refresh assíncrono para evitar cache stampede
  private async refreshCacheAsync<T>(
    cacheKey: string,
    dataFetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const data = await dataFetcher();
      await this.redis.setex(
        this.buildKey(cacheKey),
        ttl,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error refreshing cache asynchronously:', error);
    }
  }

  // Utilitários
  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private buildCountKey(key: string): string {
    return `${this.keyPrefix}count:${key}`;
  }

  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Métricas de cache
  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const hits = this.extractStatValue(info, 'keyspace_hits');
      const misses = this.extractStatValue(info, 'keyspace_misses');
      const totalKeys = await this.redis.dbsize();
      
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      return {
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { hits: 0, misses: 0, hitRate: 0, totalKeys: 0 };
    }
  }

  private extractStatValue(info: string, key: string): number {
    const match = info.match(new RegExp(`${key}:(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  }
}