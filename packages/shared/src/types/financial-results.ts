/**
 * @fileoverview Tipos para resultados financeiros especializados de Grupo A e Grupo B
 * @description Interfaces TypeScript para resultados dos cálculos financeiros com type safety
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-16
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Interfaces para resultados de Grupo B (Residencial/Comercial)
 * - Interfaces para resultados de Grupo A (Média/Alta Tensão)
 * - Type guards para validação de tipos
 * - Union types para polimorfismo
 * - Exemplos de uso e documentação completa
 */

import { CommonTypes } from './common-types';

// =================================================================================
// TIPOS BASE PARA RESULTADOS FINANCEIROS
// =================================================================================

/**
 * Interface para indicadores financeiros padronizados
 * @description Contém todos os indicadores financeiros calculados para análise de viabilidade
 * @usage Compartilhado entre Grupo A e Grupo B para padronização
 * @example
 * ```typescript
 * const financeiro: FinancialIndicators = {
 *   vpl: 25000,
 *   tir: 0.12,
 *   pi: 1.5,
 *   paybackSimples: 8.5,
 *   paybackDescontado: 10.2,
 *   lcoe: 0.45,
 *   roiSimples: 0.50,
 *   economiaTotalNominal: 150000,
 *   economiaTotalValorPresente: 85000
 * };
 * ```
 */
export interface FinancialIndicators {
  /** 
   * Valor Presente Líquido (VPL) em Reais
   * @description Valor presente dos fluxos de caixa futuros menos o investimento inicial
   * @positive VPL > 0 indica projeto viável
   * @negative VPL < 0 indica projeto inviável
   */
  vpl: number;

  /** 
   * Taxa Interna de Retorno (TIR) decimal
   * @description Taxa de desconto que torna VPL = 0
   * @example 0.12 para 12% ao ano
   * @comparison TIR > taxa de desconto = projeto viável
   */
  tir: number;

  /** 
   * Índice de Rentabilidade (Profitability Index)
   * @description Razão entre valor presente dos benefícios e o investimento
   * @formula PI = (VP benefícios) / CAPEX
   * @positive PI > 1 indica projeto viável
   */
  pi: number;

  /** 
   * Payback Simples em anos
   * @description Tempo para recuperar o investimento sem considerar valor no tempo
   * @usage Para análise rápida de retorno
   * @typical 6 a 12 anos para sistemas fotovoltaicos
   */
  paybackSimples: number;

  /** 
   * Payback Descontado em anos
   * @description Tempo para recuperar investimento considerando taxa de desconto
   * @usage Mais preciso que payback simples
   * @typical 8 a 15 anos para sistemas fotovoltaicos
   */
  paybackDescontado: number;

  /** 
   * Levelized Cost of Energy (LCOE) em R$/kWh
   * @description Custo nivelado da energia gerada pelo sistema
   * @usage Para comparar com tarifa de energia
   * @example 0.45 R$/kWh vs tarifa 0.85 R$/kWh = economia
   */
  lcoe: number;

  /** 
   * Return on Investment (ROI) Simples decimal
   * @description Retorno sobre investimento total
   * @formula ROI = (Economia Total - CAPEX) / CAPEX
   * @example 0.50 para 50% de retorno
   */
  roiSimples: number;

  /** 
   * Economia Total Nominal em Reais
   * @description Soma de todas as economias sem desconto no tempo
   * @usage Para demonstrar impacto financeiro total
   */
  economiaTotalNominal: number;

  /** 
   * Economia Total Valor Presente em Reais
   * @description Soma das economias trazidas a valor presente
   * @usage Para análise financeira precisa
   */
  economiaTotalValorPresente: number;
}

/**
 * Interface para somas iniciais do projeto
 * @description Valores iniciais de geração, consumo e investimento
 * @usage Base para todos os cálculos financeiros
 */
export interface InitialSums {
  /** Geração anual estimada em kWh */
  geracaoAnual: string;
  
  /** Consumo anual total em kWh */
  consumoAnual: string;
  
  /** Investimento inicial em Reais (formatado) */
  capex: string;
}

// =================================================================================
// RESULTADOS GRUPO B (RESIDENCIAL/COMERCIAL)
// =================================================================================

/**
 * Interface para resultados de cálculo financeiro do Grupo B
 * @description Contém todos os resultados especializados para consumidores do Grupo B
 * @usage Para clientes residenciais e pequenos comerciais
 * @pattern Estrutura completa com análise de autoconsumo remoto
 */
export interface ResultadosCodigoB {
  /** 
   * Somas iniciais do projeto
   * @description Valores básicos de geração, consumo e investimento
   */
  somasIniciais: InitialSums;

