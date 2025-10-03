/**
 * Tipos financeiros para frontend
 * Usando tipos compartilhados do pacote @bess-pro/shared
 * Com funções de conversão para compatibilidade camelCase
 */

import {
  FinancialInput,
  CashFlowDetails,
  FinancialIndicators,
  SensitivityAnalysis,
  ScenarioAnalysis,
  AdvancedFinancialResults,
  FinancialCalculationResponse,
  FINANCIAL_DEFAULTS,
  objectSnakeToCamel,
  objectCamelToSnake
} from '@bess-pro/shared';

// ===== TIPOS COMPATÍVEIS COM FRONTEND (camelCase) =====

/**
 * Input para cálculo financeiro (camelCase para frontend)
 */
export interface FinancialCalculationInput {
  investimentoInicial: number;
  geracaoMensal: number[];
  consumoMensal: number[];
  tarifaEnergia: number;
  custoFioB: number;
  vidaUtil: number;
  taxaDesconto: number;
  inflacaoEnergia: number;
  degradacaoModulos?: number;
  custoOm?: number;
  inflacaoOm?: number;
  fatorSimultaneidade?: number;
  fioBSchedule?: Record<number, number>;
  baseYear?: number;
  autoconsumoRemotoB?: boolean;
  consumoMensalRemotoB?: number[];
  tarifaRemotoB?: number;
  fioBRemotoB?: number;
  percCreditosB?: number;
  autoconsumoRemotoAVerde?: boolean;
  consumoMensalRemotoAVerdeFp?: number[];
  consumoMensalRemotoAVerdeP?: number[];
  tarifaRemotoAVerdeFp?: number;
  tarifaRemotoAVerdeP?: number;
  tusdRemotoAVerdeFp?: number;
  tusdRemotoAVerdeP?: number;
  tePontaAVerde?: number;
  teForaPontaAVerde?: number;
  percCreditosAVerde?: number;
  autoconsumoRemotoAAzul?: boolean;
  consumoMensalRemotoAAzulFp?: number[];
  consumoMensalRemotoAAzulP?: number[];
  tarifaRemotoAAzulFp?: number;
  tarifaRemotoAAzulP?: number;
  tusdRemotoAAzulFp?: number;
  tusdRemotoAAzulP?: number;
  tePontaAAzul?: number;
  teForaPontaAAzul?: number;
  percCreditosAAzul?: number;
  tarifaBranca?: Record<string, number>;
  modalidadeTarifaria?: string;
}

/**
 * Resultado do cálculo financeiro (camelCase para frontend)
 */
export interface FinancialCalculationResult {
  vpl: number;
  tir: number;
  paybackSimples: number;
  paybackDescontado: number;
  economiaTotal25Anos: number;
  economiaAnualMedia: number;
  lucratividadeIndex: number;
  cashFlow: CashFlowDetails[];
  indicadores: FinancialIndicators;
  sensibilidade: SensitivityAnalysis;
  cenarios: ScenarioAnalysis;
  metadata?: {
    calculatedAt: string;
    version: string;
    warnings?: string[];
  };
}

// ===== TIPOS LEGADOS (para compatibilidade) =====

/**
 * @deprecated Usar FinancialCalculationInput
 */
export interface AdvancedFinancialInput extends FinancialCalculationInput {}

/**
 * @deprecated Usar FinancialCalculationResult  
 */
// export interface AdvancedFinancialResults extends FinancialCalculationResult {}

// ===== RESPOSTAS DA API =====

export interface CalculateFinancialsResponse {
  success: boolean;
  data: FinancialCalculationResult;
  message: string;
}

export interface GetFinancialResultsResponse {
  success: boolean;
  data: FinancialCalculationResult;
  message: string;
}

// ===== FUNÇÕES DE CONVERSÃO =====

/**
 * Converte input do frontend (camelCase) para formato da API (snake_case)
 */
export function convertFrontendToApi(input: FinancialCalculationInput): FinancialInput {
  return objectCamelToSnake(input) as FinancialInput;
}

