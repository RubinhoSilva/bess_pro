import { Request, Response } from 'express';
import { Container } from '../../infrastructure/di/Container';

export class PerformanceMetricsController {
  
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const alertRepository = Container.getClientAlertRepository() as any;
      const connectionPool = Container.getMongoConnectionPool() as any;
      const cacheService = Container.getPaginationCacheService() as any;

      // Coletar métricas de diferentes componentes
      const [
        repositoryMetrics,
        connectionMetrics,
        cacheMetrics,
        healthCheck
      ] = await Promise.all([
        alertRepository?.getPerformanceMetrics ? alertRepository.getPerformanceMetrics().catch(() => ({})) : Promise.resolve({}),
        connectionPool?.getMetrics() || {},
        cacheService?.getCacheStats().catch(() => ({})) || {},
        connectionPool?.healthCheck().catch(() => ({ status: 'unknown' })) || { status: 'unknown' }
      ]);

      // Métricas do sistema
      const systemMetrics = {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage()
      };

      const metrics = {
        timestamp: new Date().toISOString(),
        system: systemMetrics,
        database: {
          connection: connectionMetrics,
          health: healthCheck,
          repository: repositoryMetrics
        },
        cache: cacheMetrics,
        performance: {
          avgResponseTime: connectionMetrics.performance?.avgResponseTime || 0,
          p95ResponseTime: connectionMetrics.performance?.p95ResponseTime || 0,
          queriesExecuted: connectionMetrics.queriesExecuted || 0,
          errors: connectionMetrics.errors || 0,
          cacheHitRate: cacheMetrics.hitRate || 0
        }
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance metrics'
      });
    }
  }

  async getDatabaseStats(req: Request, res: Response): Promise<void> {
    try {
      const alertRepository = Container.getClientAlertRepository() as any;
      const connectionPool = Container.getMongoConnectionPool() as any;

      if (!connectionPool?.isConnected()) {
        res.status(503).json({
          success: false,
          error: 'Database not connected'
        });
        return;
      }

      const [healthCheck, repositoryMetrics] = await Promise.all([
        connectionPool?.healthCheck ? connectionPool.healthCheck() : Promise.resolve({ status: 'unknown' }),
        alertRepository?.getPerformanceMetrics ? alertRepository.getPerformanceMetrics() : Promise.resolve({})
      ]);

      res.json({
        success: true,
        data: {
          health: healthCheck,
          metrics: repositoryMetrics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting database stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get database stats'
      });
    }
  }

  async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const cacheService = Container.getPaginationCacheService() as any;
      
      if (!cacheService) {
        res.status(503).json({
          success: false,
          error: 'Cache service not available'
        });
        return;
      }

      const stats = await cacheService?.getCacheStats() || {};

      res.json({
        success: true,
        data: {
          ...stats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cache stats'
      });
    }
  }

  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const cacheService = Container.getPaginationCacheService() as any;
      
      if (!cacheService) {
        res.status(503).json({
          success: false,
          error: 'Cache service not available'
        });
        return;
      }

      const { pattern } = req.body;
      await cacheService?.invalidateCache ? cacheService.invalidateCache(pattern || '*') : Promise.resolve();

      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }

  async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const connectionPool = Container.getMongoConnectionPool() as any;
      const cacheService = Container.getPaginationCacheService() as any;

      const checks = {
        database: connectionPool?.healthCheck ? await connectionPool.healthCheck() : { status: 'unavailable' },
        cache: cacheService ? { status: 'healthy' } : { status: 'unavailable' },
        memory: {
          status: process.memoryUsage().heapUsed < 1024 * 1024 * 1024 ? 'healthy' : 'warning', // 1GB
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          limit: 1024
        },
        uptime: {
          status: process.uptime() > 60 ? 'healthy' : 'starting',
          seconds: Math.round(process.uptime())
        }
      };

      const overallStatus = Object.values(checks).every(check => 
        typeof check === 'object' && 'status' in check && check.status === 'healthy'
      ) ? 'healthy' : 'degraded';

      const statusCode = overallStatus === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks
      });
    } catch (error) {
      console.error('Error in health check:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  }

  async getIndexStats(req: Request, res: Response): Promise<void> {
    try {
      const connectionPool = Container.getMongoConnectionPool() as any;
      
      if (!connectionPool?.isConnected()) {
        res.status(503).json({
          success: false,
          error: 'Database not connected'
        });
        return;
      }

      // Obter estatísticas dos índices
      if (!connectionPool?.isConnected()) {
        throw new Error('Database not connected');
      }
      
      const db = (connectionPool as any).connection?.db;
      if (!db) {
        throw new Error('Database instance not available');
      }

      const collections = await db.listCollections().toArray();
      const indexStats = [];

      for (const collection of collections) {
        try {
          const collectionObj = db.collection(collection.name);
          const indexes = await collectionObj.listIndexes().toArray();
          const stats = await collectionObj.indexStats().toArray();
          
          indexStats.push({
            collection: collection.name,
            indexes: indexes.map((index: any) => ({
              name: index.name,
              key: index.key,
              unique: index.unique || false,
              sparse: index.sparse || false,
              background: index.background || false
            })),
            usage: stats
          });
        } catch (error) {
          console.warn(`Error getting stats for collection ${collection.name}:`, error);
        }
      }

      res.json({
        success: true,
        data: {
          indexStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting index stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get index stats'
      });
    }
  }
}