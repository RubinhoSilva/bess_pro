/**
 * Python PVLIB service communication types
 */

// Re-export types needed for Python communication
import { 
  Coordinates, 
  DataSource, 
  DecompositionModel, 
  TranspositionModel, 
  MountType 
} from './solar-analysis.types';
import { ModuleWithSandiaParams } from './module.types';
import { InverterConfiguration } from './roof-water.types';
import { LossesBreakdown } from './losses.types';

// Main Python PVLIB request for advanced modules calculation
export interface PythonPvlibRequest {
  lat: number;
  lon: number;
  origem_dados: DataSource;
  startyear?: number;
  endyear?: number;
  modelo_decomposicao?: DecompositionModel;
  modelo_transposicao?: TranspositionModel;
  mount_type?: MountType;
  consumo_mensal_kwh: number[];
  perdas: LossesBreakdown;
  modulo: ModuleWithSandiaParams;
  inversores: InverterConfiguration[];
}

// Main Python PVLIB response
export interface PythonPvlibResponse {
  num_modulos: number;
  potencia_total_kwp: number;
  energia_por_modulo?: number;
  energia_anual_kwh: number;
  energia_dc_anual_kwh: number;
  perda_clipping_kwh?: number;
  perda_clipping_pct?: number;
  geracao_mensal_kwh: number[];
  consumo_anual_kwh?: number;
  yield_especifico: number;
  cobertura_percentual?: number;
  fator_capacidade?: number;
  pr_total: number;
  hsp_equivalente_dia?: number;
  hsp_equivalente_anual?: number;
  energia_anual_std?: number;
  variabilidade_percentual?: number;
  energia_por_ano?: number[];
  energia_diaria_media?: number;
  energia_diaria_std?: number;
  energia_diaria_min?: number;
  energia_diaria_max?: number;
  compatibilidade_sistema?: SystemCompatibility;
  area_necessaria_m2?: number;
  peso_total_kg?: number;
  economia_anual_co2?: number;
  perdas_detalhadas?: DetailedLosses;
  parametros_completos?: any;
  dados_processados?: any;
  anos_analisados?: number;
  periodo_dados?: string;
  inversores?: InverterResult[];
}

// Irradiation analysis request
export interface PythonIrradiationRequest {
  lat: number;
  lon: number;
  tilt?: number;
  azimuth?: number;
  modelo_decomposicao?: DecompositionModel;
  data_source: DataSource;
}

// Irradiation analysis response
export interface PythonIrradiationResponse {
  irradiacao_mensal: number[];
  media_anual: number;
  maximo: number;
  minimo: number;
  variacao_sazonal: number;
  configuracao: {
    fonte_dados: DataSource;
    localizacao: Coordinates;
    parametros: any;
  };
  coordenadas: Coordinates;
  periodo_analise: string;
  registros_processados: number;
}

// Financial analysis request
export interface PythonFinancialRequest {
  investimento_inicial: number;
  geracao_mensal: number[];
  consumo_mensal: number[];
  tarifa_energia: number;
  custo_fio_b?: number;
  vida_util?: number;
  taxa_desconto?: number;
  inflacao_energia?: number;
  degradacao_modulos?: number;
  custo_om?: number;
  inflacao_om?: number;
  modalidade_tarifaria?: string;
}

// Financial analysis response
export interface PythonFinancialResponse {
  vpl: number;
  tir: number;
  payback_simples: number;
  payback_descontado: number;
  economia_total_25_anos: number;
  economia_anual_media: number;
  lucratividade_index: number;
  cash_flow: CashFlowData[];
  indicadores: FinancialIndicators;
  sensibilidade?: SensitivityData;
  cenarios?: ScenarioData[];
}

// MPPT calculation request
export interface PythonMPPTRequest {
  fabricante: string;
  modelo: string;
  potencia_modulo_w: number;
  voc_stc: number;
  temp_coef_voc: number;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

// MPPT calculation response
export interface PythonMPPTResponse {
  modulos_por_mppt: number[];
  modulos_total_sistema: number;
  limitacao_principal: string;
  detalhes_tecnicos?: any;
  alertas?: string[];
}

// Supporting types
export interface SystemCompatibility {
  compativel: boolean;
  alertas: string[];
  limitacoes: string[];
}

export interface DetailedLosses {
  perdaTemperatura: number;
  perdaSombreamento: number;
  perdaMismatch: number;
  perdaCabeamento: number;
  perdaSujeira: number;
  perdaOutras: number;
  perdaClipping?: number;
}

export interface InverterResult {
  fabricante: string;
  modelo: string;
  potencia_saida_ca_w: number;
  modulos_conectados: number;
  strings: number[];
  producao_anual_kwh: number;
  perdas_percentual: number;
}

export interface CashFlowData {
  ano: number;
  geracao_kwh: number;
  economia_reais: number;
  custo_om_reais: number;
  fluxo_caixa_liquido: number;
  fluxo_caixa_acumulado: number;
}

export interface FinancialIndicators {
  vpl: number;
  tir: number;
  payback_simples: number;
  payback_descontado: number;
  roi: number;
  lcoe: number;
}

export interface SensitivityData {
  variacao_tarifa: any[];
  variacao_irradiacao: any[];
  variacao_investimento: any[];
}

export interface ScenarioData {
  nome: string;
  descricao: string;
  parametros: any;
  resultados: FinancialIndicators;
}