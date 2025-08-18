import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class LeadRoutes {
  static create(container: Container): Router {
    const router = Router();
    const leadController = new LeadController(container);
    const authMiddleware = new AuthMiddleware(container);

    // All routes require authentication
    router.use(authMiddleware.authenticate());

    router.post('/',
      ValidationMiddleware.validateCreateLead(),
      ValidationMiddleware.handleValidationErrors(),
      leadController.create.bind(leadController)
    );

    router.get('/',
      ValidationMiddleware.validatePagination(),
      ValidationMiddleware.handleValidationErrors(),
      leadController.list.bind(leadController)
    );

    router.get('/:id',
      ValidationMiddleware.validateLeadId(),
      ValidationMiddleware.handleValidationErrors(),
      leadController.getById.bind(leadController)
    );

    router.put('/:id',
      ValidationMiddleware.validateUpdateLead(),
      ValidationMiddleware.handleValidationErrors(),
      leadController.update.bind(leadController)
    );

    router.delete('/:id',
      ValidationMiddleware.validateLeadId(),
      ValidationMiddleware.handleValidationErrors(),
      leadController.delete.bind(leadController)
    );

    router.post('/:id/convert',
      ValidationMiddleware.validateConvertLead(),
      ValidationMiddleware.handleValidationErrors(),
      leadController.convertToProject.bind(leadController)
    );

    router.patch('/:id/stage',
      ValidationMiddleware.validateUpdateLeadStage(),
      ValidationMiddleware.handleValidationErrors(),
      leadController.updateStage.bind(leadController)
    );

    return router;
  }
}
