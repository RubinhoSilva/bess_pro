import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { CreateProposalSettingsUseCase } from '../../application/use-cases/proposal-settings/CreateProposalSettingsUseCase';
import { GetProposalSettingsUseCase } from '../../application/use-cases/proposal-settings/GetProposalSettingsUseCase';
import { UpdateProposalSettingsUseCase } from '../../application/use-cases/proposal-settings/UpdateProposalSettingsUseCase';
import { ProposalSettingsMapper } from '../../application/mappers/ProposalSettingsMapper';

export class ProposalSettingsController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  async createProposalSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const {
        showIntroduction,
        showTechnicalAnalysis,
        showFinancialAnalysis,
        showCoverPage,
        showSolarAdvantages,
        showTechnicalSummary,
        showEquipmentDetails,
        showGenerationProjection,
        showInvestmentDetails,
        showFinancialIndicators,
        showPaymentConditions
      } = req.body;

      const createProposalSettingsUseCase = this.container.resolve<CreateProposalSettingsUseCase>(
        ServiceTokens.CREATE_PROPOSAL_SETTINGS_USE_CASE
      );

      const result = await createProposalSettingsUseCase.execute({
        userId,
        showIntroduction,
        showTechnicalAnalysis,
        showFinancialAnalysis,
        showCoverPage,
        showSolarAdvantages,
        showTechnicalSummary,
        showEquipmentDetails,
        showGenerationProjection,
        showInvestmentDetails,
        showFinancialIndicators,
        showPaymentConditions
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: result.error
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const proposalSettingsDto = ProposalSettingsMapper.toResponseDto(result.value!);

      res.status(201).json({
        success: true,
        data: proposalSettingsDto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Create proposal settings error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getProposalSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const getProposalSettingsUseCase = this.container.resolve<GetProposalSettingsUseCase>(
        ServiceTokens.GET_PROPOSAL_SETTINGS_USE_CASE
      );

      const result = await getProposalSettingsUseCase.execute({ userId });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: result.error
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const proposalSettingsDto = ProposalSettingsMapper.toResponseDto(result.value!);

      res.status(200).json({
        success: true,
        data: proposalSettingsDto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get proposal settings error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async updateProposalSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const {
        showIntroduction,
        showTechnicalAnalysis,
        showFinancialAnalysis,
        showCoverPage,
        showSolarAdvantages,
        showTechnicalSummary,
        showEquipmentDetails,
        showGenerationProjection,
        showInvestmentDetails,
        showFinancialIndicators,
        showPaymentConditions
      } = req.body;

      const updateProposalSettingsUseCase = this.container.resolve<UpdateProposalSettingsUseCase>(
        ServiceTokens.UPDATE_PROPOSAL_SETTINGS_USE_CASE
      );

      const result = await updateProposalSettingsUseCase.execute({
        userId,
        showIntroduction,
        showTechnicalAnalysis,
        showFinancialAnalysis,
        showCoverPage,
        showSolarAdvantages,
        showTechnicalSummary,
        showEquipmentDetails,
        showGenerationProjection,
        showInvestmentDetails,
        showFinancialIndicators,
        showPaymentConditions
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: result.error
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const proposalSettingsDto = ProposalSettingsMapper.toResponseDto(result.value!);

      res.status(200).json({
        success: true,
        data: proposalSettingsDto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update proposal settings error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}