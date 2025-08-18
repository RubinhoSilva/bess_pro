import { Model } from 'mongoose';
import { IProposalSettingsRepository } from '../../../../domain/repositories/IProposalSettingsRepository';
import { ProposalSettings } from '../../../../domain/entities/ProposalSettings';
import { UserId } from '../../../../domain/value-objects/UserId';
import { ProposalSettingsDocument } from '../schemas/ProposalSettingsSchema';

export class MongoProposalSettingsRepository implements IProposalSettingsRepository {
  constructor(private proposalSettingsModel: Model<ProposalSettingsDocument>) {}

  async save(proposalSettings: ProposalSettings): Promise<ProposalSettings> {
    const proposalSettingsData = {
      _id: proposalSettings.getId(),
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
      createdAt: proposalSettings.getCreatedAt(),
      updatedAt: proposalSettings.getUpdatedAt()
    };

    const savedProposalSettings = await this.proposalSettingsModel.create(proposalSettingsData);
    return this.toDomain(savedProposalSettings);
  }

  async findByUserId(userId: UserId): Promise<ProposalSettings | null> {
    const proposalSettingsDoc = await this.proposalSettingsModel.findOne({ 
      userId: userId.getValue() 
    }).exec();

    if (!proposalSettingsDoc) {
      return null;
    }

    return this.toDomain(proposalSettingsDoc);
  }

  async update(proposalSettings: ProposalSettings): Promise<ProposalSettings> {
    const proposalSettingsData = {
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
      updatedAt: proposalSettings.getUpdatedAt()
    };

    const updatedProposalSettings = await this.proposalSettingsModel.findByIdAndUpdate(
      proposalSettings.getId(),
      proposalSettingsData,
      { new: true }
    ).exec();

    if (!updatedProposalSettings) {
      throw new Error('ProposalSettings not found');
    }

    return this.toDomain(updatedProposalSettings);
  }

  async delete(id: string): Promise<void> {
    await this.proposalSettingsModel.findByIdAndDelete(id).exec();
  }

  private toDomain(proposalSettingsDoc: ProposalSettingsDocument): ProposalSettings {
    return ProposalSettings.create({
      id: proposalSettingsDoc._id.toString(),
      userId: proposalSettingsDoc.userId,
      showIntroduction: proposalSettingsDoc.showIntroduction,
      showTechnicalAnalysis: proposalSettingsDoc.showTechnicalAnalysis,
      showFinancialAnalysis: proposalSettingsDoc.showFinancialAnalysis,
      showCoverPage: proposalSettingsDoc.showCoverPage,
      showSolarAdvantages: proposalSettingsDoc.showSolarAdvantages,
      showTechnicalSummary: proposalSettingsDoc.showTechnicalSummary,
      showEquipmentDetails: proposalSettingsDoc.showEquipmentDetails,
      showGenerationProjection: proposalSettingsDoc.showGenerationProjection,
      showInvestmentDetails: proposalSettingsDoc.showInvestmentDetails,
      showFinancialIndicators: proposalSettingsDoc.showFinancialIndicators,
      showPaymentConditions: proposalSettingsDoc.showPaymentConditions,
      createdAt: proposalSettingsDoc.createdAt,
      updatedAt: proposalSettingsDoc.updatedAt
    });
  }
}