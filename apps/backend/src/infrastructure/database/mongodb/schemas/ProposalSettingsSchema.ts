import { Schema, model, Document } from 'mongoose';

export interface ProposalSettingsDocument extends Document {
  _id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSettingsSchema = new Schema<ProposalSettingsDocument>({
  _id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  showIntroduction: {
    type: Boolean,
    default: true
  },
  showTechnicalAnalysis: {
    type: Boolean,
    default: true
  },
  showFinancialAnalysis: {
    type: Boolean,
    default: true
  },
  showCoverPage: {
    type: Boolean,
    default: true
  },
  showSolarAdvantages: {
    type: Boolean,
    default: true
  },
  showTechnicalSummary: {
    type: Boolean,
    default: true
  },
  showEquipmentDetails: {
    type: Boolean,
    default: true
  },
  showGenerationProjection: {
    type: Boolean,
    default: true
  },
  showInvestmentDetails: {
    type: Boolean,
    default: true
  },
  showFinancialIndicators: {
    type: Boolean,
    default: true
  },
  showPaymentConditions: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'proposal_settings',
  timestamps: true,
  _id: false
});

ProposalSettingsSchema.index({ userId: 1 }, { unique: true });

export const ProposalSettingsModel = model<ProposalSettingsDocument>('ProposalSettings', ProposalSettingsSchema);