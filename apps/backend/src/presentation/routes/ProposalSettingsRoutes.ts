import { Router } from 'express';
import { ProposalSettingsController } from '../controllers/ProposalSettingsController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { Container } from '../../infrastructure/di/Container';
import { body } from 'express-validator';

export class ProposalSettingsRoutes {
  static create(container: Container): Router {
    const router = Router();
    const proposalSettingsController = new ProposalSettingsController(container);
    const authMiddleware = new AuthMiddleware(container);

    // Validation rules for creating/updating proposal settings
    const validateProposalSettings = [
      body('showIntroduction').optional().isBoolean().withMessage('showIntroduction deve ser um boolean'),
      body('showTechnicalAnalysis').optional().isBoolean().withMessage('showTechnicalAnalysis deve ser um boolean'),
      body('showFinancialAnalysis').optional().isBoolean().withMessage('showFinancialAnalysis deve ser um boolean'),
      body('showCoverPage').optional().isBoolean().withMessage('showCoverPage deve ser um boolean'),
      body('showSolarAdvantages').optional().isBoolean().withMessage('showSolarAdvantages deve ser um boolean'),
      body('showTechnicalSummary').optional().isBoolean().withMessage('showTechnicalSummary deve ser um boolean'),
      body('showEquipmentDetails').optional().isBoolean().withMessage('showEquipmentDetails deve ser um boolean'),
      body('showGenerationProjection').optional().isBoolean().withMessage('showGenerationProjection deve ser um boolean'),
      body('showInvestmentDetails').optional().isBoolean().withMessage('showInvestmentDetails deve ser um boolean'),
      body('showFinancialIndicators').optional().isBoolean().withMessage('showFinancialIndicators deve ser um boolean'),
      body('showPaymentConditions').optional().isBoolean().withMessage('showPaymentConditions deve ser um boolean'),
    ];

    // All routes require authentication
    router.use(authMiddleware.authenticate());

    // Routes
    router.post(
      '/',
      validateProposalSettings,
      ValidationMiddleware.handleValidationErrors(),
      proposalSettingsController.createProposalSettings.bind(proposalSettingsController)
    );

    router.get(
      '/',
      proposalSettingsController.getProposalSettings.bind(proposalSettingsController)
    );

    router.put(
      '/',
      validateProposalSettings,
      ValidationMiddleware.handleValidationErrors(),
      proposalSettingsController.updateProposalSettings.bind(proposalSettingsController)
    );

    return router;
  }
}