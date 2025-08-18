import { Router } from 'express';
import { Model3DController } from '../controllers/Model3DController';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { FileUploadMiddleware } from '../middleware/FileUploadMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class Model3DRoutes {
  static create(container: Container): Router {
    const router = Router();
    const model3DController = new Model3DController(container);
    const authMiddleware = new AuthMiddleware(container);

    // All routes require authentication
    router.use(authMiddleware.authenticate());

    router.post('/upload',
      RateLimitMiddleware.upload(),
      FileUploadMiddleware.model3D().single('model'),
      ValidationMiddleware.validateUploadModel(),
      ValidationMiddleware.handleValidationErrors(),
      model3DController.upload.bind(model3DController)
    );

    router.get('/',
      model3DController.list.bind(model3DController)
    );

    router.get('/:id',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      model3DController.getById.bind(model3DController)
    );

    router.delete('/:id',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      model3DController.delete.bind(model3DController)
    );

    router.get('/:id/signed-url',
      ValidationMiddleware.validateProjectId(),
      ValidationMiddleware.handleValidationErrors(),
      model3DController.getSignedUrl.bind(model3DController)
    );

    return router;
  }
}