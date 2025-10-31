import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware';
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
    router.post(
      '/generate',
      authMiddleware.authenticate(),
      (req, res, next) => {
        const controller = container.resolve(ServiceTokens.ProposalController) as ProposalController;
        controller.generateProposal(req as AuthenticatedRequest, res).catch(next);
      }
    );

    // Proposal download route
    router.get(
      '/download/:filename',
      authMiddleware.authenticate(),
      (req, res, next) => {
        const controller = container.resolve(ServiceTokens.ProposalController) as ProposalController;
        controller.downloadProposal(req as AuthenticatedRequest, res).catch(next);
      }
    );

    return router;
  }
}