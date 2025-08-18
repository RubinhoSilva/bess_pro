import { IProposalSettingsRepository } from '../../../domain/repositories/IProposalSettingsRepository';
import { ProposalSettings } from '../../../domain/entities/ProposalSettings';
import { UserId } from '../../../domain/value-objects/UserId';
import { Result } from '../../common/Result';

export interface UpdateProposalSettingsUseCaseRequest {
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

export class UpdateProposalSettingsUseCase {
  constructor(
    private proposalSettingsRepository: IProposalSettingsRepository
  ) {}

  async execute(request: UpdateProposalSettingsUseCaseRequest): Promise<Result<ProposalSettings>> {
    try {
      const userId = UserId.create(request.userId);

      let proposalSettings = await this.proposalSettingsRepository.findByUserId(userId);

      // If no settings exist, create default settings first
      if (!proposalSettings) {
        proposalSettings = ProposalSettings.createWithDefaults(request.userId);
        proposalSettings = await this.proposalSettingsRepository.save(proposalSettings);
      }

      // Update settings
      proposalSettings.updateSettings({
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

      const updatedSettings = await this.proposalSettingsRepository.update(proposalSettings);
      return Result.success(updatedSettings);
    } catch (error) {
      console.error('UpdateProposalSettingsUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}