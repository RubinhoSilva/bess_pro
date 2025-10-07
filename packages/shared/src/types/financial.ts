/**
 * Tipos compartilhados para cálculos financeiros
 * Baseado nos modelos Python (verdade absoluta)
 * Padrão: snake_case para compatibilidade com Python/Backend
 */

// ===== ENTRADA DE DADOS =====

export interface FinancialInput {
  // Investimento
  investimento_inicial: number; // R$

  // Geração e consumo
  geracao_mensal: number[]; // 12 valores em kWh
  consumo_mensal: number[]; // 12 valores em kWh

  // Tarifas
  tarifa_energia: number; // R$/kWh
  custo_fio_b: number; // R$/kWh

  // Parâmetros temporais
  vida_util: number; // anos (padrão: 25)
  taxa_desconto: number; // % ao ano (padrão: 8.0)
  inflacao_energia: number; // % ao ano (padrão: 4.5)

  // Parâmetros opcionais com defaults
  degradacao_modulos?: number; // % ao ano (padrão: 0.5)
  custo_om?: number; // R$/ano (padrão: 0)
  inflacao_om?: number; // % ao ano (padrão: 4.0)

  // Simultaneidade
  fator_simultaneidade?: number; // 0-1 (padrão: 0.25)

  // Lei 14.300
  fio_b_schedule?: Record<number, number>; // {ano: percentual}
  base_year?: number; // Ano base (padrão: 2025)

  // Autoconsumo remoto Grupo B
  autoconsumo_remoto_b?: boolean;
  consumo_remoto_b_mensal?: number[]; // 12 valores
  tarifa_remoto_b?: number; // R$/kWh
  fio_b_remoto_b?: number; // R$/kWh
  perc_creditos_b?: number; // 0-1 (padrão: 0.40)

  // Autoconsumo remoto Grupo A Verde
  autoconsumo_remoto_a_verde?: boolean;
  consumo_remoto_a_verde_fp_mensal?: number[]; // 12 valores
  consumo_remoto_a_verde_p_mensal?: number[]; // 12 valores
  tarifa_remoto_a_verde_fp?: number; // R$/kWh
  tarifa_remoto_a_verde_p?: number; // R$/kWh
  tusd_remoto_a_verde_fp?: number; // R$/kWh
  tusd_remoto_a_verde_p?: number; // R$/kWh
  te_ponta_a_verde?: number; // R$/kWh
  te_fora_ponta_a_verde?: number; // R$/kWh
  perc_creditos_a_verde?: number; // 0-1 (padrão: 0.30)

  // Autoconsumo remoto Grupo A Azul
  autoconsumo_remoto_a_azul?: boolean;
  consumo_remoto_a_azul_fp_mensal?: number[]; // 12 valores
  consumo_remoto_a_azul_p_mensal?: number[]; // 12 valores
  tarifa_remoto_a_azul_fp?: number; // R$/kWh
  tarifa_remoto_a_azul_p?: number; // R$/kWh
  tusd_remoto_a_azul_fp?: number; // R$/kWh
  tusd_remoto_a_azul_p?: number; // R$/kWh
  te_ponta_a_azul?: number; // R$/kWh
  te_fora_ponta_a_azul?: number; // R$/kWh
  perc_creditos_a_azul?: number; // 0-1 (padrão: 0.30)

  // Tarifa branca (opcional)
  tarifa_branca?: Record<string, number>;
  modalidade_tarifaria?: string; // 'convencional' | 'branca'
}

// ===== FLUXO DE CAIXA =====

export interface CashFlowDetails {
  ano: number;
  geracao_anual: number; // kWh
  economia_energia: number; // R$
  custos_om: number; // R$
  fluxo_liquido: number; // R$
  fluxo_acumulado: number; // R$
  valor_presente: number; // R$
}

// ===== INDICADORES =====

export interface FinancialIndicators {
  yield_especifico: number; // kWh/kW/R$1000
  custo_nivelado_energia: number; // R$/kWh (LCOE)
  eficiencia_investimento: number; // %
  retorno_sobre_investimento: number; // %
}

// ===== ANÁLISE DE SENSIBILIDADE =====

export interface SensitivityPoint {
  parametro: number;
  vpl: number; // R$
}

export interface SensitivityAnalysis {
  vpl_variacao_tarifa: SensitivityPoint[];
  vpl_variacao_inflacao: SensitivityPoint[];
  vpl_variacao_desconto: SensitivityPoint[];
}

// ===== ANÁLISE DE CENÁRIOS =====

export interface ScenarioIndicators {
  vpl: number; // R$
  tir: number; // %
  payback: number; // anos
}

export interface ScenarioAnalysis {
  base: ScenarioIndicators;
  otimista: ScenarioIndicators;
  conservador: ScenarioIndicators;
  pessimista: ScenarioIndicators;
}

// ===== RESULTADO COMPLETO =====

