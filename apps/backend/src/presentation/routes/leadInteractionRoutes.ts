import { Router } from 'express';
import { Container } from '@/infrastructure/di/Container';
import { LeadInteractionController } from '../controllers/LeadInteractionController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { createLeadInteractionValidation, updateLeadInteractionValidation } from '../validation/leadInteractionValidation';

export function createLeadInteractionRoutes(container: Container): Router {
  const router = Router();
  
  const controller = container.resolve<LeadInteractionController>('LeadInteractionController');
  const authMiddleware = new AuthMiddleware(container);

  // Apply authentication middleware to all routes
  router.use(authMiddleware.authenticate());

  // Routes
  router.post('/', 
    ValidationMiddleware.handleValidationErrors(),
    controller.create.bind(controller)
  );
  router.get('/lead/:leadId', controller.getByLeadId.bind(controller));
  router.put('/:id', 
    ValidationMiddleware.handleValidationErrors(),
    controller.update.bind(controller)
  );
  router.delete('/:id', controller.delete.bind(controller));

  return router;
}