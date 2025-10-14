/**
 * Python PVLIB adapter for solar analysis
 * 
 * Converts between internal types and Python PVLIB service format
 */

import { 
  PythonPvlibRequest,
  PythonIrradiationRequest,
  PythonFinancialRequest,
  PythonMPPTRequest,
  ModuleWithSandiaParams,
  InverterConfiguration,
  LossesBreakdown,
  DataSource,
  DecompositionModel,
  TranspositionModel,
  MountType
} from '../../types/solar-analysis';

/**
 * Adapter functions for Python PVLIB communication
 */

/**
 * Converte dados internos para formato Python PVLIB
 */
export function internalToPythonPvlib(
  lat: number,
  lon: number,
  consumoMensalKwh: number[],
  modulo: ModuleWithSandiaParams,
  inversores: InverterConfiguration[],
  perdas: LossesBreakdown,
  options: {
    origemDados?: DataSource;
    startYear?: number;
    endYear?: number;
    modeloDecomposicao?: DecompositionModel;
    modeloTransposicao?: TranspositionModel;
    mountType?: MountType;
  } = {}
): PythonPvlibRequest {
  return {
    lat,
    lon,
    origem_dados: options.origemDados || 'PVGIS',
    startyear: options.startYear || 2015,
    endyear: options.endYear || 2020,
    modelo_decomposicao: options.modeloDecomposicao || 'louche',
    modelo_transposicao: options.modeloTransposicao || 'perez',
    mount_type: options.mountType || 'close_mount_glass_glass',
    consumo_mensal_kwh: consumoMensalKwh,
    perdas: perdas,
    modulo: adaptModuleForPython(modulo),
    inversores: inversores.map(adaptInverterForPython)
  };
}

/**
 * Converte dados para análise de irradiação
 */
export function internalToPythonIrradiation(
  lat: number,
  lon: number,
  options: {
    tilt?: number;
    azimuth?: number;
    modeloDecomposicao?: DecompositionModel;
    dataSource: DataSource;
  }
): PythonIrradiationRequest {
  return {
    lat,
    lon,
    tilt: options.tilt || 0,
    azimuth: options.azimuth || 0,
    modelo_decomposicao: options.modeloDecomposicao || 'erbs',
    data_source: options.dataSource
  };
}

/**
 * Converte dados para análise financeira
 */
export function internalToPythonFinancial(
  investimentoInicial: number,
  geracaoMensal: number[],
  consumoMensal: number[],
  tarifaEnergia: number,
  options: {
    custoFioB?: number;
    vidaUtil?: number;
    taxaDesconto?: number;
    inflacaoEnergia?: number;
    degradacaoModulos?: number;
    custoOM?: number;
    inflacaoOM?: number;
    modalidadeTarifaria?: string;
  } = {}
): PythonFinancialRequest {
  return {
    investimento_inicial: investimentoInicial,
    geracao_mensal: geracaoMensal,
    consumo_mensal: consumoMensal,
    tarifa_energia: tarifaEnergia,
    custo_fio_b: options.custoFioB || 0.3,
    vida_util: options.vidaUtil || 25,
    taxa_desconto: options.taxaDesconto || 8.0,
    inflacao_energia: options.inflacaoEnergia || 4.5,
    degradacao_modulos: options.degradacaoModulos || 0.5,
    custo_om: options.custoOM || 0,
    inflacao_om: options.inflacaoOM || 4.0,
    modalidade_tarifaria: options.modalidadeTarifaria || 'convencional'
  };
}

/**
 * Converte dados para cálculo MPPT
 */
export function internalToPythonMPPT(
  fabricante: string,
  modelo: string,
  potenciaModuloW: number,
  vocStc: number,
  tempCoefVoc: number,
  latitude: number,
  longitude: number,
  additionalParams: Record<string, any> = {}
): PythonMPPTRequest {
  return {
    fabricante,
    modelo,
    potencia_modulo_w: potenciaModuloW,
    voc_stc: vocStc,
    temp_coef_voc: tempCoefVoc,
    latitude,
    longitude,
    ...additionalParams
  };
}

/**
 * Adapta módulo para formato Python (garante campos obrigatórios)
 */
