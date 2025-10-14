/**
 * Frontend adapter for solar analysis
 * 
 * Converts between frontend format (snake_case) and internal types (camelCase)
 */

import { 
  RoofWaterAreaRequest,
  ModuleWithSandiaParams,
  InverterConfiguration,
  LossesBreakdown,
  Coordinates,
  DataSource,
  DecompositionModel,
  TranspositionModel,
  MountType
} from '../../types/solar-analysis';

/**
 * Interface para dados que vêm do frontend (formato snake_case)
 */
export interface FrontendSolarRequest {
  lat: number;
  lon: number;
  origem_dados: DataSource;
  startyear?: number;
  endyear?: number;
  modelo_decomposicao?: DecompositionModel;
  modelo_transposicao?: TranspositionModel;
  mount_type?: MountType;
  consumo_anual_kwh: number;
  modulo: FrontendModule;
  aguasTelhado: FrontendRoofWaterArea[];
  perdas?: FrontendLosses;
}

export interface FrontendModule {
  fabricante: string;
  modelo: string;
  potencia_nominal_w: number;
  largura_mm?: number;
  altura_mm?: number;
  peso_kg?: number;
  vmpp?: number;
  impp?: number;
  voc_stc?: number;
  isc_stc?: number;
  eficiencia?: number;
  temp_coef_pmax: number;
  alpha_sc?: number;
  beta_oc?: number;
  gamma_r?: number;
  cells_in_series?: number;
  a_ref?: number;
  il_ref?: number;
  io_ref?: number;
  rs?: number;
  rsh_ref?: number;
}

export interface FrontendRoofWaterArea {
  nome: string;
  orientacao: number;
  inclinacao: number;
  numeroModulos: number;
  inversor: FrontendInverter;
  inversorId?: string;
  sombreamentoParcial?: number;
}

export interface FrontendInverter {
  fabricante: string;
  modelo: string;
  potencia_saida_ca_w: number;
  tipo_rede: string;
  potencia_fv_max_w: number;
  tensao_cc_max_v: number;
  numero_mppt: number;
  strings_por_mppt: number;
  eficiencia_max: number;
}

export interface FrontendLosses {
  sujeira: number;
  sombreamento: number;
  incompatibilidade: number;
  fiacao: number;
  outras: number;
}

/**
 * Adapter functions
 */

/**
 * Converte dados do frontend para o formato interno
 */
export function frontendToInternal(request: FrontendSolarRequest): RoofWaterAreaRequest {
  return {
    aguasTelhado: request.aguasTelhado.map(frontendToRoofWaterArea),
    consumo_anual_kwh: request.consumo_anual_kwh,
    perdas: request.perdas || getDefaultLosses(request.aguasTelhado),
    modulo: frontendToModule(request.modulo),
    lat: request.lat,
    lon: request.lon,
    origem_dados: request.origem_dados,
    startyear: request.startyear,
    endyear: request.endyear,
    modelo_decomposicao: request.modelo_decomposicao,
    modelo_transposicao: request.modelo_transposicao,
    mount_type: request.mount_type
  };
}

/**
 * Converte módulo do frontend para formato interno
 */
export function frontendToModule(frontendModule: FrontendModule): ModuleWithSandiaParams {
  return {
    fabricante: frontendModule.fabricante,
    modelo: frontendModule.modelo,
    potencia_nominal_w: frontendModule.potencia_nominal_w,
    largura_mm: frontendModule.largura_mm,
    altura_mm: frontendModule.altura_mm,
    peso_kg: frontendModule.peso_kg,
    vmpp: frontendModule.vmpp,
    impp: frontendModule.impp,
    voc_stc: frontendModule.voc_stc,
    isc_stc: frontendModule.isc_stc,
    eficiencia: frontendModule.eficiencia,
    temp_coef_pmax: frontendModule.temp_coef_pmax,
    alpha_sc: frontendModule.alpha_sc,
    beta_oc: frontendModule.beta_oc,
    gamma_r: frontendModule.gamma_r,
    cells_in_series: frontendModule.cells_in_series,
    a_ref: frontendModule.a_ref,
    il_ref: frontendModule.il_ref,
    io_ref: frontendModule.io_ref,
    rs: frontendModule.rs,
    rsh_ref: frontendModule.rsh_ref
  };
}

/**
 * Converte área de telhado do frontend para formato interno
 */
export function frontendToRoofWaterArea(frontendArea: FrontendRoofWaterArea): any {
  return {
    nome: frontendArea.nome,
    orientacao: frontendArea.orientacao,
    inclinacao: frontendArea.inclinacao,
    numeroModulos: frontendArea.numeroModulos,
    inversor: frontendToInverter(frontendArea.inversor),
    inversorId: frontendArea.inversorId,
    sombreamentoParcial: frontendArea.sombreamentoParcial
  };
}

/**
 * Converte inversor do frontend para formato interno
 */
export function frontendToInverter(frontendInverter: FrontendInverter): InverterConfiguration {
  return {
    fabricante: frontendInverter.fabricante,
    modelo: frontendInverter.modelo,
    potencia_saida_ca_w: frontendInverter.potencia_saida_ca_w,
    tipo_rede: frontendInverter.tipo_rede,
    potencia_fv_max_w: frontendInverter.potencia_fv_max_w,
    tensao_cc_max_v: frontendInverter.tensao_cc_max_v,
    numero_mppt: frontendInverter.numero_mppt,
    strings_por_mppt: frontendInverter.strings_por_mppt,
    eficiencia_max: frontendInverter.eficiencia_max,
    efficiency_dc_ac: frontendInverter.eficiencia_max / 100
  };
}

/**
 * Obtém perdas padrão se não fornecidas
 */
function getDefaultLosses(aguasTelhado: FrontendRoofWaterArea[]): LossesBreakdown {
  return {
    sujeira: 2.0,
    sombreamento: aguasTelhado?.[0]?.sombreamentoParcial || 0.0,
    incompatibilidade: 1.0,
    fiacao: 0.5,
    outras: 0.5
  };
}

/**
 * Valida dados básicos do frontend
 */
export function validateFrontendRequest(request: FrontendSolarRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.lat || !request.lon) {
    errors.push('Latitude e longitude são obrigatórios');
  }

  if (!request.modulo || !request.modulo.fabricante || !request.modulo.modelo) {
    errors.push('Dados do módulo são obrigatórios');
  }

  if (!request.consumo_anual_kwh || request.consumo_anual_kwh <= 0) {
    errors.push('Consumo anual deve ser maior que zero');
  }

  if (!request.aguasTelhado || request.aguasTelhado.length === 0) {
    errors.push('Pelo menos uma água de telhado é necessária');
  }

  if (!request.origem_dados) {
    errors.push('Origem dos dados (PVGIS ou NASA) é obrigatória');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}