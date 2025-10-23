/**
 * Utilitários para cálculos financeiros de Grupo A e Grupo B
 * Funções de conversão e validação para os novos endpoints Python
 */

import { GrupoAConfig, GrupoBConfig, CommonTypes } from '@bess-pro/shared';

/**
 * Converte configuração do frontend para formato GrupoAConfig completo
 */
export function convertToGrupoAInput(
  config: any, 
  calculatedData: { investimentoInicial: number; geracaoMensal: number[]; consumoMensal: number[] }
): GrupoAConfig {
  // Construir dados mensais a partir de arrays
  const meses: CommonTypes.Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Converter arrays para objetos mensais
  const geracaoMensal: CommonTypes.MonthlyData = meses.reduce((obj, mes, index) => {
    obj[mes] = calculatedData.geracaoMensal[index] || 0;
    return obj;
  }, {} as CommonTypes.MonthlyData);
  
  // Dividir consumo proporcionalmente (80% fora ponta, 20% ponta)
  const consumoForaPonta: CommonTypes.MonthlyData = meses.reduce((obj, mes, index) => {
    obj[mes] = (calculatedData.consumoMensal[index] || 0) * 0.8;
    return obj;
  }, {} as CommonTypes.MonthlyData);
  
  const consumoPonta: CommonTypes.MonthlyData = meses.reduce((obj, mes, index) => {
    obj[mes] = (calculatedData.consumoMensal[index] || 0) * 0.2;
    return obj;
  }, {} as CommonTypes.MonthlyData);

  // Valores padrão para campos obrigatórios
  const defaultFinanceiros: CommonTypes.ProjectFinancials = {
    capex: calculatedData.investimentoInicial,
    anos: 25,
    taxaDesconto: 0.12,
    inflacaoEnergia: 0.10,
    degradacao: 0.005,
    salvagePct: 0.10,
    omaFirstPct: 0.015,
    omaInflacao: 0.04
  };

  const defaultFioB: CommonTypes.FioBParams = {
    schedule: {
      2025: 0.45,
      2026: 0.60,
      2027: 0.75,
      2028: 0.90
    },
    baseYear: 2025
  };

  const defaultTarifas = {
    foraPonta: 0.65,
    ponta: 0.95
  };

  const defaultTE = {
    foraPonta: 0.40,
    ponta: 0.60
  };

  const defaultRemotoB: CommonTypes.RemoteConsumptionGrupoB = {
    enabled: false,
    percentage: 0,
    data: { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
    tarifaTotal: 0,
    fioBValue: 0
  };

  const defaultRemotoA: CommonTypes.RemoteConsumptionGrupoA = {
    enabled: false,
    percentage: 0,
    dataOffPeak: { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
    dataPeak: { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
    tarifas: {
      offPeak: 0,
      peak: 0
    },
    tusd: {
      offPeak: 0,
      peak: 0
    },
    te: {
      offPeak: 0,
      peak: 0
    }
  };

  return {
    financeiros: config.financeiros || defaultFinanceiros,
    geracao: geracaoMensal,
    consumoLocal: {
      foraPonta: consumoForaPonta,
      ponta: consumoPonta
    },
    tarifas: config.tarifas || defaultTarifas,
    te: config.te || defaultTE,
    fatorSimultaneidadeLocal: config.fatorSimultaneidadeLocal || 0.85,
    fioB: config.fioB || defaultFioB,
    remotoB: config.remotoB || defaultRemotoB,
    remotoAVerde: config.remotoAVerde || defaultRemotoA,
    remotoAAzul: config.remotoAAzul || defaultRemotoA
  };
}

/**
 * Converte configuração do frontend para formato GrupoBConfig completo
 */
export function convertToGrupoBInput(
  config: any,
  calculatedData: { investimentoInicial: number; geracaoMensal: number[]; consumoMensal: number[] }
): GrupoBConfig {

console.log('Convertendo para GrupoBConfig com dados calculados:', calculatedData);
console.log('Config recebido:', config);

  // Construir dados mensais a partir de arrays
  const meses: CommonTypes.Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Converter arrays para objetos mensais
  const geracaoMensal: CommonTypes.MonthlyData = meses.reduce((obj, mes, index) => {
    obj[mes] = calculatedData.geracaoMensal[index] || 0;
    return obj;
  }, {} as CommonTypes.MonthlyData);
  
  const consumoMensal: CommonTypes.MonthlyData = meses.reduce((obj, mes, index) => {
    obj[mes] = calculatedData.consumoMensal[index] || 0;
    return obj;
  }, {} as CommonTypes.MonthlyData);

  // Validações básicas
  if (!geracaoMensal || Object.keys(geracaoMensal).length === 0) {
    throw new Error('Dados de geração mensal são obrigatórios');
  }
  
  if (!consumoMensal || Object.keys(consumoMensal).length === 0) {
    throw new Error('Dados de consumo mensal são obrigatórios');
  }

  // Valores padrão para campos obrigatórios
  const defaultFinanceiros: CommonTypes.ProjectFinancials = {
    capex: calculatedData.investimentoInicial,
    anos: 25,
    taxaDesconto: 8,
    inflacaoEnergia: 8.5,
    degradacao: 0.5,
    salvagePct: 0.10,
    omaFirstPct: 0.015,
    omaInflacao: 8
  };

  const defaultFioB: CommonTypes.FioBParams = {
    schedule: {
      2025: 0.45,
      2026: 0.60,
      2027: 0.75,
      2028: 0.90
    },
    baseYear: 2025
  };

  // Verificar se há dados remotos B na config
  const hasRemotoB = config.hasRemotoB || false;
  const consumoRemotoB = config.consumoRemotoB || Array(12).fill(0);
  
  const defaultRemotoB: CommonTypes.RemoteConsumptionGrupoB = {
    enabled: hasRemotoB,
    percentage: hasRemotoB ? 0.40 : 0, // 40% dos créditos para remoto B
    data: meses.reduce((obj, mes, index) => {
      obj[mes] = consumoRemotoB[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData),
    tarifaTotal: config.tarifaEnergiaB || 0.90,
    fioBValue: config.custoFioB || 0.30
  };

  console.log('[convertToGrupoBInput] Dados remotos B:', {
    hasRemotoB,
    consumoRemotoB,
    defaultRemotoB
  });

  const defaultRemotoA: CommonTypes.RemoteConsumptionGrupoA = {
    enabled: false,
    percentage: 0,
    dataOffPeak: { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
    dataPeak: { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
    tarifas: {
      offPeak: 0,
      peak: 0
    },
    tusd: {
      offPeak: 0,
      peak: 0
    },
    te: {
      offPeak: 0,
      peak: 0
    }
  };

  console.log('Config final:', {
    financeiros: mergeFinanceiros(config.financeiros, defaultFinanceiros),
    geracao: geracaoMensal,
    consumoLocal: consumoMensal,
    tarifaBase: config.tarifaBase || 0.85,
    fioBBase: config.fioBBase || 0.25,
    tipoConexao: config.tipoConexao || 'Monofasico',
    fatorSimultaneidade: config.fatorSimultaneidade || 0.85,
    fioB: config.fioB || defaultFioB,
    remotoB: config.remotoB || defaultRemotoB,
    remotoAVerde: config.remotoAVerde || defaultRemotoA,
    remotoAAzul: config.remotoAAzul || defaultRemotoA
  });

  return {
    financeiros: mergeFinanceiros(config.financeiros, defaultFinanceiros),
    geracao: geracaoMensal,
    consumoLocal: consumoMensal,
    tarifaBase: config.tarifaBase || 0.85,
    fioBBase: config.fioBBase || 0.25,
    tipoConexao: config.tipoConexao || 'Monofasico',
    fatorSimultaneidade: config.fatorSimultaneidade || 0.85,
    fioB: config.fioB || defaultFioB,
    remotoB: config.remotoB || defaultRemotoB,
    remotoAVerde: config.remotoAVerde || defaultRemotoA,
    remotoAAzul: config.remotoAAzul || defaultRemotoA
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

/**
 * Faz merge dos dados financeiros, usando valores padrão para campos nulos
 */
function mergeFinanceiros(configFinanceiros: any, defaultFinanceiros: CommonTypes.ProjectFinancials): CommonTypes.ProjectFinancials {
  if (!configFinanceiros) {
    return defaultFinanceiros;
  }
  
  const result = { ...defaultFinanceiros };
  
  // Para cada campo em defaultFinanceiros, usa o valor de config se não for nulo/undefined
  (Object.keys(defaultFinanceiros) as Array<keyof CommonTypes.ProjectFinancials>).forEach(key => {
    if (configFinanceiros[key] !== null && configFinanceiros[key] !== undefined) {
      if (key === 'salvagePct' || key === 'omaFirstPct') {
        // Converter porcentagem para decimal se necessário
        result[key] = typeof configFinanceiros[key] === 'number'
          ? configFinanceiros[key] / 100
          : configFinanceiros[key];
      } else {
        result[key] = configFinanceiros[key];
      }
    }
  });

  result['omaInflacao'] = configFinanceiros['omaInflacao'] !== null && configFinanceiros['omaInflacao'] !== undefined
    ? configFinanceiros['omaInflacao']
    : defaultFinanceiros['omaInflacao'];

  return result;
}
