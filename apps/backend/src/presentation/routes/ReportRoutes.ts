import { Router } from 'express';
import { Container } from '@/infrastructure/di/Container';
import { ReportController } from '@/presentation/controllers/ReportController';
import { AuthMiddleware } from '@/presentation/middleware/AuthMiddleware';

export class ReportRoutes {
  private router: Router;
  private reportController: ReportController;
  private authMiddleware: AuthMiddleware;

  constructor(container: Container) {
    this.router = Router();
    this.reportController = container.resolve('ReportController');
    this.authMiddleware = container.resolve('AuthMiddleware');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Todas as rotas de relatório requerem autenticação
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware));

    // POST /reports/financial/:projectId - Gerar relatório financeiro completo
    this.router.post(
      '/financial/:projectId',
      this.reportController.generateFinancialReport.bind(this.reportController)
    );

    // GET /reports/quick/:projectId - Gerar relatório rápido com valores padrão
    this.router.get(
      '/quick/:projectId',
      this.reportController.generateQuickReport.bind(this.reportController)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}