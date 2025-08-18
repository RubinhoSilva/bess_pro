import { Email } from "../value-objects/Email";
import { Name } from "../value-objects/Name";
import { UserId } from "../value-objects/UserId";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  POTENTIAL = 'potential',
  BLOCKED = 'blocked'
}

export enum ClientType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial'
}

export interface ClientProps extends SoftDeleteProps {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  document?: string; // CPF ou CNPJ
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: ClientStatus;
  clientType?: ClientType;
  notes?: string;
  tags?: string[];
  totalProjectsValue?: number;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Client extends BaseEntity {
  private constructor(
    private readonly id: string,
    private name: Name,
    private email: Email,
    private phone: string,
    private company: string,
    private document: string,
    private address: string,
    private city: string,
    private state: string,
    private zipCode: string,
    private status: ClientStatus,
    private clientType: ClientType,
    private notes: string,
    private tags: string[],
    private totalProjectsValue: number,
    private lastContactDate: Date | null,
    private nextFollowUpDate: Date | null,
    private readonly userId: UserId,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: ClientProps): Client {
    const id = props.id || crypto.randomUUID();
    const name = Name.create(props.name);
    const email = Email.create(props.email);
    const userId = UserId.create(props.userId);

    return new Client(
      id,
      name,
      email,
      props.phone || '',
      props.company || '',
      props.document || '',
      props.address || '',
      props.city || '',
      props.state || '',
      props.zipCode || '',
      props.status || ClientStatus.ACTIVE,
      props.clientType || ClientType.RESIDENTIAL,
      props.notes || '',
      props.tags || [],
      props.totalProjectsValue ?? 0,
      props.lastContactDate || null,
      props.nextFollowUpDate || null,
      userId,
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
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

  updateDocument(newDocument: string): void {
    this.document = newDocument;
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

  updateStatus(newStatus: ClientStatus): void {
    this.status = newStatus;
    this.markAsUpdated();
  }

  updateClientType(newClientType: ClientType): void {
    this.clientType = newClientType;
    this.markAsUpdated();
  }

  updateNotes(newNotes: string): void {
    this.notes = newNotes;
    this.markAsUpdated();
  }

  updateTags(newTags: string[]): void {
    this.tags = newTags;
    this.markAsUpdated();
  }

  updateTotalProjectsValue(value: number): void {
    this.totalProjectsValue = value;
    this.markAsUpdated();
  }

  updateLastContactDate(date: Date | null): void {
    this.lastContactDate = date;
    this.markAsUpdated();
  }

  updateNextFollowUpDate(date: Date | null): void {
    this.nextFollowUpDate = date;
    this.markAsUpdated();
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
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
  getDocument(): string { return this.document; }
  getAddress(): string { return this.address; }
  getCity(): string { return this.city; }
  getState(): string { return this.state; }
  getZipCode(): string { return this.zipCode; }
  getStatus(): ClientStatus { return this.status; }
  getClientType(): ClientType { return this.clientType; }
  getNotes(): string { return this.notes; }
  getTags(): string[] { return this.tags; }
  getTotalProjectsValue(): number { return this.totalProjectsValue; }
  getLastContactDate(): Date | null { return this.lastContactDate; }
  getNextFollowUpDate(): Date | null { return this.nextFollowUpDate; }
  getUserId(): UserId { return this.userId; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}