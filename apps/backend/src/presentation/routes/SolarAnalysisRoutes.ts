import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { SolarAnalysisController } from '../controllers/SolarAnalysisController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export const createSolarAnalysisRoutes = (container: Container): Router => {
  const router = Router();
  
  // Get controller instance
  const solarAnalysisController = container.resolve<SolarAnalysisController>('SolarAnalysisController');
  
  // Create auth middleware instance
  const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');
  
  // Apply authentication to all solar routes
  router.use(authMiddleware.authenticate());

  // Solar analysis endpoint
  router.post('/analyze', solarAnalysisController.analyzePotential.bind(solarAnalysisController));

  return router;
};

export default createSolarAnalysisRoutes;