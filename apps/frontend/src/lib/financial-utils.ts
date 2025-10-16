/**
 * Utilitários para cálculos financeiros de Grupo A e Grupo B
 * Funções de conversão e validação para os novos endpoints Python
 */

import { GrupoAConfig, GrupoBConfig, CommonTypes } from '@bess-pro/shared';

/**
 * Converte configuração do frontend para formato esperado pelo endpoint Grupo A
 */
export function convertToGrupoAInput(config: Partial<GrupoAConfig>, investimentoInicial: number) {
  const geracaoArray = config.geracao ? Object.values(config.geracao) : [];
  const consumoForaPontaArray = config.consumoLocal?.foraPonta ? Object.values(config.consumoLocal.foraPonta) : [];
  const consumoPontaArray = config.consumoLocal?.ponta ? Object.values(config.consumoLocal.ponta) : [];
  const consumoArray = consumoForaPontaArray.map((val, idx) => val + (consumoPontaArray[idx] || 0));
  
  return {
    investimento_inicial: investimentoInicial,
    geracao_mensal: geracaoArray,
    consumo_mensal: consumoArray,
    tarifas: {
      energia: config.tarifas?.foraPonta || 0,
      fio_b: config.fioB?.schedule?.[config.fioB?.baseYear || 2025] || 0,
      // Demanda removida - não usar mais no Grupo A
    },
    parametros: {
      vida_util: config.financeiros?.anos || 25,
      taxa_desconto: config.financeiros?.taxaDesconto || 0.12,
      inflacao_energia: config.financeiros?.inflacaoEnergia || 0.10,
      degradacao_modulos: config.financeiros?.degradacao || 0.005,
      custo_om: config.financeiros?.omaFirstPct ? config.financeiros.omaFirstPct * investimentoInicial : 0,
      inflacao_om: config.financeiros?.omaInflacao || 0.10,
      fator_simultaneidade: config.fatorSimultaneidadeLocal || 0.85,
      base_year: config.fioB?.baseYear || 2025,
    },
    creditos_remotos: {
      autoconsumo_remoto_b: config.remotoB?.enabled || false,
      perc_creditos_b: config.remotoB?.percentage || 0,
      autoconsumo_remoto_a_verde: config.remotoAVerde?.enabled || false,
      perc_creditos_a_verde: config.remotoAVerde?.percentage || 0,
      autoconsumo_remoto_a_azul: config.remotoAAzul?.enabled || false,
      perc_creditos_a_azul: config.remotoAAzul?.percentage || 0,
    }
  };
}

/**
 * Converte configuração do frontend para formato esperado pelo endpoint Grupo B
 */
export function convertToGrupoBInput(config: Partial<GrupoBConfig>, investimentoInicial: number) {
  const geracaoArray = config.geracao ? Object.values(config.geracao) : [];
  const consumoArray = config.consumoLocal ? Object.values(config.consumoLocal) : [];
  
  return {
    investimento_inicial: investimentoInicial,
    geracao_mensal: geracaoArray,
    consumo_mensal: consumoArray,
    tarifas: {
      energia: config.tarifaBase || 0,
      fio_b: config.fioB?.schedule?.[config.fioB?.baseYear || 2025] || 0,
      demanda: 0, // Grupo B não tem demanda no novo modelo
    },
    parametros: {
      vida_util: config.financeiros?.anos || 25,
      taxa_desconto: config.financeiros?.taxaDesconto || 0.12,
      inflacao_energia: config.financeiros?.inflacaoEnergia || 0.10,
      degradacao_modulos: config.financeiros?.degradacao || 0.005,
      custo_om: config.financeiros?.omaFirstPct ? config.financeiros.omaFirstPct * investimentoInicial : 0,
      inflacao_om: config.financeiros?.omaInflacao || 0.10,
      fator_simultaneidade: config.fatorSimultaneidade || 0.85,
      base_year: config.fioB?.baseYear || 2025,
    },
    creditos_remotos: {
      autoconsumo_remoto_b: config.remotoB?.enabled || false,
      perc_creditos_b: config.remotoB?.percentage || 0,
      autoconsumo_remoto_a_verde: config.remotoAVerde?.enabled || false,
      perc_creditos_a_verde: config.remotoAVerde?.percentage || 0,
      autoconsumo_remoto_a_azul: config.remotoAAzul?.enabled || false,
      perc_creditos_a_azul: config.remotoAAzul?.percentage || 0,
    }
  };
}

