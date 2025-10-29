import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";
import type {
  CompanyProfileProps as SharedCompanyProfileProps,
  CompanyProfileStatus as SharedCompanyProfileStatus
} from "@bess-pro/shared";

// Re-export for backward compatibility
export type CompanyProfileProps = SharedCompanyProfileProps;
export type CompanyProfileStatus = SharedCompanyProfileStatus;

export class CompanyProfile extends BaseEntity {
  private constructor(
    private readonly id: string,
    private companyName: string,
    private tradingName: string,
    private taxId: string,
    private stateRegistration: string,
    private municipalRegistration: string,
    private phone: string,
    private email: string,
    private logoUrl: string,
    private logoPath: string,
    private website: string,
    private address: string,
    private city: string,
    private state: string,
    private zipCode: string,
    private country: string,
    private isActive: boolean,
    private readonly teamId: string,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: CompanyProfileProps): CompanyProfile {
    const id = props.id || crypto.randomUUID();

    if (!props.teamId) {
      throw new Error('TeamId é obrigatório para criar CompanyProfile');
    }

    return new CompanyProfile(
      id,
      props.companyName,
      props.tradingName || '',
      props.taxId || '',
      props.stateRegistration || '',
      props.municipalRegistration || '',
      props.phone || '',
      props.email || '',
      props.logoUrl || '',
      props.logoPath || '',
      props.website || '',
      props.address || '',
      props.city || '',
      props.state || '',
      props.zipCode || '',
      props.country || 'Brasil',
      props.isActive ?? true,
      props.teamId,
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      }
    );
  }

  updateCompanyName(newCompanyName: string): void {
    this.companyName = newCompanyName;
    this.markAsUpdated();
  }

  updateTradingName(newTradingName: string): void {
    this.tradingName = newTradingName;
    this.markAsUpdated();
  }

  updateTaxId(newTaxId: string): void {
    this.taxId = newTaxId;
    this.markAsUpdated();
  }

  updateStateRegistration(newStateRegistration: string): void {
    this.stateRegistration = newStateRegistration;
    this.markAsUpdated();
  }

  updateMunicipalRegistration(newMunicipalRegistration: string): void {
    this.municipalRegistration = newMunicipalRegistration;
    this.markAsUpdated();
  }

  updatePhone(newPhone: string): void {
    this.phone = newPhone;
    this.markAsUpdated();
  }

  updateEmail(newEmail: string): void {
    this.email = newEmail;
    this.markAsUpdated();
  }

  updateLogoUrl(newLogoUrl: string): void {
    this.logoUrl = newLogoUrl;
    this.markAsUpdated();
  }

  updateLogoPath(newLogoPath: string): void {
    this.logoPath = newLogoPath;
    this.markAsUpdated();
  }

  updateWebsite(newWebsite: string): void {
    this.website = newWebsite;
    this.markAsUpdated();
  }

  updateAddress(newAddress: string): void {
    this.address = newAddress;
    this.markAsUpdated();
  }

  updateCity(newCity: string): void {
    this.city = newCity;
    this.markAsUpdated();
  }

  updateState(newState: string): void {
    this.state = newState;
    this.markAsUpdated();
  }

  updateZipCode(newZipCode: string): void {
    this.zipCode = newZipCode;
    this.markAsUpdated();
  }

  updateCountry(newCountry: string): void {
    this.country = newCountry;
    this.markAsUpdated();
  }

  activate(): void {
    this.isActive = true;
    this.markAsUpdated();
  }

  deactivate(): void {
    this.isActive = false;
    this.markAsUpdated();
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // Getters
  getId(): string { return this.id; }
  getCompanyName(): string { return this.companyName; }
  getTradingName(): string { return this.tradingName; }
  getTaxId(): string { return this.taxId; }
  getStateRegistration(): string { return this.stateRegistration; }
  getMunicipalRegistration(): string { return this.municipalRegistration; }
  getPhone(): string { return this.phone; }
  getEmail(): string { return this.email; }
  getLogoUrl(): string { return this.logoUrl; }
  getLogoPath(): string { return this.logoPath; }
  getWebsite(): string { return this.website; }
  getAddress(): string { return this.address; }
  getCity(): string { return this.city; }
  getState(): string { return this.state; }
  getZipCode(): string { return this.zipCode; }
  getCountry(): string { return this.country; }
  getIsActive(): boolean { return this.isActive; }
  getTeamId(): string { return this.teamId; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }

  // Static method for domain validation
  static validateTaxId(taxId: string): boolean {
    // Basic CNPJ validation (14 digits)
    const cnpjRegex = /^\d{14}$/;
    if (!cnpjRegex.test(taxId)) return false;

    // TODO: Implement proper CNPJ validation algorithm
    return true;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    // Basic Brazilian phone validation (with or without formatting)
    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    const phoneDigitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) || (phoneDigitsOnly.length >= 10 && phoneDigitsOnly.length <= 11);
  }

  static validateZipCode(zipCode: string): boolean {
    // Basic Brazilian CEP validation (with or without formatting)
    const cepRegex = /^\d{5}-?\d{3}$/;
    const cepDigitsOnly = zipCode.replace(/\D/g, '');
    return cepRegex.test(zipCode) || cepDigitsOnly.length === 8;
  }
}