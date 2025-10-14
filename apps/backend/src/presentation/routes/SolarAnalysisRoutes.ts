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
  
  // Apply authentication to all solar routes except for testing
  // router.use(authMiddleware.authenticate());

  // Solar analysis endpoint
  router.post('/analyze', solarAnalysisController.analyzePotential.bind(solarAnalysisController));
  
  // Solar system calculation endpoint
  router.post('/calculate-system', solarAnalysisController.calculateSolarSystem.bind(solarAnalysisController));
  
  // Irradiation correction endpoint
  router.post('/calculate-irradiation-correction', solarAnalysisController.calculateIrradiationCorrection.bind(solarAnalysisController));
  

  
  // Monthly irradiation analysis endpoint
  router.post('/analyze-monthly-irradiation', solarAnalysisController.analyzeMonthlyIrradiation.bind(solarAnalysisController));
  
  // Advanced module calculation endpoint
  router.post('/calculate-advanced-modules', solarAnalysisController.calculateAdvancedModules.bind(solarAnalysisController));
  
  // Enhanced analysis data endpoint (irradiation + losses)
  router.get('/enhanced-analysis-data', solarAnalysisController.getEnhancedAnalysisData.bind(solarAnalysisController));
  
  // Advanced financial analysis endpoint
  router.post('/calculate-advanced-financial', solarAnalysisController.calculateAdvancedFinancialAnalysis.bind(solarAnalysisController));

  // MPPT calculation endpoint
  router.post('/pvlib/mppt/calculate-modules-per-mppt', solarAnalysisController.calculateMPPTLimits.bind(solarAnalysisController));

  // Complete solar system calculation endpoint (PVGIS + ModelChain)
  router.post('/calculate-complete-system', solarAnalysisController.calculateCompleteSolarSystem.bind(solarAnalysisController));

  return router;
};

export default createSolarAnalysisRoutes;