import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { ProposalController } from '../controllers/ProposalController';

export class ProposalRoutes {
  static create(container: Container): Router {
    const router = Router();
    
    // Create middleware instance
    const authMiddleware = container.resolve('AuthMiddleware') as AuthMiddleware;

    // Apply authentication middleware to all routes
    router.use(authMiddleware.authenticate());

    // Proposal generation route
    router.post('/generate', async (req, res) => {
      const controller = container.resolve(ServiceTokens.ProposalController) as ProposalController;
      await controller.generateProposal(req, res);
    });

    // Proposal download route
    router.get('/download/:filename', async (req, res) => {
      const controller = container.resolve(ServiceTokens.ProposalController) as ProposalController;
      await controller.downloadProposal(req, res);
    });

    return router;
  }
}