/**
 * Converte resposta da API (snake_case) para formato do frontend (camelCase)
 */
export function convertApiToFrontend(result: AdvancedFinancialResults): FinancialCalculationResult {
  return objectSnakeToCamel(result) as FinancialCalculationResult;
}

/**
 * Converte resposta da API para formato de resposta do frontend
 */
export function convertApiResponseToFrontend(
  response: FinancialCalculationResponse
): CalculateFinancialsResponse | GetFinancialResultsResponse {
  return {
    success: response.success,
    data: response.data ? convertApiToFrontend(response.data) : {} as FinancialCalculationResult,
    message: response.error || response.success ? 'Success' : 'Error'
  };
}

// ===== CONFIGURAÇÕES PADRÃO =====

/**
 * Defaults formatados para frontend (camelCase)
 */
export const FINANCIAL_DEFAULTS_FRONTEND = {
  vidaUtil: FINANCIAL_DEFAULTS.vida_util,
  taxaDesconto: FINANCIAL_DEFAULTS.taxa_desconto,
  inflacaoEnergia: FINANCIAL_DEFAULTS.inflacao_energia,
  degradacaoModulos: FINANCIAL_DEFAULTS.degradacao_modulos,
  custoOm: FINANCIAL_DEFAULTS.custo_om,
  inflacaoOm: FINANCIAL_DEFAULTS.inflacao_om,
  fatorSimultaneidade: FINANCIAL_DEFAULTS.fator_simultaneidade,
  baseYear: FINANCIAL_DEFAULTS.base_year,
  fioBSchedule: FINANCIAL_DEFAULTS.fio_b_schedule,
  percCreditosB: FINANCIAL_DEFAULTS.perc_creditos_b,
  percCreditosAVerde: FINANCIAL_DEFAULTS.perc_creditos_a_verde,
  percCreditosAAzul: FINANCIAL_DEFAULTS.perc_creditos_a_azul,
  tarifaRemotoB: FINANCIAL_DEFAULTS.tarifa_remoto_b,
  fioBRemotoB: FINANCIAL_DEFAULTS.fio_b_remoto_b,
  tarifaRemotoAVerdeFp: FINANCIAL_DEFAULTS.tarifa_remoto_a_verde_fp,
  tarifaRemotoAVerdeP: FINANCIAL_DEFAULTS.tarifa_remoto_a_verde_p,
  tusdRemotoAVerdeFp: FINANCIAL_DEFAULTS.tusd_remoto_a_verde_fp,
  tusdRemotoAVerdeP: FINANCIAL_DEFAULTS.tusd_remoto_a_verde_p,
  tePontaAVerde: FINANCIAL_DEFAULTS.te_ponta_a_verde,
  teForaPontaAVerde: FINANCIAL_DEFAULTS.te_fora_ponta_a_verde,
  tarifaRemotoAAzulFp: FINANCIAL_DEFAULTS.tarifa_remoto_a_azul_fp,
  tarifaRemotoAAzulP: FINANCIAL_DEFAULTS.tarifa_remoto_a_azul_p,
  tusdRemotoAAzulFp: FINANCIAL_DEFAULTS.tusd_remoto_a_azul_fp,
  tusdRemotoAAzulP: FINANCIAL_DEFAULTS.tusd_remoto_a_azul_p,
  tePontaAAzul: FINANCIAL_DEFAULTS.te_ponta_a_azul,
  teForaPontaAAzul: FINANCIAL_DEFAULTS.te_fora_ponta_a_azul,
  modalidadeTarifaria: FINANCIAL_DEFAULTS.modalidade_tarifaria
} as const;

// ===== EXPORTS PARA COMPATIBILIDADE =====

// Re-exportar tipos compartilhados para uso direto se necessário
export type {
  FinancialInput,
  CashFlowDetails,
  FinancialIndicators,
  SensitivityAnalysis,
  ScenarioAnalysis,
  AdvancedFinancialResults,
  FinancialCalculationResponse
};

export {
  FINANCIAL_DEFAULTS,
  objectSnakeToCamel,
  objectCamelToSnake
};