/**
 * Valida dados de entrada para cálculo Grupo A
 */
export function validateGrupoAInput(input: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.investimento_inicial || input.investimento_inicial <= 0) {
    errors.push('Investimento inicial é obrigatório e deve ser maior que zero');
  }

  if (!input.geracao_mensal || !Array.isArray(input.geracao_mensal) || input.geracao_mensal.length !== 12) {
    errors.push('Geração mensal deve ter 12 valores');
  }

  if (!input.consumo_mensal || !Array.isArray(input.consumo_mensal) || input.consumo_mensal.length !== 12) {
    errors.push('Consumo mensal deve ter 12 valores');
  }

  if (!input.tarifas?.energia || input.tarifas.energia <= 0) {
    errors.push('Tarifa de energia é obrigatória e deve ser maior que zero');
  }

  if (!input.parametros?.vida_util || input.parametros.vida_util <= 0) {
    errors.push('Vida útil é obrigatória e deve ser maior que zero');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida dados de entrada para cálculo Grupo B
 */
export function validateGrupoBInput(input: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.investimento_inicial || input.investimento_inicial <= 0) {
    errors.push('Investimento inicial é obrigatório e deve ser maior que zero');
  }

  if (!input.geracao_mensal || !Array.isArray(input.geracao_mensal) || input.geracao_mensal.length !== 12) {
    errors.push('Geração mensal deve ter 12 valores');
  }

  if (!input.consumo_mensal || !Array.isArray(input.consumo_mensal) || input.consumo_mensal.length !== 12) {
    errors.push('Consumo mensal deve ter 12 valores');
  }

  if (!input.tarifas?.energia || input.tarifas.energia <= 0) {
    errors.push('Tarifa de energia é obrigatória e deve ser maior que zero');
  }

  if (!input.tarifas?.demanda || input.tarifas.demanda < 0) {
    errors.push('Tarifa de demanda é obrigatória e não pode ser negativa');
  }

  if (!input.parametros?.vida_util || input.parametros.vida_util <= 0) {
    errors.push('Vida útil é obrigatória e deve ser maior que zero');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Formata valores monetários para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata percentuais para exibição
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata anos com casas decimais
 */
export function formatYears(value: number): string {
  return `${value.toFixed(1)} anos`;
}

/**
 * Determina se um VPL é bom baseado no valor do investimento
 */
export function evaluateVPL(vpl: number, investimento: number): { status: 'excelente' | 'bom' | 'regular' | 'ruim'; message: string } {
  const ratio = vpl / investimento;
  
  if (ratio > 0.5) {
    return { 
      status: 'excelente', 
      message: 'VPL excelente - projeto altamente rentável' 
    };
  } else if (ratio > 0.2) {
    return { 
      status: 'bom', 
      message: 'VPL bom - projeto rentável' 
    };
  } else if (ratio > 0) {
    return { 
      status: 'regular', 
      message: 'VPL positivo - projeto marginalmente rentável' 
    };
  } else {
    return { 
      status: 'ruim', 
      message: 'VPL negativo - projeto inviável financeiramente' 
    };
  }
}

/**
 * Determina se uma TIR é boa
 */
export function evaluateTIR(tir: number): { status: 'excelente' | 'bom' | 'regular' | 'ruim'; message: string } {
  if (tir > 0.15) {
    return { 
      status: 'excelente', 
      message: 'TIR excelente - retorno acima do mercado' 
    };
  } else if (tir > 0.10) {
    return { 
      status: 'bom', 
      message: 'TIR boa - retorno competitivo' 
    };
  } else if (tir > 0.05) {
    return { 
      status: 'regular', 
      message: 'TIR regular - retorno abaixo do mercado' 
    };
  } else {
    return { 
      status: 'ruim', 
      message: 'TIR ruim - retorno muito baixo' 
    };
  }
}