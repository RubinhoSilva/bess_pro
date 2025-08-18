import { Router } from 'express';
import { ProjectBackupController } from '../controllers/ProjectBackupController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Container } from '../../infrastructure/di/Container';

export class ProjectBackupRoutes {
  private router = Router();
  private controller: ProjectBackupController;
  private authMiddleware: AuthMiddleware;

  constructor(container: Container) {
    this.controller = new ProjectBackupController(container);
    this.authMiddleware = new AuthMiddleware(container);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Export project backup
    this.router.get(
      '/:projectId/export',
      this.authMiddleware.authenticate(),
      this.controller.exportProjectBackup.bind(this.controller)
    );

    // Import project backup
    this.router.post(
      '/import',
      this.authMiddleware.authenticate(),
      this.controller.importProjectBackup.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}