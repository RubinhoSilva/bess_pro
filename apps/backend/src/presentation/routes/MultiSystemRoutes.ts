import { Router } from 'express';
import { MultiSystemController } from '../controllers/MultiSystemController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Container } from '../../infrastructure/di/Container';

export class MultiSystemRoutes {
  private router = Router();
  private controller: MultiSystemController;
  private authMiddleware: AuthMiddleware;

  constructor(container: Container) {
    this.controller = new MultiSystemController(container);
    this.authMiddleware = new AuthMiddleware(container);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Middleware de autenticação para todas as rotas
    this.router.use(this.authMiddleware.authenticate());

    // Calcular configuração ótima multi-sistema
    this.router.post(
      '/calculate',
      this.controller.calculateMultiSystem.bind(this.controller)
    );

    // Simular operação de configuração específica
    this.router.post(
      '/simulate',
      this.controller.simulateOperation.bind(this.controller)
    );

    // Obter templates de configuração
    this.router.get(
      '/templates',
      this.controller.getConfigurationTemplates.bind(this.controller)
    );

    // Otimizar configuração existente
    this.router.post(
      '/optimize',
      this.controller.optimizeConfiguration.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}