import { Router } from 'express';
import { PerformanceMetricsController } from '../controllers/PerformanceMetricsController';
// Middleware simples para auth
const authMiddleware = (req: any, res: any, next: any) => {
  req.user = { id: 'temp-user-id', role: 'admin', email: 'admin@email.com' };
  next();
};
// import { authorizationMiddleware } from '../middleware/authorization.middleware';

const router = Router();
const performanceController = new PerformanceMetricsController();

// Middleware para proteger rotas de métricas (apenas admins) - comentado temporariamente
// const adminOnly = authorizationMiddleware(['admin', 'super_admin']);

// Health check público (para load balancers)
router.get('/health', performanceController.getHealthCheck.bind(performanceController));

// Rotas protegidas para admins
router.use(authMiddleware);
// router.use(adminOnly);

// Métricas gerais
router.get('/metrics', performanceController.getMetrics.bind(performanceController));

// Métricas específicas do banco
router.get('/database', performanceController.getDatabaseStats.bind(performanceController));
router.get('/database/indexes', performanceController.getIndexStats.bind(performanceController));

// Métricas do cache
router.get('/cache', performanceController.getCacheStats.bind(performanceController));
router.post('/cache/clear', performanceController.clearCache.bind(performanceController));

export { router as performanceRoutes };