import { IProposalSettingsRepository } from '../../../domain/repositories/IProposalSettingsRepository';
import { ProposalSettings, ProposalSettingsProps } from '../../../domain/entities/ProposalSettings';
import { UserId } from '../../../domain/value-objects/UserId';
import { Result } from '../../common/Result';

export interface CreateProposalSettingsUseCaseRequest {
  userId: string;
  showIntroduction?: boolean;
  showTechnicalAnalysis?: boolean;
  showFinancialAnalysis?: boolean;
  showCoverPage?: boolean;
  showSolarAdvantages?: boolean;
  showTechnicalSummary?: boolean;
  showEquipmentDetails?: boolean;
  showGenerationProjection?: boolean;
  showInvestmentDetails?: boolean;
  showFinancialIndicators?: boolean;
  showPaymentConditions?: boolean;
}

export class CreateProposalSettingsUseCase {
  constructor(
    private proposalSettingsRepository: IProposalSettingsRepository
  ) {}

  async execute(request: CreateProposalSettingsUseCaseRequest): Promise<Result<ProposalSettings>> {
    try {
      const userId = UserId.create(request.userId);

      // Check if settings already exist for this user
      const existingSettings = await this.proposalSettingsRepository.findByUserId(userId);
      if (existingSettings) {
        return Result.failure('Configurações de proposta já existem para este usuário');
      }

      const proposalSettings = ProposalSettings.create({
        userId: request.userId,
        showIntroduction: request.showIntroduction,
        showTechnicalAnalysis: request.showTechnicalAnalysis,
        showFinancialAnalysis: request.showFinancialAnalysis,
        showCoverPage: request.showCoverPage,
        showSolarAdvantages: request.showSolarAdvantages,
        showTechnicalSummary: request.showTechnicalSummary,
        showEquipmentDetails: request.showEquipmentDetails,
        showGenerationProjection: request.showGenerationProjection,
        showInvestmentDetails: request.showInvestmentDetails,
        showFinancialIndicators: request.showFinancialIndicators,
        showPaymentConditions: request.showPaymentConditions
      });

      const savedSettings = await this.proposalSettingsRepository.save(proposalSettings);
      return Result.success(savedSettings);
    } catch (error) {
      console.error('CreateProposalSettingsUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}