export interface AdvancedFinancialResults {
  // Investimento
  investimento_inicial: number; // R$

  // Indicadores principais
  vpl: number; // Valor Presente Líquido (R$)
  tir: number; // Taxa Interna de Retorno (%)
  payback_simples: number; // anos
  payback_descontado: number; // anos

  // Métricas de economia
  economia_total_25_anos: number; // R$
  economia_anual_media: number; // R$
  lucratividade_index: number; // VPL / Investimento

  // Fluxo de caixa detalhado
  cash_flow: CashFlowDetails[];

  // Indicadores de performance
  indicadores: FinancialIndicators;

  // Análises complementares
  sensibilidade: SensitivityAnalysis;
  cenarios: ScenarioAnalysis;
}

// ===== CONFIGURAÇÕES PADRÃO =====

export const FINANCIAL_DEFAULTS = {
  vida_util: 25,
  taxa_desconto: 8.0,
  inflacao_energia: 4.5,
  degradacao_modulos: 0.5,
  custo_om: 0,
  inflacao_om: 4.0,
  fator_simultaneidade: 0.25,
  base_year: 2025,
  fio_b_schedule: {
    2025: 0.45,
    2026: 0.60,
    2027: 0.75,
    2028: 0.90
  },
  perc_creditos_b: 0.40,
  perc_creditos_a_verde: 0.30,
  perc_creditos_a_azul: 0.30,
  tarifa_remoto_b: 0.84,
  fio_b_remoto_b: 0.25,
  tarifa_remoto_a_verde_fp: 0.48,
  tarifa_remoto_a_verde_p: 2.20,
  tusd_remoto_a_verde_fp: 0.16121,
  tusd_remoto_a_verde_p: 1.6208,
  te_ponta_a_verde: 0.55158,
  te_fora_ponta_a_verde: 0.34334,
  tarifa_remoto_a_azul_fp: 0.48,
  tarifa_remoto_a_azul_p: 2.20,
  tusd_remoto_a_azul_fp: 0.16121,
  tusd_remoto_a_azul_p: 1.6208,
  te_ponta_a_azul: 0.55158,
  te_fora_ponta_a_azul: 0.34334,
  modalidade_tarifaria: 'convencional'
} as const;

// ===== VALIDAÇÕES =====

export interface FinancialValidationRule {
  field: keyof FinancialInput;
  required: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message: string;
}

export const FINANCIAL_VALIDATION_RULES: FinancialValidationRule[] = [
  {
    field: 'investimento_inicial',
    required: true,
    min: 0,
    message: 'Investimento inicial deve ser maior que zero'
  },
  {
    field: 'geracao_mensal',
    required: true,
    minLength: 12,
    maxLength: 12,
    message: 'Geração mensal deve ter exatamente 12 valores'
  },
  {
    field: 'consumo_mensal',
    required: true,
    minLength: 12,
    maxLength: 12,
    message: 'Consumo mensal deve ter exatamente 12 valores'
  },
  {
    field: 'tarifa_energia',
    required: true,
    min: 0,
    message: 'Tarifa de energia deve ser positiva'
  },
  {
    field: 'custo_fio_b',
    required: true,
    min: 0,
    message: 'Custo do fio B deve ser positivo'
  },
  {
    field: 'vida_util',
    required: true,
    min: 1,
    max: 50,
    message: 'Vida útil deve estar entre 1 e 50 anos'
  },
  {
    field: 'taxa_desconto',
    required: true,
    min: 0,
    max: 100,
    message: 'Taxa de desconto deve estar entre 0 e 100%'
  },
  {
    field: 'inflacao_energia',
    required: true,
    min: -50,
    max: 50,
    message: 'Inflação de energia deve estar entre -50% e 50%'
  },
  {
    field: 'fator_simultaneidade',
    required: false,
    min: 0,
    max: 1,
    message: 'Fator de simultaneidade deve estar entre 0 e 1'
  }
];

// ===== UTILITÁRIOS =====

export interface FinancialCalculationMetadata {
  calculatedAt: string;
  version: string;
  inputHash?: string;
  processingTimeMs?: number;
  warnings?: string[];
}

export interface FinancialCalculationResponse {
  success: boolean;
  data?: AdvancedFinancialResults;
  error?: string;
  metadata?: FinancialCalculationMetadata;
}

// ===== FUNÇÕES DE CONVERSÃO =====

/**
 * Converte camelCase para snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converte snake_case para camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converte objeto de camelCase para snake_case
 */
export function objectCamelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => objectCamelToSnake(item));
  }

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = objectCamelToSnake(obj[key]);
    }
  }
  return result;
}

/**
 * Converte objeto de snake_case para camelCase
 */
export function objectSnakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => objectSnakeToCamel(item));
  }

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = objectSnakeToCamel(obj[key]);
    }
  }
  return result;
}