  /** 
   * Comparativo de custos de abatimento
   * @description Análise entre custo Fio B e custo de disponibilidade
   */
  comparativoCustoAbatimento: {
    /** Custo anual com Fio B formatado */
    custoFioB: string;
    
    /** Custo anual de disponibilidade formatado */
    custoDisponibilidade: string;
    
    /** Indica qual custo é maior */
    maiorCusto: string;
  };

  /** 
   * Indicadores financeiros completos
   * @description Todos os indicadores de viabilidade do projeto
   */
  financeiro: FinancialIndicators;

  /** 
   * Consumo detalhado do primeiro ano
   * @description Estrutura completa com geração local e remota
   */
  consumoAno1: {
    /** Geração total do sistema em kWh */
    geracao: number;
    
    /** Consumo local da unidade principal em kWh */
    local: number;
    
    /** Consumo remoto do Grupo B em kWh */
    remotoB: number;
    
    /** Consumo remoto do Grupo A Verde em kWh */
    remotoAVerde: number;
    
    /** Consumo remoto do Grupo A Azul em kWh */
    remotoAAzul: number;
  };

  /** 
   * Tabela resumo anual
   * @description Array com dados anuais do projeto
   */
  tabelaResumoAnual: Array<{
    /** Ano do projeto */
    ano: number;
    
    /** Geração anual em kWh */
    geracaoAnual: number;
    
    /** Consumo local em kWh */
    consumoLocal: number;
    
    /** Economia anual em Reais */
    economiaAnual: number;
    
    /** Economia acumulada em Reais */
    economiaAcumulada: number;
  }>;

  /** 
   * Tabela de fluxo de caixa
   * @description Array com fluxos financeiros anuais
   */
  tabelaFluxoCaixa: Array<{
    /** Ano do projeto */
    ano: number;
    
    /** Fluxo de caixa operacional em Reais */
    fluxoOperacional: number;
    
    /** Fluxo de caixa líquido em Reais */
    fluxoLiquido: number;
    
    /** Fluxo de caixa acumulado em Reais */
    fluxoAcumulado: number;
    
    /** Valor presente do fluxo em Reais */
    valorPresente: number;
  }>;
}

// =================================================================================
// RESULTADOS GRUPO A (MÉDIA/ALTA TENSÃO)
// =================================================================================

/**
 * Interface para somas iniciais do Grupo A
 * @description Valores iniciais com separação ponta/fora-ponta
 */
export interface InitialSumsGrupoA {
  /** Geração anual estimada em kWh */
  geracaoAnual: string;
  
  /** Consumo anual fora de ponta em kWh */
  consumoForaPonta: string;
  
  /** Consumo anual em ponta em kWh */
  consumoPonta: string;
  
  /** Investimento inicial em Reais (formatado) */
  capex: string;
}

/**
 * Interface para consumo detalhado do Grupo A no primeiro ano
 * @description Estrutura com separação por posto tarifário
 */
export interface ConsumoAno1GrupoA {
  /** Geração total do sistema em kWh */
  geracao: number;
  
  /** Consumo local fora de ponta em kWh */
  localForaPonta: number;
  
  /** Consumo local em ponta em kWh */
  localPonta: number;
  
  /** Consumo remoto fora de ponta em kWh */
  remotoForaPonta: number;
  
  /** Consumo remoto em ponta em kWh */
  remotoPonta: number;
}

/**
 * Interface para resultados de cálculo financeiro do Grupo A
 * @description Contém todos os resultados especializados para consumidores do Grupo A
 * @usage Para clientes de média e alta tensão (industrial, comercial grande)
 * @pattern Estrutura completa com análise por posto tarifário e sensibilidade
 */
export interface ResultadosCodigoA {
  /** 
   * Somas iniciais do projeto
   * @description Valores básicos com separação ponta/fora-ponta
   */
  somasIniciais: InitialSumsGrupoA;

  /** 
   * Indicadores financeiros completos
   * @description Todos os indicadores de viabilidade do projeto
   */
  financeiro: FinancialIndicators;

  /** 
   * Consumo detalhado do primeiro ano
   * @description Estrutura completa com separação por posto tarifário
   */
  consumoAno1: ConsumoAno1GrupoA;

  /** 
   * Tabela resumo anual
   * @description Array com dados anuais do projeto
   */
  tabelaResumoAnual: Array<{
    /** Ano do projeto */
    ano: number;
    
    /** Geração anual em kWh */
    geracaoAnual: number;
    
    /** Consumo fora de ponta em kWh */
    consumoForaPonta: number;
    
    /** Consumo em ponta em kWh */
    consumoPonta: number;
    
    /** Economia anual em Reais */
    economiaAnual: number;
    
    /** Economia acumulada em Reais */
    economiaAcumulada: number;
  }>;

