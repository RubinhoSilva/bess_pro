/**
 * Utilitários para cálculos financeiros de Grupo A e Grupo B
 * Funções de conversão e validação para os novos endpoints Python
 */

import { GrupoAConfig, GrupoBConfig, CommonTypes } from '@bess-pro/shared';
import { mapObjectToSnakeCase } from './field-mapper';
import { validateGrupoADataBeforeSend, validateRemoteUnits, validateCreditDistribution } from './financial-validation';

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
  
  // CORREÇÃO: Usar dados de consumo separados por posto se disponíveis
  let consumoForaPonta: CommonTypes.MonthlyData;
  let consumoPonta: CommonTypes.MonthlyData;
  
  if (config.consumoForaPontaMensal && config.consumoPontaMensal) {
    // Usar dados reais separados por posto
    consumoForaPonta = meses.reduce((obj, mes, index) => {
      obj[mes] = config.consumoForaPontaMensal[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData);
    
    consumoPonta = meses.reduce((obj, mes, index) => {
      obj[mes] = config.consumoPontaMensal[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData);
  } else {
    // Usar divisão padrão (80% fora ponta, 20% ponta)
    consumoForaPonta = meses.reduce((obj, mes, index) => {
      obj[mes] = (calculatedData.consumoMensal[index] || 0) * 0.8;
      return obj;
    }, {} as CommonTypes.MonthlyData);
    
    consumoPonta = meses.reduce((obj, mes, index) => {
      obj[mes] = (calculatedData.consumoMensal[index] || 0) * 0.2;
      return obj;
    }, {} as CommonTypes.MonthlyData);
  }

  // Valores padrão para campos obrigatórios
  const defaultFinanceiros: CommonTypes.ProjectFinancials = {
    capex: calculatedData.investimentoInicial,
    anos: 25,
    taxaDesconto: 8.0,         // CORREÇÃO: 8% como percentual (não decimal)
    inflacaoEnergia: 4.5,      // CORREÇÃO: 4.5% como percentual (não decimal)
    degradacao: 0.5,           // CORREÇÃO: 0.5% como percentual (não decimal)
    salvagePct: 0.10,          // CORRETO: já é decimal (10% = 0.1)
    omaFirstPct: 0.015,        // CORRETO: já é decimal (1.5% = 0.015)
    omaInflacao: 4.0           // CORREÇÃO: 4% como percentual (não decimal)
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

  // CORREÇÃO: Estrutura de tarifas com TE e TUSD separados
  const defaultTarifas = {
    fora_ponta: {
      te: config.teForaPontaA || 0.40,      // TE fora ponta
      tusd: config.tusdForaPontaA || 0.25   // TUSD fora ponta
    },
    ponta: {
      te: config.tePontaA || 0.60,           // TE ponta
      tusd: config.tusdPontaA || 0.35        // TUSD ponta
    }
  };

  // CORREÇÃO: Estrutura TE com snake_case
  const defaultTE = {
    fora_ponta: config.teForaPontaA || 0.40,
    ponta: config.tePontaA || 0.60
  };

  // CORREÇÃO: Estrutura completa de unidades remotas
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

  // CORREÇÃO: Fator de simultaneidade como decimal
  const fatorSimultaneidadeDecimal = (config.fatorSimultaneidadeLocal || 85) / 100;

  const resultado = {
    financeiros: mergeFinanceiros(config.financeiros, defaultFinanceiros),
    geracao: geracaoMensal,
    consumoLocal: {                    // CORREÇÃO: camelCase (frontend)
      foraPonta: consumoForaPonta,
      ponta: consumoPonta
    },
    tarifas: config.tarifas || defaultTarifas,
    te: config.te || defaultTE,
    fatorSimultaneidadeLocal: fatorSimultaneidadeDecimal,  // CORREÇÃO: camelCase (frontend)
    fioB: config.fioB || defaultFioB,
    remotoB: config.remotoB || defaultRemotoB,
    remotoAVerde: config.remotoAVerde || defaultRemotoA,
    remotoAAzul: config.remotoAAzul || defaultRemotoA
  };

  // DEBUG: Log para identificar dados antes da validação
  console.log('=== DEBUG GRUPO A INPUT ===');
  console.log('Resultado completo:', resultado);
  console.log('Tarifas fora ponta:', resultado.tarifas?.foraPonta);
  console.log('Tarifas ponta:', resultado.tarifas?.ponta);
  console.log('Consumo local:', resultado.consumoLocal);
  console.log('TE:', resultado.te);
  console.log('Geração mensal:', resultado.geracao);
  console.log('===========================');

  // CORREÇÃO: Validar dados antes de retornar
  const validacao = validateGrupoADataBeforeSend(resultado);
  if (!validacao.isValid) {
    console.error('Erros de validação nos dados do Grupo A:', validacao.errors);
    throw new Error(`Dados inválidos para cálculo Grupo A: ${validacao.errors.join(', ')}`);
  }

  return resultado;
}

/**
 * Converte configuração do frontend para formato GrupoBConfig completo
 */
export function convertToGrupoBInput(
  config: any,
  calculatedData: { investimentoInicial: number; geracaoMensal: number[]; consumoMensal: number[] }
): GrupoBConfig {


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
  
  // Verificar se há dados remotos A Verde na config
  const hasRemotoAVerde = config.hasRemotoAVerde || false;
  const consumoRemotoAVerdePonta = config.consumoRemotoAVerdePonta || Array(12).fill(0);
  const consumoRemotoAVerdeForaPonta = config.consumoRemotoAVerdeForaPonta || Array(12).fill(0);
  
  // Verificar se há dados remotos A Azul na config
  const hasRemotoAAzul = config.hasRemotoAAzul || false;
  const consumoRemotoAAzulPonta = config.consumoRemotoAAzulPonta || Array(12).fill(0);
  const consumoRemotoAAzulForaPonta = config.consumoRemotoAAzulForaPonta || Array(12).fill(0);
  
  // Usar o percentual configurado pelo usuário ou o padrão de 40%
  const percCreditosRemotoB = config.percCreditosRemotoB !== undefined ? config.percCreditosRemotoB : 0.40;
  
  const defaultRemotoB: CommonTypes.RemoteConsumptionGrupoB = {
    enabled: hasRemotoB,
    percentage: hasRemotoB ? percCreditosRemotoB : 0, // Usar percentual configurado
    data: meses.reduce((obj, mes, index) => {
      obj[mes] = consumoRemotoB[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData),
    tarifaTotal: config.tarifaEnergiaB || 0.90,
    fioBValue: config.custoFioB || 0.30
  };

  // Usar os percentuais configurados pelo usuário ou os padrões de 50%
  const percCreditosRemotoAVerde = config.percCreditosRemotoAVerde !== undefined ? config.percCreditosRemotoAVerde : 0.50;
  const percCreditosRemotoAAzul = config.percCreditosRemotoAAzul !== undefined ? config.percCreditosRemotoAAzul : 0.50;
  
  const defaultRemotoAVerde: CommonTypes.RemoteConsumptionGrupoA = {
    enabled: hasRemotoAVerde,
    percentage: hasRemotoAVerde ? percCreditosRemotoAVerde : 0, // Usar percentual configurado
    dataOffPeak: meses.reduce((obj, mes, index) => {
      obj[mes] = consumoRemotoAVerdeForaPonta[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData),
    dataPeak: meses.reduce((obj, mes, index) => {
      obj[mes] = consumoRemotoAVerdePonta[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData),
    tarifas: {
      offPeak: config.tarifaEnergiaForaPontaA || 0.60,
      peak: config.tarifaEnergiaPontaA || 1.20
    },
    tusd: {
      offPeak: config.tusdForaPontaA || config.teForaPontaA || 0.40, // Usa TUSD se existir, senão usa TE
      peak: config.tusdPontaA || config.tePontaA || 0.60  // Usa TUSD se existir, senão usa TE
    },
    te: {
      offPeak: config.teForaPontaA || config.tusdForaPontaA || 0.40, // Usa TE se existir, senão usa TUSD
      peak: config.tePontaA || config.tusdPontaA || 0.60  // Usa TE se existir, senão usa TUSD
    }
  };

  const defaultRemotoAAzul: CommonTypes.RemoteConsumptionGrupoA = {
    enabled: hasRemotoAAzul,
    percentage: hasRemotoAAzul ? percCreditosRemotoAAzul : 0, // Usar percentual configurado
    dataOffPeak: meses.reduce((obj, mes, index) => {
      obj[mes] = consumoRemotoAAzulForaPonta[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData),
    dataPeak: meses.reduce((obj, mes, index) => {
      obj[mes] = consumoRemotoAAzulPonta[index] || 0;
      return obj;
    }, {} as CommonTypes.MonthlyData),
    tarifas: {
      offPeak: config.tarifaEnergiaForaPontaA || 0.50,
      peak: config.tarifaEnergiaPontaA || 1.50
    },
    tusd: {
      offPeak: config.tusdForaPontaA || config.teForaPontaA || 0.30, // Usa TUSD se existir, senão usa TE
      peak: config.tusdPontaA || config.tePontaA || 0.50  // Usa TUSD se existir, senão usa TE
    },
    te: {
      offPeak: config.teForaPontaA || config.tusdForaPontaA || 0.30, // Usa TE se existir, senão usa TUSD
      peak: config.tePontaA || config.tusdPontaA || 0.50  // Usa TE se existir, senão usa TUSD
    }
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


  const resultado = {
    financeiros: mergeFinanceiros(config.financeiros, defaultFinanceiros),
    geracao: geracaoMensal,
    consumoLocal: consumoMensal,
    tarifaBase: config.tarifaBase || 0.85,
    fioBBase: config.fioBBase || 0.25,
    tipoConexao: config.tipoRede || config.tipoConexao || 'monofasico',
    fatorSimultaneidade: (config.fatorSimultaneidade || 100) / 100,
    fioB: config.fioB || defaultFioB,
    remotoB: config.remotoB || defaultRemotoB,
    remotoAVerde: config.remotoAVerde || defaultRemotoAVerde,
    remotoAAzul: config.remotoAAzul || defaultRemotoAAzul
  };

  // Resultado final sem logs

  return resultado;
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
        // Campos que devem ser enviados como decimal (10% = 0.1, 1.5% = 0.015)
        // Se o valor vier como percentual inteiro (ex: 10), dividir por 100
        result[key] = typeof configFinanceiros[key] === 'number' && configFinanceiros[key] >= 1
          ? configFinanceiros[key] / 100
          : configFinanceiros[key];
      } else if (key === 'taxaDesconto' || key === 'inflacaoEnergia' || key === 'degradacao' || key === 'omaInflacao') {
        // Campos que devem ser enviados como percentual (8% = 8.0, 4.5% = 4.5)
        // Se o valor vier como decimal (ex: 0.08), converter para percentual (8.0)
        result[key] = typeof configFinanceiros[key] === 'number' && configFinanceiros[key] < 1
          ? configFinanceiros[key] * 100
          : configFinanceiros[key];
      } else {
        // Outros campos mantêm o valor original
        result[key] = configFinanceiros[key];
      }
    }
  });

  return result;
}
