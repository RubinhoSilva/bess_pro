// Interfaces TypeScript para análise financeira
// Todas as implementações de cálculo foram movidas para a API Python (pvlib-service)

// TIPOS LEGADOS (manter para compatibilidade)
export interface AdvancedFinancialInput {
  investimentoInicial: number;
  geracaoMensal: number[];
  consumoMensal: number[];
  tarifaEnergia: number;
  custoFioB: number;
  vidaUtil: number;
  taxaDesconto: number;
  inflacaoEnergia: number;
  degradacaoModulos?: number;
  custoOM?: number;
  inflacaoOM?: number;
  tarifaBranca?: {
    pontaPonta: number;
    intermediaria: number;
    foraPonta: number;
  };
  modalidadeTarifaria?: 'convencional' | 'branca';
}

// NOVOS TIPOS - API Python v2 (snake_case para compatibilidade com backend)
export interface FinancialCalculationInput {
  // Dados básicos
  investimento_inicial: number;
  geracao_mensal: number[]; // 12 valores (kWh/mês)
  consumo_mensal: number[]; // 12 valores (kWh/mês)
  tarifa_energia: number; // R$/kWh
  custo_fio_b: number; // R$/kWh
  vida_util: number; // anos
  taxa_desconto: number; // % ao ano (ex: 10.5 para 10.5%)
  inflacao_energia: number; // % ao ano

  // Fator de simultaneidade
  fator_simultaneidade: number; // 0-1 (ex: 0.8 para 80%)

  // Autoconsumo remoto - Grupo B (residencial/comercial)
  autoconsumo_remoto_b?: boolean;
  consumo_mensal_remoto_b?: number[]; // 12 valores
  perc_creditos_b?: number; // 0-1

  // Autoconsumo remoto - Grupo A Verde (industrial)
  autoconsumo_remoto_a_verde?: boolean;
  consumo_mensal_remoto_a_verde?: number[]; // 12 valores
  perc_creditos_a_verde?: number; // 0-1

  // Autoconsumo remoto - Grupo A Azul (industrial)
  autoconsumo_remoto_a_azul?: boolean;
  consumo_mensal_remoto_a_azul?: number[]; // 12 valores
  perc_creditos_a_azul?: number; // 0-1

  // Custos operacionais
  custo_om_anual?: number; // R$/ano
  custo_om_percentual?: number; // % do investimento
  custo_seguro_anual?: number; // R$/ano
  custo_reposicao_inversor?: number; // R$ (após 10-12 anos)

  // Degradação
  degradacao_anual?: number; // % ao ano (ex: 0.5)

  // Impostos e incentivos
  aliquota_imposto?: number; // % sobre receita
  incentivo_fiscal?: number; // R$ ou % (redução de impostos)
}

export interface CashFlowDetails {
  ano: number;
  geracaoAnual: number;
  economiaEnergia: number;
  custosOM: number;
  fluxoLiquido: number;
  fluxoAcumulado: number;
  valorPresente: number;
}

export interface AdvancedFinancialResults {
  vpl: number;
  tir: number;
  paybackSimples: number;
  paybackDescontado: number;
  economiaTotal25Anos: number;
  economiaAnualMedia: number;
  lucratividadeIndex: number;
  cashFlow: CashFlowDetails[];
  indicadores: {
    yieldEspecifico: number;
    custoNiveladoEnergia: number;
    eficienciaInvestimento: number;
    retornoSobreInvestimento: number;
  };
  sensibilidade: {
    vplVariacaoTarifa: { tarifa: number; vpl: number }[];
    vplVariacaoInflacao: { inflacao: number; vpl: number }[];
    vplVariacaoDesconto: { desconto: number; vpl: number }[];
  };
}

// NOVOS TIPOS - Resultados da API Python v2
export interface CashFlowYear {
  ano: number;
  geracao_kwh: number;
  economia_bruta: number; // R$
  custos_om: number; // R$
  fluxo_liquido: number; // R$
  fluxo_descontado: number; // R$
  fluxo_acumulado: number; // R$
}

export interface FinancialIndicators {
  vpl: number; // Valor Presente Líquido (R$)
  tir: number; // Taxa Interna de Retorno (%)
  payback_simples: number; // anos
  payback_descontado: number; // anos
  economia_total_25_anos: number; // R$
  economia_anual_media: number; // R$/ano
  lucratividade_index: number; // VPL / Investimento
}

export interface SensitivityAnalysis {
  variacao_tarifa: {
    '+-10%': { vpl: number; tir: number; payback: number };
    '+-20%': { vpl: number; tir: number; payback: number };
  };
  variacao_geracao: {
    '+-10%': { vpl: number; tir: number; payback: number };
    '+-20%': { vpl: number; tir: number; payback: number };
  };
  variacao_investimento: {
    '+-10%': { vpl: number; tir: number; payback: number };
    '+-20%': { vpl: number; tir: number; payback: number };
  };
}

export interface ScenarioAnalysis {
  otimista: FinancialIndicators;
  realista: FinancialIndicators;
  pessimista: FinancialIndicators;
}

export interface FinancialCalculationResult {
  // Indicadores principais
  vpl: number;
  tir: number;
  payback_simples: number;
  payback_descontado: number;
  economia_total_25_anos: number;
  economia_anual_media: number;
  lucratividade_index: number;

  // Fluxo de caixa detalhado
  cash_flow: CashFlowYear[];

  // Indicadores consolidados
  indicadores: FinancialIndicators;

  // Análises avançadas
  sensibilidade: SensitivityAnalysis;
  cenarios: ScenarioAnalysis;

  // Metadados do cálculo
  metadata?: {
    calculatedAt: string;
    version: string;
    warnings?: string[];
  };
}

// Respostas da API
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