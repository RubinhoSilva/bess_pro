import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { EnergyCompanyController } from '../controllers/EnergyCompanyController';

export class EnergyCompanyRoutes {
  static create(container: Container): Router {
    const router = Router();
    
    try {
      // Obter o controller do container DI
      const energyCompanyController = container.resolve<EnergyCompanyController>(ServiceTokens.EnergyCompanyController);

      // Rotas básicas (sem autenticação por enquanto)
      router.get('/health', (req, res) => {
        res.json({ status: 'ok', service: 'energy-companies' });
      });

      // Rotas de concessionárias
      router.get('/', (req, res) => energyCompanyController.getActiveEnergyCompanies(req, res));
      router.get('/state/:state', (req, res) => energyCompanyController.getEnergyCompaniesByState(req, res));
      router.get('/:id', (req, res) => energyCompanyController.getEnergyCompanyById(req, res));
      
      // Rotas administrativas
      router.get('/admin/all', (req, res) => energyCompanyController.getAllEnergyCompanies(req, res));
      router.post('/seed', (req, res) => energyCompanyController.seedEnergyCompanies(req, res));
      router.post('/', (req, res) => energyCompanyController.createEnergyCompany(req, res));
      router.put('/:id', (req, res) => energyCompanyController.updateEnergyCompany(req, res));
      router.delete('/:id', (req, res) => energyCompanyController.deleteEnergyCompany(req, res));

    } catch (error) {
      console.error('Error setting up Energy Company routes:', error);
      // Fallback para rota de health
      router.get('/health', (req, res) => {
        res.json({ status: 'error', service: 'energy-companies', error: 'Controller not available' });
      });
    }

    return router;
  }
}

// Compatibilidade com import padrão - usar lazy loading
let cachedRouter: Router | null = null;

export default function getEnergyCompanyRoutes(): Router {
  if (!cachedRouter) {
    cachedRouter = EnergyCompanyRoutes.create(Container.getInstance());
  }
  return cachedRouter;
}