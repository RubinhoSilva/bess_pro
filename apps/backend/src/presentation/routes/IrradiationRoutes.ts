import { Router } from 'express';
import { Container } from '@/infrastructure/di/Container';
import { IrradiationController } from '@/presentation/controllers/IrradiationController';
import { AuthMiddleware } from '@/presentation/middleware/AuthMiddleware';

export class IrradiationRoutes {
  private router: Router;
  private irradiationController: IrradiationController;
  private authMiddleware: AuthMiddleware;

  constructor(container: Container) {
    this.router = Router();
    this.irradiationController = container.resolve('IrradiationController');
    this.authMiddleware = container.resolve('AuthMiddleware');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Endpoints PVGIS públicos (sem autenticação para permitir uso direto)
    // GET /irradiation/pvgis - Proxy direto para PVGIS API
    this.router.get(
      '/pvgis',
      this.irradiationController.getPVGISData.bind(this.irradiationController)
    );

    // GET /irradiation/pvgis-mrcalc - Proxy para PVGIS MRcalc endpoint  
    this.router.get(
      '/pvgis-mrcalc',
      this.irradiationController.getPVGISMRData.bind(this.irradiationController)
    );

    // Todas as outras rotas de irradiação requerem autenticação
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware));

    // GET /irradiation?latitude=X&longitude=Y&source=PVGIS&useCache=true
    // Obter dados de irradiação solar para uma localização
    this.router.get(
      '/',
      this.irradiationController.getSolarIrradiation.bind(this.irradiationController)
    );

    // GET /irradiation/sources - Listar fontes de dados disponíveis
    this.router.get(
      '/sources',
      this.irradiationController.getAvailableSources.bind(this.irradiationController)
    );

    // POST /irradiation/compare - Comparar diferentes fontes de dados
    this.router.post(
      '/compare',
      this.irradiationController.compareIrradiationSources.bind(this.irradiationController)
    );

    // POST /irradiation/bulk - Obter dados para múltiplas localizações
    this.router.post(
      '/bulk',
      this.irradiationController.getBulkIrradiation.bind(this.irradiationController)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}