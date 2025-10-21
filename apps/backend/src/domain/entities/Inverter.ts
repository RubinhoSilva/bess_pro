import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface InverterData extends SoftDeleteProps {
  id?: string;
  teamId: string;
  manufacturerId?: string;
  fabricante?: string;
  modelo: string;
  potenciaSaidaCA: number; // Potência nominal de saída CA (W)
  tipoRede: string; // ex: 'Monofásico 220V', 'Trifásico 380V'
  
  // Dados de entrada (CC/FV)
  potenciaMaxima?: number; // Máxima potência FV (W)
  tensaoCcMax?: number; // Máxima tensão CC (V)
  numeroMppt?: number; // Número de MPPTs
  stringsPorMppt?: number; // Strings por MPPT
  faixaMppt?: string; // ex: '60-550V'
  correnteEntradaMax?: number; // Corrente máxima de entrada por MPPT (A)
  
  // Dados de saída (CA)
  potenciaAparenteMax?: number; // Potência aparente máxima (VA)
  correnteSaidaMax?: number; // Corrente máxima de saída (A)
  tensaoSaidaNominal?: string; // ex: '220V', '380V'
  frequenciaNominal?: number; // ex: 60 (Hz)
  
  // Eficiência
  eficienciaMaxima?: number; // Eficiência máxima (%)
  eficienciaEuropeia?: number; // Eficiência europeia (%)
  eficienciaMppt?: number; // Eficiência MPPT (%)
  
  // Proteções e certificações
  protecoes?: string[]; // ex: ['Sobretensão CC', 'Sobrecorrente CA']
  certificacoes?: string[]; // ex: ['IEC62109', 'IEEE1547']
  grauProtecao?: string; // ex: 'IP65'
  
  // Características físicas
  dimensoes?: {
    larguraMm: number;
    alturaMm: number;
    profundidadeMm: number;
  };
  pesoKg?: number;
  temperaturaOperacao?: string; // ex: '-25°C a +60°C'
  
  // Dados comerciais
  garantiaAnos?: number;
  datasheetUrl?: string;
  precoReferencia?: number;
  
  // Parâmetros Sandia para simulação precisa
  vdco?: number; // Tensão DC nominal de operação (V)
  pso?: number; // Potência de standby/consumo próprio (W)
  c0?: number; // Coeficiente 0 da curva de eficiência
  c1?: number; // Coeficiente 1 da curva de eficiência
  c2?: number; // Coeficiente 2 da curva de eficiência
  c3?: number; // Coeficiente 3 da curva de eficiência
  pnt?: number; // Potência threshold normalizada (fração de Paco)
  
  createdAt?: Date;
  updatedAt?: Date;
}

export class Inverter extends BaseEntity {
  constructor(
    private data: InverterData
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
    if (!this.data.modelo?.trim()) {
      throw new Error('Modelo é obrigatório');
    }
    if (!this.data.potenciaSaidaCA || this.data.potenciaSaidaCA <= 0) {
      throw new Error('Potência de saída CA deve ser maior que zero');
    }
    if (!this.data.teamId?.trim()) {
      throw new Error('ID do time é obrigatório');
    }
  }

