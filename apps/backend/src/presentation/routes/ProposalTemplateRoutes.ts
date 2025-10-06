import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { ProposalTemplateController } from '../controllers/ProposalTemplateController';

export class ProposalTemplateRoutes {
  static create(container: Container): Router {
  const router = Router();
  
  // Create middleware instance
  const authMiddleware = container.resolve('AuthMiddleware') as AuthMiddleware;

  // Apply authentication middleware to all routes
  router.use(authMiddleware.authenticate());

  // Template management routes
  router.post('/templates', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.createTemplate(req, res);
  });

  router.get('/templates', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.getTemplates(req, res);
  });

  router.get('/templates/:id', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.getTemplate(req, res);
  });

  router.put('/templates/:id', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.updateTemplate(req, res);
  });

  router.delete('/templates/:id', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.deleteTemplate(req, res);
  });

  router.post('/templates/:id/clone', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.cloneTemplate(req, res);
  });

  // Proposal generation routes
  router.post('/proposals/preview', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.previewProposal(req, res);
  });

  router.post('/proposals/generate', async (req, res) => {
    const controller = container.resolve(ServiceTokens.ProposalTemplateController) as ProposalTemplateController;
    await controller.generateProposal(req, res);
  });

  return router;
  }
}