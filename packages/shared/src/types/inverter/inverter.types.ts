import { BaseEntity, Status } from '../common';
import { Manufacturer } from '../manufacturer';

// ============= INVERTER TYPES =============

export interface Inverter extends BaseEntity {
  readonly manufacturer: Manufacturer;
  readonly model: string;
  readonly power: InverterPower;
  readonly mppt: MPPTConfiguration;
  readonly electrical: ElectricalSpecifications;
  readonly dimensions?: InverterDimensions;
  readonly metadata: InverterMetadata;
  readonly status: Status;
  readonly isPublic: boolean; // Se é público (não pode ser alterado/removido)
}

export interface InverterPower {
  readonly ratedACPower: number; // Rated AC output power (W) Potência nominal AC do inversor
  readonly maxPVPower: number; // Maximum PV input power (W) Potência máxima de entrada PV
  readonly ratedDCPower?: number; // Rated DC output power (W) Potência nominal DC do inversor
  readonly shortCircuitVoltageMax: number; //Tensão CC Máx (V)
  readonly maxInputCurrent: number; // Máxima corrente de entrada (A)
  readonly maxApparentPower: number; // Máxima potência aparente (VA)
  readonly maxDCVoltage?: number; // Máxima tensão CC (V)
  readonly maxOutputCurrent?: number; // Corrente máxima de saída (A)
}

export interface MPPTConfiguration {
  readonly numberOfMppts: number; // Number of MPPTs Quantidade de MPPTs
  readonly stringsPerMppt: number; // Strings per MPPT Quantidade de strings por MPPT
  readonly mpptRange?: string; // ex: '60-550V'
  readonly maxInputCurrentPerMppt?: number; // Corrente máxima de entrada por MPPT (A)
}

export type GridType = 'monofasico' | 'bifasico' | 'trifasico';

export interface ElectricalSpecifications {
  readonly maxEfficiency: number; // Maximum efficiency (%) Eficiência máxima
  readonly europeanEfficiency?: number; // Eficiência europeia (%)
  readonly mpptEfficiency?: number; // Eficiência MPPT (%)
  readonly gridType: GridType; // Tipo de rede elétrica
  readonly ratedVoltage?: string; // Tensão nominal (V) - ex: '220V', '380V'
  readonly frequency?: number; // Frequência (Hz)
  readonly powerFactor?: number; // Fator de potência
}


export interface InverterMetadata {
  readonly price?: number; // Unit price
  readonly currency?: string; // Price currency
  readonly manufacturerId?: string; // Manufacturer ID
  readonly productCode?: string; // Product code
  readonly datasheetUrl?: string; // Datasheet URL
  readonly imageUrl?: string; // Image URL
  readonly certifications: string[]; // Certifications
  readonly warranty: number; // Warranty in years
  readonly connectionType: 'on-grid' | 'off-grid' | 'hybrid'; // Tipo de conexão
  readonly countryOfOrigin?: string; // Country of origin
  readonly protections?: string[]; // ex: ['Sobretensão CC', 'Sobrecorrente CA']
  readonly protectionRating?: string; // ex: 'IP65'
  readonly operatingTemperature?: string; // ex: '-25°C a +60°C'
  readonly userId?: string; // User ID for ownership
  readonly sandiaParameters?: SandiaParameters;
}

export interface SandiaParameters {
  readonly vdco?: number; // Tensão DC nominal de operação (V)
  readonly pso?: number; // Potência de standby/consumo próprio (W)
  readonly c0?: number; // Coeficiente 0 da curva de eficiência
  readonly c1?: number; // Coeficiente 1 da curva de eficiência
  readonly c2?: number; // Coeficiente 2 da curva de eficiência
  readonly c3?: number; // Coeficiente 3 da curva de eficiência
  readonly pnt?: number; // Potência threshold normalizada (fração de Paco)
}

export interface InverterDimensions {
  readonly widthMm: number; // Width in mm
  readonly heightMm: number; // Height in mm
  readonly depthMm: number; // Depth in mm
  readonly weightKg: number; // Weight in kg
}