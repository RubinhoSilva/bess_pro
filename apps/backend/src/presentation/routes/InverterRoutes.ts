import { Router } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Container } from '../../infrastructure/di/Container';
import { InverterController } from '../controllers/InverterController';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class InverterRoutes {
  public router: Router;
  private inverterController: InverterController;
  private authMiddleware: AuthMiddleware;

  constructor(private container: Container) {
    this.router = Router();
    this.inverterController = this.container.resolve<InverterController>(ServiceTokens.InverterController);
    this.authMiddleware = this.container.resolve<AuthMiddleware>(ServiceTokens.AuthMiddleware);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Semi-public route for equipment listing (optional auth to include user's inverters)
    this.router.get('/', this.authMiddleware.optional(), this.inverterController.findAll.bind(this.inverterController));
    
    // Apply authentication middleware for protected routes
    this.router.use(this.authMiddleware.authenticate());
    
    // Protected CRUD routes
    this.router.post('/', this.inverterController.create.bind(this.inverterController));
    this.router.put('/:id', this.inverterController.update.bind(this.inverterController));
    this.router.delete('/:id', this.inverterController.delete.bind(this.inverterController));
  }
}