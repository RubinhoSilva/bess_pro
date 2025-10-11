import { BaseEntity, Status } from '../common';
import { Manufacturer } from '../manufacturer';

// ============= INVERTER TYPES =============

export interface Inverter extends BaseEntity {
  readonly manufacturer: Manufacturer;
  readonly model: string;
  readonly power: InverterPower;
  readonly mppt: MPPTConfiguration;
  readonly electrical: ElectricalSpecifications;
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
}

export interface MPPTConfiguration {
  readonly numberOfMppts: number; // Number of MPPTs Quantidade de MPPTs
  readonly stringsPerMppt: number; // Strings per MPPT Quantidade de strings por MPPT
}

export type GridType = 'monofasico' | 'bifasico' | 'trifasico';

export interface ElectricalSpecifications {
  readonly maxEfficiency: number; // Maximum efficiency (%) Eficiência máxima
  readonly gridType: GridType; // Tipo de rede elétrica
  readonly ratedVoltage?: number; // Tensão nominal (V)
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
}