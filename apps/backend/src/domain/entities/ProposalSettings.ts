import { UserId } from "../value-objects/UserId";

export interface ProposalSettingsProps {
  id?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProposalSettings {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private showIntroduction: boolean,
    private showTechnicalAnalysis: boolean,
    private showFinancialAnalysis: boolean,
    private showCoverPage: boolean,
    private showSolarAdvantages: boolean,
    private showTechnicalSummary: boolean,
    private showEquipmentDetails: boolean,
    private showGenerationProjection: boolean,
    private showInvestmentDetails: boolean,
    private showFinancialIndicators: boolean,
    private showPaymentConditions: boolean,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  static create(props: ProposalSettingsProps): ProposalSettings {
    const id = props.id || crypto.randomUUID();
    const userId = UserId.create(props.userId);

    return new ProposalSettings(
      id,
      userId,
      props.showIntroduction ?? true,
      props.showTechnicalAnalysis ?? true,
      props.showFinancialAnalysis ?? true,
      props.showCoverPage ?? true,
      props.showSolarAdvantages ?? true,
      props.showTechnicalSummary ?? true,
      props.showEquipmentDetails ?? true,
      props.showGenerationProjection ?? true,
      props.showInvestmentDetails ?? true,
      props.showFinancialIndicators ?? true,
      props.showPaymentConditions ?? true,
      props.createdAt || new Date(),
      props.updatedAt || new Date()
    );
  }

  static createWithDefaults(userId: string): ProposalSettings {
    return ProposalSettings.create({
      userId,
      showIntroduction: true,
      showTechnicalAnalysis: true,
      showFinancialAnalysis: true,
      showCoverPage: true,
      showSolarAdvantages: true,
      showTechnicalSummary: true,
      showEquipmentDetails: true,
      showGenerationProjection: true,
      showInvestmentDetails: true,
      showFinancialIndicators: true,
      showPaymentConditions: true
    });
  }

  updateSettings(props: Partial<Omit<ProposalSettingsProps, 'id' | 'userId' | 'createdAt'>>): void {
    if (props.showIntroduction !== undefined) this.showIntroduction = props.showIntroduction;
    if (props.showTechnicalAnalysis !== undefined) this.showTechnicalAnalysis = props.showTechnicalAnalysis;
    if (props.showFinancialAnalysis !== undefined) this.showFinancialAnalysis = props.showFinancialAnalysis;
    if (props.showCoverPage !== undefined) this.showCoverPage = props.showCoverPage;
    if (props.showSolarAdvantages !== undefined) this.showSolarAdvantages = props.showSolarAdvantages;
    if (props.showTechnicalSummary !== undefined) this.showTechnicalSummary = props.showTechnicalSummary;
    if (props.showEquipmentDetails !== undefined) this.showEquipmentDetails = props.showEquipmentDetails;
    if (props.showGenerationProjection !== undefined) this.showGenerationProjection = props.showGenerationProjection;
    if (props.showInvestmentDetails !== undefined) this.showInvestmentDetails = props.showInvestmentDetails;
    if (props.showFinancialIndicators !== undefined) this.showFinancialIndicators = props.showFinancialIndicators;
    if (props.showPaymentConditions !== undefined) this.showPaymentConditions = props.showPaymentConditions;
    
    this.markAsUpdated();
  }

  private markAsUpdated(): void {
    this.updatedAt = new Date();
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): UserId { return this.userId; }
  getShowIntroduction(): boolean { return this.showIntroduction; }
  getShowTechnicalAnalysis(): boolean { return this.showTechnicalAnalysis; }
  getShowFinancialAnalysis(): boolean { return this.showFinancialAnalysis; }
  getShowCoverPage(): boolean { return this.showCoverPage; }
  getShowSolarAdvantages(): boolean { return this.showSolarAdvantages; }
  getShowTechnicalSummary(): boolean { return this.showTechnicalSummary; }
  getShowEquipmentDetails(): boolean { return this.showEquipmentDetails; }
  getShowGenerationProjection(): boolean { return this.showGenerationProjection; }
  getShowInvestmentDetails(): boolean { return this.showInvestmentDetails; }
  getShowFinancialIndicators(): boolean { return this.showFinancialIndicators; }
  getShowPaymentConditions(): boolean { return this.showPaymentConditions; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}