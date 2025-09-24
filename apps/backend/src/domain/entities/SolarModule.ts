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
  
  // Parâmetros para modelo espectral
  material?: string; // Material da célula (c-Si, a-Si, CdTe, etc.)
  technology?: string; // Tecnologia (mono-Si, mc-Si, a-Si, CdTe, etc.)
  
  // Parâmetros do modelo de diodo único (5 parâmetros fundamentais)
  aRef?: number; // Fator de idealidade modificado [V]
  iLRef?: number; // Fotocorrente STC [A]
  iORef?: number; // Corrente saturação reversa STC [A]
  rS?: number; // Resistência série [Ω]
  rShRef?: number; // Resistência paralelo STC [Ω]
  
  // Coeficientes de temperatura críticos
  alphaSc?: number; // Coef. temperatura corrente [A/°C]
  betaOc?: number; // Coef. temperatura tensão [V/°C]
  gammaR?: number; // Coef. temperatura potência [1/°C]
  
  // Parâmetros SAPM térmicos
  a0?: number; a1?: number; a2?: number; a3?: number; a4?: number;
  b0?: number; b1?: number; b2?: number; b3?: number; b4?: number; b5?: number;
  dtc?: number; // Delta T para SAPM [°C]
  
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
  get material(): string | undefined { return this.data.material; }
  get technology(): string | undefined { return this.data.technology; }
  get aRef(): number | undefined { return this.data.aRef; }
  get iLRef(): number | undefined { return this.data.iLRef; }
  get iORef(): number | undefined { return this.data.iORef; }
  get rS(): number | undefined { return this.data.rS; }
  get rShRef(): number | undefined { return this.data.rShRef; }
  get alphaSc(): number | undefined { return this.data.alphaSc; }
  get betaOc(): number | undefined { return this.data.betaOc; }
  get gammaR(): number | undefined { return this.data.gammaR; }
  get a0(): number | undefined { return this.data.a0; }
  get a1(): number | undefined { return this.data.a1; }
  get a2(): number | undefined { return this.data.a2; }
  get a3(): number | undefined { return this.data.a3; }
  get a4(): number | undefined { return this.data.a4; }
  get b0(): number | undefined { return this.data.b0; }
  get b1(): number | undefined { return this.data.b1; }
  get b2(): number | undefined { return this.data.b2; }
  get b3(): number | undefined { return this.data.b3; }
  get b4(): number | undefined { return this.data.b4; }
  get b5(): number | undefined { return this.data.b5; }
  get dtc(): number | undefined { return this.data.dtc; }
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