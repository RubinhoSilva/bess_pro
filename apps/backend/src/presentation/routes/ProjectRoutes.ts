import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class ProjectRoutes {
  static create(container: Container): Router {
    const router = Router();
    const projectController = new ProjectController(container);
    const authMiddleware = new AuthMiddleware(container);

    // All routes require authentication
    router.use(authMiddleware.authenticate());

    router.post('/',
      ValidationMiddleware.validateCreateProject(),
      ValidationMiddleware.handleValidationErrors(),
      projectController.create.bind(projectController)
    );

    router.get('/',
      ValidationMiddleware.validatePagination(),
      ValidationMiddleware.validateProjectFilters(),
      ValidationMiddleware.handleValidationErrors(),
      projectController.list.bind(projectController)
    );

    router.get('/:id',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      projectController.getById.bind(projectController)
    );

    router.put('/:id',
      ValidationMiddleware.validateUpdateProject(),
      ValidationMiddleware.handleValidationErrors(),
      projectController.update.bind(projectController)
    );

    router.delete('/:id',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      projectController.delete.bind(projectController)
    );

    router.post('/:id/clone',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      projectController.clone.bind(projectController)
    );

    return router;
  }
}
