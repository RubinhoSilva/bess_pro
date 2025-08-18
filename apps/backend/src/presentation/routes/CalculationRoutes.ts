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