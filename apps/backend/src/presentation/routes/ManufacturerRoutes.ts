import { Router } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Container } from '../../infrastructure/di/Container';
import { ManufacturerController } from '../controllers/ManufacturerController';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { validationMiddleware } from '../middleware/validation.middleware';
import { GetManufacturersQueryDTO } from '../../application/dtos/input/manufacturer/GetManufacturersQueryDTO';

export class ManufacturerRoutes {
  public router: Router;
  private manufacturerController: ManufacturerController;
  private authMiddleware: AuthMiddleware;

  constructor(private container: Container) {
    this.router = Router();
    this.manufacturerController = this.container.resolve<ManufacturerController>(ServiceTokens.ManufacturerController);
    this.authMiddleware = this.container.resolve<AuthMiddleware>(ServiceTokens.AuthMiddleware);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Semi-public route for manufacturer listing (optional auth to include team's manufacturers)
    this.router.get('/', 
      this.authMiddleware.optional(), 
      validationMiddleware(GetManufacturersQueryDTO, 'query'),
      this.manufacturerController.findAll.bind(this.manufacturerController)
    );
    this.router.get('/:id', this.authMiddleware.optional(), this.manufacturerController.findById.bind(this.manufacturerController));
    
    // Apply authentication middleware for protected routes
    this.router.use(this.authMiddleware.authenticate());
    
    // Protected CRUD routes
    this.router.post('/', this.manufacturerController.create.bind(this.manufacturerController));
    this.router.put('/:id', this.manufacturerController.update.bind(this.manufacturerController));
    this.router.delete('/:id', this.manufacturerController.delete.bind(this.manufacturerController));
  }
}