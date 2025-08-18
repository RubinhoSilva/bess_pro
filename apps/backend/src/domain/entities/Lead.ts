import { Email } from "../value-objects/Email";
import { Name } from "../value-objects/Name";
import { UserId } from "../value-objects/UserId";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export enum LeadStage {
  LEAD_RECEBIDO = 'lead-recebido',
  PRE_QUALIFICACAO = 'pre-qualificacao',
  PROPOSTA_ENVIADA = 'proposta-enviada',
  DOCUMENTACAO_RECEBIDA = 'documentacao-recebida',
  PROJETO_APROVADO = 'projeto-aprovado',
  INSTALACAO_AGENDADA = 'instalacao-agendada',
  SISTEMA_ENTREGUE = 'sistema-entregue',
  CONVERTED = 'converted'
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social-media',
  DIRECT_CONTACT = 'direct-contact',
  ADVERTISING = 'advertising',
  OTHER = 'other'
}

export enum ClientType {
  B2B = 'B2B',
  B2C = 'B2C'
}

export interface LeadProps extends SoftDeleteProps {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  stage?: LeadStage;
  source?: LeadSource;
  notes?: string;
  colorHighlight?: string;
  estimatedValue?: number;
  expectedCloseDate?: Date;
  value?: number; // Valor do negócio em R$
  powerKwp?: number; // Potência do sistema em kWp
  clientType?: ClientType; // B2B ou B2C
  tags?: string[]; // Tags customizáveis
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Lead extends BaseEntity {
  private constructor(
    private readonly id: string,
    private name: Name,
    private email: Email,
    private phone: string,
    private company: string,
    private address: string,
    private stage: LeadStage,
    private source: LeadSource,
    private notes: string,
    private colorHighlight: string,
    private estimatedValue: number,
    private expectedCloseDate: Date | null,
    private value: number,
    private powerKwp: number,
    private clientType: ClientType,
    private tags: string[],
    private readonly userId: UserId,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: LeadProps): Lead {
    const id = props.id || crypto.randomUUID();
    const name = Name.create(props.name);
    const email = Email.create(props.email);
    const userId = UserId.create(props.userId);

    return new Lead(
      id,
      name,
      email,
      props.phone || '',
      props.company || '',
      props.address || '',
      props.stage || LeadStage.LEAD_RECEBIDO,
      props.source || LeadSource.OTHER,
      props.notes || '',
      props.colorHighlight || '',
      props.estimatedValue || 0,
      props.expectedCloseDate || null,
      props.value || 0,
      props.powerKwp || 0,
      props.clientType || ClientType.B2C,
      props.tags || [],
      userId,
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt
      }
    );
  }

  updateName(newName: string): void {
    this.name = Name.create(newName);
    this.markAsUpdated();
  }

  updateEmail(newEmail: string): void {
    this.email = Email.create(newEmail);
    this.markAsUpdated();
  }

  updatePhone(newPhone: string): void {
    this.phone = newPhone;
    this.markAsUpdated();
  }

  updateCompany(newCompany: string): void {
    this.company = newCompany;
    this.markAsUpdated();
  }

  updateAddress(newAddress: string): void {
    this.address = newAddress;
    this.markAsUpdated();
  }

  updateStage(newStage: LeadStage): void {
    this.stage = newStage;
    this.markAsUpdated();
  }

  updateSource(newSource: LeadSource): void {
    this.source = newSource;
    this.markAsUpdated();
  }

  updateNotes(newNotes: string): void {
    this.notes = newNotes;
    this.markAsUpdated();
  }

  updateColorHighlight(color: string): void {
    this.colorHighlight = color;
    this.markAsUpdated();
  }

  updateEstimatedValue(value: number): void {
    this.estimatedValue = value;
    this.markAsUpdated();
  }

  updateExpectedCloseDate(date: Date | null): void {
    this.expectedCloseDate = date;
    this.markAsUpdated();
  }

  updateValue(value: number): void {
    this.value = value;
    this.markAsUpdated();
  }

  updatePowerKwp(powerKwp: number): void {
    this.powerKwp = powerKwp;
    this.markAsUpdated();
  }

  updateClientType(clientType: ClientType): void {
    this.clientType = clientType;
    this.markAsUpdated();
  }

  updateTags(tags: string[]): void {
    this.tags = tags;
    this.markAsUpdated();
  }


  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  // Getters
  getId(): string { return this.id; }
  getName(): Name { return this.name; }
  getEmail(): Email { return this.email; }
  getPhone(): string { return this.phone; }
  getCompany(): string { return this.company; }
  getAddress(): string { return this.address; }
  getStage(): LeadStage { return this.stage; }
  getSource(): LeadSource { return this.source; }
  getNotes(): string { return this.notes; }
  getColorHighlight(): string { return this.colorHighlight; }
  getEstimatedValue(): number { return this.estimatedValue; }
  getExpectedCloseDate(): Date | null { return this.expectedCloseDate; }
  getValue(): number { return this.value; }
  getPowerKwp(): number { return this.powerKwp; }
  getClientType(): ClientType { return this.clientType; }
  getTags(): string[] { return this.tags; }
  getUserId(): UserId { return this.userId; }
  // Inherited from BaseEntity: getCreatedAt(), getUpdatedAt(), isDeleted(), getDeletedAt(), delete(), restore()
}