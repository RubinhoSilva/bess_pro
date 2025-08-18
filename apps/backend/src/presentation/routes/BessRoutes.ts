import { Router } from 'express';
import { Container } from '@/infrastructure/di/Container';
import { BessController } from '@/presentation/controllers/BessController';
import { AuthMiddleware } from '@/presentation/middleware/AuthMiddleware';

export class BessRoutes {
  private router: Router;
  private bessController: BessController;
  private authMiddleware: AuthMiddleware;

  constructor(container: Container) {
    this.router = Router();
    this.bessController = container.resolve('BessController');
    this.authMiddleware = container.resolve('AuthMiddleware');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Todas as rotas BESS requerem autenticação
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware));

    // POST /bess/calculate/:projectId - Calcular sistema BESS
    this.router.post(
      '/calculate/:projectId',
      this.bessController.calculateBessSystem.bind(this.bessController)
    );

    // GET /bess/batteries - Obter banco de dados de baterias
    this.router.get(
      '/batteries',
      this.bessController.getBatteryDatabase.bind(this.bessController)
    );

    // GET /bess/load-profile-template - Obter templates de perfil de carga
    this.router.get(
      '/load-profile-template',
      this.bessController.getLoadProfileTemplate.bind(this.bessController)
    );

    // POST /bess/compare - Comparar configurações de baterias
    this.router.post(
      '/compare',
      this.bessController.compareBatteryConfigurations.bind(this.bessController)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}