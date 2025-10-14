import { Router } from 'express';
import { CalculationController } from '../controllers/CalculationController';
import { FinancialCalculationController } from '../controllers/FinancialCalculationController';
import { CalculateStandaloneSolarSystemUseCase } from '../../application/use-cases/calculation/CalculateStandaloneSolarSystemUseCase';
import { AnalyzeFinancialUseCase } from '../../application/use-cases/financial/AnalyzeFinancialUseCase';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class CalculationRoutes {
  static create(container: Container): Router {
    const router = Router();
    const calculateStandaloneSolarSystemUseCase = container.resolve<CalculateStandaloneSolarSystemUseCase>(
      ServiceTokens.CALCULATE_STANDALONE_SOLAR_SYSTEM_USE_CASE
    );
    const analyzeFinancialUseCase = container.resolve<AnalyzeFinancialUseCase>(
      ServiceTokens.ANALYZE_FINANCIAL_USE_CASE
    );
    const calculationController = new CalculationController(
      calculateStandaloneSolarSystemUseCase,
      analyzeFinancialUseCase
    );
    const financialCalculationController = container.resolve<FinancialCalculationController>(
      ServiceTokens.FinancialCalculationController
    );
    const authMiddleware = new AuthMiddleware(container);

    // All routes require authentication
    router.use(authMiddleware.authenticate());

    // Endpoint independente de projeto para cálculos solares
    router.post('/solar-system',
      ValidationMiddleware.handleValidationErrors(),
      calculationController.calculateSolarSystemStandalone.bind(calculationController)
    );

    router.post('/projects/:projectId/financial-analysis',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      calculationController.analyzeFinancial.bind(calculationController)
    );

    // Financial calculation endpoints (Python service integration)
    router.post('/projects/:projectId/calculations/financial',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      financialCalculationController.calculateProjectFinancials.bind(financialCalculationController)
    );

    router.get('/projects/:projectId/calculations/financial',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      financialCalculationController.getLastFinancialResults.bind(financialCalculationController)
    );

    return router;
  }
}