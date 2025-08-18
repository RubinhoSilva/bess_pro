import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { AdvancedProposalTemplateController } from '../controllers/AdvancedProposalTemplateController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export function createAdvancedTemplateRoutes(container: Container): Router {
  const router = Router();
  const controller = container.resolve<AdvancedProposalTemplateController>(ServiceTokens.AdvancedProposalTemplateController);
  const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');

  // Apply authentication middleware to all routes
  router.use(authMiddleware.authenticate.bind(authMiddleware));

  // GET /api/v1/advanced-templates - Get paginated templates with filtering
  router.get('/', (req, res) => controller.getTemplates(req, res));

  // GET /api/v1/advanced-templates/:id - Get specific template
  router.get('/:id', (req, res) => controller.getTemplateById(req, res));

  // POST /api/v1/advanced-templates - Create new template
  router.post('/', (req, res) => controller.createTemplate(req, res));

  // PUT /api/v1/advanced-templates/:id - Update template
  router.put('/:id', (req, res) => controller.updateTemplate(req, res));

  // DELETE /api/v1/advanced-templates/:id - Delete template
  router.delete('/:id', (req, res) => controller.deleteTemplate(req, res));

  // POST /api/v1/advanced-templates/:id/generate - Generate proposal from template
  router.post('/:id/generate', (req, res) => controller.generateProposal(req, res));

  // POST /api/v1/advanced-templates/:id/clone - Clone template
  router.post('/:id/clone', (req, res) => controller.cloneTemplate(req, res));

  return router;
}