/**
 * Roof water area and inverter configuration types
 */

// Import required types
import { ModuleWithSandiaParams } from './module.types';
import { DataSource, DecompositionModel, TranspositionModel, MountType } from './solar-analysis.types';
import { LossesBreakdown } from './losses.types';

export interface RoofWaterArea {
  nome: string;
  orientacao: number;
  inclinacao: number;
  numeroModulos: number;
  inversor: InverterConfiguration;
  inversorId?: string;
  sombreamentoParcial?: number;
}

export interface RoofWaterAreaRequest {
  aguasTelhado: RoofWaterArea[];
  consumo_anual_kwh: number;
  perdas: LossesBreakdown;
  modulo: ModuleWithSandiaParams;
  lat: number;
  lon: number;
  origem_dados: DataSource;
  startyear?: number;
  endyear?: number;
  modelo_decomposicao?: DecompositionModel;
  modelo_transposicao?: TranspositionModel;
  mount_type?: MountType;
}

export interface InverterConfiguration {
  fabricante: string;
  modelo: string;
  potencia_saida_ca_w: number;
  tipo_rede: string;
  potencia_fv_max_w: number;
  tensao_cc_max_v: number;
  numero_mppt: number;
  strings_por_mppt: number;
  eficiencia_max: number;
  efficiency_dc_ac?: number;
}

export interface InverterPower {
  ratedACPower: number;
  maxDCPower: number;
  maxDCVoltage: number;
  efficiency: number;
}

export interface MPPTConfiguration {
  numberOfMPPTs: number;
  stringsPerMPPT: number;
  modulesPerString: number;
}