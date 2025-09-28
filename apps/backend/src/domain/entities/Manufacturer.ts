import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export enum ManufacturerType {
  SOLAR_MODULE = 'SOLAR_MODULE',
  INVERTER = 'INVERTER',
  BOTH = 'BOTH'
}

export interface ManufacturerData extends SoftDeleteProps {
  id?: string;
  name: string;
  type: ManufacturerType;
  teamId?: string;
  isDefault: boolean;
  description?: string;
  website?: string;
  country?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Manufacturer extends BaseEntity {
  constructor(
    private data: ManufacturerData
  ) {
    super({
      isDeleted: data.isDeleted,
      deletedAt: data.deletedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
    this.validateRequired();
  }

  private validateRequired(): void {
    if (!this.data.name?.trim()) {
      throw new Error('Nome do fabricante é obrigatório');
    }
    if (!Object.values(ManufacturerType).includes(this.data.type)) {
      throw new Error('Tipo de fabricante inválido');
    }
  }

  // Getters
  get id(): string | undefined { return this.data.id; }
  get name(): string { return this.data.name; }
  get type(): ManufacturerType { return this.data.type; }
  get teamId(): string | undefined { return this.data.teamId; }
  get isDefault(): boolean { return this.data.isDefault; }
  get description(): string | undefined { return this.data.description; }
  get website(): string | undefined { return this.data.website; }
  get country(): string | undefined { return this.data.country; }
  get logoUrl(): string | undefined { return this.data.logoUrl; }
  get supportEmail(): string | undefined { return this.data.supportEmail; }
  get supportPhone(): string | undefined { return this.data.supportPhone; }
  get certifications(): string[] | undefined { return this.data.certifications; }
  get createdAt(): Date | undefined { return this.data.createdAt; }
  get updatedAt(): Date | undefined { return this.data.updatedAt; }

  // Business methods
  public canManufacture(type: 'SOLAR_MODULE' | 'INVERTER'): boolean {
    return this.data.type === ManufacturerType.BOTH || this.data.type === type;
  }

  public isDeletable(): boolean {
    return !this.data.isDefault;
  }

  public isAccessibleByTeam(teamId?: string): boolean {
    if (this.data.isDefault) {
      return true;
    }
    return this.data.teamId === teamId;
  }

  public toJSON(): ManufacturerData {
    return { ...this.data };
  }

  public update(updates: Partial<ManufacturerData>): Manufacturer {
    // Não permitir alterar isDefault para false em fabricantes padrão
    if (this.data.isDefault && updates.isDefault === false) {
      throw new Error('Não é possível alterar fabricantes padrão para não padrão');
    }

    const updatedData = {
      ...this.data,
      ...updates,
      updatedAt: new Date()
    };
    return new Manufacturer(updatedData);
  }

  getId(): string { return this.data.id || ''; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}