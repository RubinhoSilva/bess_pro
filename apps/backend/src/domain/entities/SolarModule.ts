import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface SolarModuleData extends SoftDeleteProps {
  id?: string;
  userId: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number; // Watts
  larguraMm?: number;
  alturaMm?: number;
  espessuraMm?: number;
  vmpp?: number; // Voltage at Maximum Power Point (V)
  impp?: number; // Current at Maximum Power Point (A)
  voc?: number; // Open Circuit Voltage (V)
  isc?: number; // Short Circuit Current (A)
  tipoCelula?: string; // ex: Monocristalino, Policristalino
  eficiencia?: number; // Percentual (%)
  numeroCelulas?: number;
  tempCoefPmax?: number; // Coeficiente de temperatura de Pmax (%/°C)
  tempCoefVoc?: number; // Coeficiente de temperatura de Voc (%/°C)
  tempCoefIsc?: number; // Coeficiente de temperatura de Isc (%/°C)
  pesoKg?: number;
  datasheetUrl?: string;
  certificacoes?: string[]; // ex: ['IEC61215', 'IEC61730']
  garantiaAnos?: number;
  tolerancia?: string; // ex: '+3/-0%'
  createdAt?: Date;
  updatedAt?: Date;
}

export class SolarModule extends BaseEntity {
  constructor(
    private data: SolarModuleData
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
    if (!this.data.fabricante?.trim()) {
      throw new Error('Fabricante é obrigatório');
    }
    if (!this.data.modelo?.trim()) {
      throw new Error('Modelo é obrigatório');
    }
    if (!this.data.potenciaNominal || this.data.potenciaNominal <= 0) {
      throw new Error('Potência nominal deve ser maior que zero');
    }
    if (!this.data.userId?.trim()) {
      throw new Error('ID do usuário é obrigatório');
    }
  }

  // Getters
  get id(): string | undefined { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get fabricante(): string { return this.data.fabricante; }
  get modelo(): string { return this.data.modelo; }
  get potenciaNominal(): number { return this.data.potenciaNominal; }
  get larguraMm(): number | undefined { return this.data.larguraMm; }
  get alturaMm(): number | undefined { return this.data.alturaMm; }
  get espessuraMm(): number | undefined { return this.data.espessuraMm; }
  get vmpp(): number | undefined { return this.data.vmpp; }
  get impp(): number | undefined { return this.data.impp; }
  get voc(): number | undefined { return this.data.voc; }
  get isc(): number | undefined { return this.data.isc; }
  get tipoCelula(): string | undefined { return this.data.tipoCelula; }
  get eficiencia(): number | undefined { return this.data.eficiencia; }
  get numeroCelulas(): number | undefined { return this.data.numeroCelulas; }
  get tempCoefPmax(): number | undefined { return this.data.tempCoefPmax; }
  get tempCoefVoc(): number | undefined { return this.data.tempCoefVoc; }
  get tempCoefIsc(): number | undefined { return this.data.tempCoefIsc; }
  get pesoKg(): number | undefined { return this.data.pesoKg; }
  get datasheetUrl(): string | undefined { return this.data.datasheetUrl; }
  get certificacoes(): string[] | undefined { return this.data.certificacoes; }
  get garantiaAnos(): number | undefined { return this.data.garantiaAnos; }
  get tolerancia(): string | undefined { return this.data.tolerancia; }
  get createdAt(): Date | undefined { return this.data.createdAt; }
  get updatedAt(): Date | undefined { return this.data.updatedAt; }

  // Business methods
  public calculateArea(): number | undefined {
    if (this.data.larguraMm && this.data.alturaMm) {
      return (this.data.larguraMm * this.data.alturaMm) / 1_000_000; // Convert to m²
    }
    return undefined;
  }

  public calculatePowerDensity(): number | undefined {
    const area = this.calculateArea();
    if (area) {
      return this.data.potenciaNominal / area; // W/m²
    }
    return undefined;
  }

  public isCompatibleVoltage(systemVoltage: number): boolean {
    if (this.data.vmpp) {
      // Basic compatibility check - real implementation would be more complex
      return this.data.vmpp <= systemVoltage && this.data.vmpp >= systemVoltage * 0.7;
    }
    return true; // Unknown compatibility
  }

  public toJSON(): SolarModuleData {
    return { ...this.data };
  }

  public update(updates: Partial<SolarModuleData>): SolarModule {
    const updatedData = {
      ...this.data,
      ...updates,
      updatedAt: new Date()
    };
    return new SolarModule(updatedData);
  }

  getId(): string { return this.data.id || ''; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}