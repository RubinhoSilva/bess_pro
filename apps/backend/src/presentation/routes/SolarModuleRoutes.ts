import { Router } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Container } from '../../infrastructure/di/Container';
import { SolarModuleController } from '../controllers/SolarModuleController';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class SolarModuleRoutes {
  public router: Router;
  private solarModuleController: SolarModuleController;
  private authMiddleware: AuthMiddleware;

  constructor(private container: Container) {
    this.router = Router();
    this.solarModuleController = this.container.resolve<SolarModuleController>(ServiceTokens.SolarModuleController);
    this.authMiddleware = this.container.resolve<AuthMiddleware>(ServiceTokens.AuthMiddleware);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Semi-public route for equipment listing (optional auth to include user's modules)
    this.router.get('/', this.authMiddleware.optional(), this.solarModuleController.findAll.bind(this.solarModuleController));
    
    // Apply authentication middleware for protected routes
    this.router.use(this.authMiddleware.authenticate());
    
    // Protected CRUD routes
    this.router.post('/', this.solarModuleController.create.bind(this.solarModuleController));
    this.router.put('/:id', this.solarModuleController.update.bind(this.solarModuleController));
    this.router.delete('/:id', this.solarModuleController.delete.bind(this.solarModuleController));
  }
}