  // Getters
  get id(): string | undefined { return this.data.id; }
  get teamId(): string { return this.data.teamId; }
  get manufacturerId(): string | undefined { return this.data.manufacturerId; }
  get fabricante(): string | undefined { return this.data.fabricante; }
  get modelo(): string { return this.data.modelo; }
  get potenciaSaidaCA(): number { return this.data.potenciaSaidaCA; }
  get tipoRede(): string { return this.data.tipoRede; }
  get potenciaMaxima(): number | undefined { return this.data.potenciaMaxima; }
  get tensaoCcMax(): number | undefined { return this.data.tensaoCcMax; }
  get numeroMppt(): number | undefined { return this.data.numeroMppt; }
  get stringsPorMppt(): number | undefined { return this.data.stringsPorMppt; }
  get faixaMppt(): string | undefined { return this.data.faixaMppt; }
  get correnteEntradaMax(): number | undefined { return this.data.correnteEntradaMax; }
  get potenciaAparenteMax(): number | undefined { return this.data.potenciaAparenteMax; }
  get correnteSaidaMax(): number | undefined { return this.data.correnteSaidaMax; }
  get eficienciaMaxima(): number | undefined { return this.data.eficienciaMaxima; }
  get eficienciaEuropeia(): number | undefined { return this.data.eficienciaEuropeia; }
  get eficienciaMppt(): number | undefined { return this.data.eficienciaMppt; }
  get tensaoSaidaNominal(): string | undefined { return this.data.tensaoSaidaNominal; }
  get frequenciaNominal(): number | undefined { return this.data.frequenciaNominal; }
  get dimensoes(): { larguraMm: number; alturaMm: number; profundidadeMm: number; } | undefined { return this.data.dimensoes; }
  get pesoKg(): number | undefined { return this.data.pesoKg; }
  get protecoes(): string[] | undefined { return this.data.protecoes; }
  get grauProtecao(): string | undefined { return this.data.grauProtecao; }
  get temperaturaOperacao(): string | undefined { return this.data.temperaturaOperacao; }
  get certificacoes(): string[] | undefined { return this.data.certificacoes; }
  get garantiaAnos(): number | undefined { return this.data.garantiaAnos; }
  get datasheetUrl(): string | undefined { return this.data.datasheetUrl; }
  get vdco(): number | undefined { return this.data.vdco; }
  get pso(): number | undefined { return this.data.pso; }
  get c0(): number | undefined { return this.data.c0; }
  get c1(): number | undefined { return this.data.c1; }
  get c2(): number | undefined { return this.data.c2; }
  get c3(): number | undefined { return this.data.c3; }
  get pnt(): number | undefined { return this.data.pnt; }
  get createdAt(): Date | undefined { return this.data.createdAt; }
  get updatedAt(): Date | undefined { return this.data.updatedAt; }

  // Business methods
  public calculateMaxModules(modulePower: number): number | undefined {
    if (this.data.potenciaMaxima && modulePower > 0) {
      return Math.floor(this.data.potenciaMaxima / modulePower);
    }
    return undefined;
  }

  public calculateMaxStrings(): number | undefined {
    if (this.data.numeroMppt && this.data.stringsPorMppt) {
      return this.data.numeroMppt * this.data.stringsPorMppt;
    }
    return undefined;
  }

  public isCompatibleWithModules(moduleVmpp: number, moduleImpp: number): boolean {
    // Basic compatibility check
    let compatible = true;

    // Check voltage compatibility
    if (this.data.tensaoCcMax && moduleVmpp > this.data.tensaoCcMax) {
      compatible = false;
    }

    // Check current compatibility
    if (this.data.correnteEntradaMax && moduleImpp > this.data.correnteEntradaMax) {
      compatible = false;
    }

    return compatible;
  }

  public calculateEfficiencyAtLoad(loadPercentage: number): number | undefined {
    if (this.data.eficienciaMaxima) {
      // Simplified efficiency curve - real implementation would use manufacturer curves
      const optimumLoad = 0.5; // 50% load typically has peak efficiency
      const efficiencyFactor = 1 - Math.pow(loadPercentage - optimumLoad, 2) * 0.1;
      return Math.min(this.data.eficienciaMaxima * efficiencyFactor, this.data.eficienciaMaxima);
    }
    return undefined;
  }

  public toJSON(): InverterData {
    return { ...this.data };
  }

  public update(updates: Partial<InverterData>): Inverter {
    const updatedData = {
      ...this.data,
      ...updates,
      updatedAt: new Date()
    };
    return new Inverter(updatedData);
  }

  getId(): string { return this.data.id || ''; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}