function adaptModuleForPython(modulo: ModuleWithSandiaParams): ModuleWithSandiaParams {
  return {
    fabricante: modulo.fabricante,
    modelo: modulo.modelo,
    potencia_nominal_w: modulo.potencia_nominal_w,
    largura_mm: modulo.largura_mm || 1000, // default se não fornecido
    altura_mm: modulo.altura_mm || 2000, // default se não fornecido
    peso_kg: modulo.peso_kg || 20, // default se não fornecido
    vmpp: modulo.vmpp,
    impp: modulo.impp,
    voc_stc: modulo.voc_stc || (modulo.vmpp ? modulo.vmpp * 1.2 : undefined), // estimativa
    isc_stc: modulo.isc_stc || (modulo.impp ? modulo.impp * 1.1 : undefined), // estimativa
    eficiencia: modulo.eficiencia || ((modulo.potencia_nominal_w / ((modulo.largura_mm || 1000) * (modulo.altura_mm || 2000) / 1000000)) * 100),
    temp_coef_pmax: modulo.temp_coef_pmax,
    alpha_sc: modulo.alpha_sc,
    beta_oc: modulo.beta_oc,
    gamma_r: modulo.gamma_r,
    cells_in_series: modulo.cells_in_series || 60, // default comum
    a_ref: modulo.a_ref,
    il_ref: modulo.il_ref,
    io_ref: modulo.io_ref,
    rs: modulo.rs,
    rsh_ref: modulo.rsh_ref
  };
}

/**
 * Adapta inversor para formato Python
 */
function adaptInverterForPython(inversor: InverterConfiguration): InverterConfiguration {
  return {
    fabricante: inversor.fabricante,
    modelo: inversor.modelo,
    potencia_saida_ca_w: inversor.potencia_saida_ca_w,
    tipo_rede: inversor.tipo_rede,
    potencia_fv_max_w: inversor.potencia_fv_max_w,
    tensao_cc_max_v: inversor.tensao_cc_max_v,
    numero_mppt: inversor.numero_mppt,
    strings_por_mppt: inversor.strings_por_mppt,
    eficiencia_max: inversor.eficiencia_max,
    efficiency_dc_ac: inversor.efficiency_dc_ac || (inversor.eficiencia_max / 100)
  };
}

/**
 * Valida dados antes de enviar para Python
 */
export function validatePythonRequest(request: PythonPvlibRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.lat || !request.lon) {
    errors.push('Latitude e longitude são obrigatórios');
  }

  if (!request.modulo || !request.modulo.fabricante || !request.modulo.modelo) {
    errors.push('Dados do módulo são obrigatórios');
  }

  if (!request.consumo_mensal_kwh || request.consumo_mensal_kwh.length !== 12) {
    errors.push('Consumo mensal deve ter 12 valores');
  }

  if (!request.inversores || request.inversores.length === 0) {
    errors.push('Pelo menos um inversor é necessário');
  }

  if (!request.origem_dados) {
    errors.push('Origem dos dados é obrigatória');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Prepara consumo mensal a partir do consumo anual
 */
export function calculateMonthlyConsumption(annualConsumptionKwh: number): number[] {
  const monthlyAverage = annualConsumptionKwh / 12;
  return Array(12).fill(monthlyAverage);
}

/**
 * Agrupa águas de telhado por inversor
 */
export function groupRoofAreasByInverter(roofAreas: any[]): InverterConfiguration[] {
  const inversoresMap = new Map<string, InverterConfiguration>();

  roofAreas.forEach(area => {
    const inversorId = area.inversorId || `${area.inversor.fabricante}_${area.inversor.modelo}`;
    
    if (!inversoresMap.has(inversorId)) {
      inversoresMap.set(inversorId, {
        fabricante: area.inversor.fabricante,
        modelo: area.inversor.modelo,
        potencia_saida_ca_w: area.inversor.potencia_saida_ca_w,
        tipo_rede: area.inversor.tipo_rede,
        potencia_fv_max_w: area.inversor.potencia_fv_max_w,
        tensao_cc_max_v: area.inversor.tensao_cc_max_v,
        numero_mppt: area.inversor.numero_mppt,
        strings_por_mppt: area.inversor.strings_por_mppt,
        eficiencia_max: area.inversor.eficiencia_max,
        efficiency_dc_ac: area.inversor.eficiencia_max / 100
      });
    }
  });

  return Array.from(inversoresMap.values());
}