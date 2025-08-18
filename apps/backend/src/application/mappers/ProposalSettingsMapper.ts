import { ProposalSettings } from '../../domain/entities/ProposalSettings';

export interface ProposalSettingsDto {
  id: string;
  userId: string;
  showIntroduction: boolean;
  showTechnicalAnalysis: boolean;
  showFinancialAnalysis: boolean;
  showCoverPage: boolean;
  showSolarAdvantages: boolean;
  showTechnicalSummary: boolean;
  showEquipmentDetails: boolean;
  showGenerationProjection: boolean;
  showInvestmentDetails: boolean;
  showFinancialIndicators: boolean;
  showPaymentConditions: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProposalSettingsMapper {
  static toResponseDto(proposalSettings: ProposalSettings): ProposalSettingsDto {
    return {
      id: proposalSettings.getId(),
      userId: proposalSettings.getUserId().getValue(),
      showIntroduction: proposalSettings.getShowIntroduction(),
      showTechnicalAnalysis: proposalSettings.getShowTechnicalAnalysis(),
      showFinancialAnalysis: proposalSettings.getShowFinancialAnalysis(),
      showCoverPage: proposalSettings.getShowCoverPage(),
      showSolarAdvantages: proposalSettings.getShowSolarAdvantages(),
      showTechnicalSummary: proposalSettings.getShowTechnicalSummary(),
      showEquipmentDetails: proposalSettings.getShowEquipmentDetails(),
      showGenerationProjection: proposalSettings.getShowGenerationProjection(),
      showInvestmentDetails: proposalSettings.getShowInvestmentDetails(),
      showFinancialIndicators: proposalSettings.getShowFinancialIndicators(),
      showPaymentConditions: proposalSettings.getShowPaymentConditions(),
      createdAt: proposalSettings.getCreatedAt().toISOString(),
      updatedAt: proposalSettings.getUpdatedAt().toISOString()
    };
  }
}