import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { GrupoFinancialController } from '../controllers/GrupoFinancialController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class GrupoFinancialRoutes {
  private router: Router;
  private grupoFinancialController: GrupoFinancialController;
  private authMiddleware: AuthMiddleware;

  constructor(container: Container) {
    this.router = Router();
    this.grupoFinancialController = new GrupoFinancialController();
    this.authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');
    
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Apply authentication to all financial routes
    this.router.use(this.authMiddleware.authenticate());

    // Grupo B financial calculation endpoint
    this.router.post('/calculate-grupo-b', 
      this.grupoFinancialController.calculateGrupoBFinancials.bind(this.grupoFinancialController)
    );

    // Grupo A financial calculation endpoint  
    this.router.post('/calculate-grupo-a', 
      this.grupoFinancialController.calculateGrupoAFinancials.bind(this.grupoFinancialController)
    );

    // Health check endpoint for financial service
    this.router.get('/health', 
      this.grupoFinancialController.healthCheck.bind(this.grupoFinancialController)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}

export const createGrupoFinancialRoutes = (container: Container): Router => {
  const grupoFinancialRoutes = new GrupoFinancialRoutes(container);
  return grupoFinancialRoutes.getRouter();
};

export default createGrupoFinancialRoutes;