  /** 
   * Tabela de fluxo de caixa
   * @description Array com fluxos financeiros anuais
   */
  tabelaFluxoCaixa: Array<{
    /** Ano do projeto */
    ano: number;
    
    /** Fluxo de caixa operacional em Reais */
    fluxoOperacional: number;
    
    /** Fluxo de caixa líquido em Reais */
    fluxoLiquido: number;
    
    /** Fluxo de caixa acumulado em Reais */
    fluxoAcumulado: number;
    
    /** Valor presente do fluxo em Reais */
    valorPresente: number;
  }>;

  /** 
   * Dados de sensibilidade tarifária
   * @description Análise de sensibilidade do VPL a variações tarifárias
   */
  dadosSensibilidade: {
    /** Multiplicadores de tarifa para análise */
    multiplicadoresTarifa: number[];
    
    /** Matriz de VPL para cada multiplicador */
    vplMatrix: number[];
  };
}

// =================================================================================
// TYPE GUARDS E UNION TYPES
// =================================================================================

/**
 * Type guard para validar ResultadosCodigoB
 * @description Verifica se objeto contém estrutura válida de Grupo B
 * @param data Objeto a ser validado
 * @returns true se for ResultadosCodigoB válido
 */
export function isResultadosCodigoB(data: any): data is ResultadosCodigoB {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Verificar campos obrigatórios
  const requiredFields = ['somasIniciais', 'comparativoCustoAbatimento', 'financeiro', 'consumoAno1', 'tabelaResumoAnual', 'tabelaFluxoCaixa'];
  if (!requiredFields.every(field => field in data)) {
    return false;
  }

  // Verificar campos específicos do Grupo B
  const grupoBFields = ['custoFioB', 'custoDisponibilidade', 'maiorCusto'];
  if (!grupoBFields.every(field => field in data.comparativoCustoAbatimento)) {
    return false;
  }

  return true;
}

/**
 * Type guard para validar ResultadosCodigoA
 * @description Verifica se objeto contém estrutura válida de Grupo A
 * @param data Objeto a ser validado
 * @returns true se for ResultadosCodigoA válido
 */
export function isResultadosCodigoA(data: any): data is ResultadosCodigoA {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Verificar campos obrigatórios
  const requiredFields = ['somasIniciais', 'financeiro', 'consumoAno1', 'tabelaResumoAnual', 'tabelaFluxoCaixa', 'dadosSensibilidade'];
  if (!requiredFields.every(field => field in data)) {
    return false;
  }

  // Verificar campos específicos do Grupo A
  const grupoAFields = ['consumoForaPonta', 'consumoPonta'];
  if (!grupoAFields.every(field => field in data.somasIniciais)) {
    return false;
  }

  // Verificar campos de sensibilidade
  const sensibilidadeFields = ['multiplicadoresTarifa', 'vplMatrix'];
  if (!sensibilidadeFields.every(field => field in data.dadosSensibilidade)) {
    return false;
  }

  return true;
}

/**
 * Union type para resultados financeiros de ambos os grupos
 * @description Permite polimorfismo entre Grupo A e Grupo B
 * @usage Para funções que podem retornar qualquer tipo de resultado
 */
export type GrupoFinancialResults = ResultadosCodigoB | ResultadosCodigoA;

/**
 * Type guard para validar qualquer resultado de grupo
 * @description Verifica se objeto é ResultadosCodigoB ou ResultadosCodigoA
 * @param data Objeto a ser validado
 * @returns true se for resultado válido de qualquer grupo
 */
export function isGrupoFinancialResults(data: any): data is GrupoFinancialResults {
  return isResultadosCodigoB(data) || isResultadosCodigoA(data);
}

// =================================================================================
// UTILITÁRIOS E FUNÇÕES AUXILIARES
// =================================================================================

/**
 * Obtém o grupo tarifário a partir do resultado
 * @description Extrai o tipo de grupo (A ou B) do resultado
 * @param resultado Objeto de resultado financeiro
 * @returns 'A' para Grupo A, 'B' para Grupo B
 * @throws Error se resultado não for válido
 */
export function getGrupoTarifario(resultado: GrupoFinancialResults): 'A' | 'B' {
  if (isResultadosCodigoB(resultado)) {
    return 'B';
  } else if (isResultadosCodigoA(resultado)) {
    return 'A';
  } else {
    throw new Error('Resultado financeiro inválido');
  }
}

/**
 * Formata valor monetário em Reais
 * @description Formata número para string monetária brasileira
 * @param valor Valor numérico
 * @returns String formatada em R$
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

/**
 * Formata valor energético em kWh
 * @description Formata número para string com unidade kWh
 * @param valor Valor numérico
 * @param decimais Número de casas decimais (padrão: 0)
 * @returns String formatada com unidade
 */
export function formatarEnergia(valor: number, decimais: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais
  }).format(valor) + ' kWh';
}