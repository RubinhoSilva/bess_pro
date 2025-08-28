import { Router } from 'express';
import { CalculationController } from '../controllers/CalculationController';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class CalculationRoutes {
  static create(container: Container): Router {
    const router = Router();
    const calculationController = new CalculationController(container);
    const authMiddleware = new AuthMiddleware(container);

    // All routes require authentication
    router.use(authMiddleware.authenticate());

    // Endpoint para cálculos detalhados com logs completos - NOVO
    router.post('/detailed-calculation',
      ValidationMiddleware.handleValidationErrors(),
      calculationController.calculateWithDetailedLogs.bind(calculationController)
    );

    // Endpoint independente de projeto - NOVO
    router.post('/solar-system',
      ValidationMiddleware.handleValidationErrors(),
      calculationController.calculateSolarSystemStandalone.bind(calculationController)
    );

    // Mantendo endpoints antigos para compatibilidade (caso ainda sejam usados)
    router.post('/projects/:projectId/solar-system',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      calculationController.calculateSolarSystem.bind(calculationController)
    );

    router.post('/projects/:projectId/financial-analysis',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      calculationController.analyzeFinancial.bind(calculationController)
    );

    return router;
  }
}