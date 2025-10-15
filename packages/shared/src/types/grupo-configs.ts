/**
 * @fileoverview Configurações específicas para grupos tarifários A e B
 * @description Interfaces completas para configuração de sistemas fotovoltaicos
 *              segundo o grupo tarifário da unidade geradora
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-15
 * 
 * ESTE ARQUIVO CONTÉM:
 * - GrupoBConfig: Configuração completa para unidade geradora Grupo B
 * - GrupoAConfig: Configuração completa para unidade geradora Grupo A (Verde)
 * - Type guards para identificação de configurações
 * - Utilitários para validação e manipulação
 */

import { CommonTypes } from './common-types';

/**
 * Configuração completa para cenário com unidade geradora do Grupo B
 * @description Estrutura completa para dimensionamento de sistema fotovoltaico
 *              com unidade geradora classificada no Grupo B (baixa tensão)
 * @usage Para clientes residenciais, pequenos comerciais e similares
 * @pattern Builder Pattern - construção progressiva da configuração
 * @example
 * ```typescript
 * const configB: GrupoBConfig = {
 *   financeiros: {
 *     capex: 50000,
 *     anos: 25,
 *     taxaDesconto: 0.08,
 *     inflacaoEnergia: 0.045,
 *     degradacao: 0.005,
 *     salvagePct: 0.10,
 *     omaFirstPct: 0.015,
 *     omaInflacao: 0.04
 *   },
 *   geracao: { Jan: 450, Fev: 480, ..., Dez: 400 },
 *   consumoLocal: { Jan: 350, Fev: 370, ..., Dez: 320 },
 *   tarifaBase: 0.85,
 *   tipoConexao: 'Trifasico',
 *   fatorSimultaneidade: 0.8,
 *   fioB: { schedule: { 2025: 0.45, 2026: 0.60 }, baseYear: 2025 },
 *   remotoB: { enabled: true, percentage: 0.40, data: {...}, tarifaTotal: 0.90, fioBValue: 0.30 },
 *   remotoAVerde: { enabled: false, percentage: 0, ... },
 *   remotoAAzul: { enabled: false, percentage: 0, ... }
 * };
 * ```
 */
export interface GrupoBConfig {
  // =================================================================================
  // PARÂMETROS GERAIS
  // =================================================================================

  /** 
   * Parâmetros financeiros do projeto
   * @description Todos os dados financeiros necessários para análise de viabilidade
   * @see CommonTypes.ProjectFinancials para detalhes dos campos
   * @usage Base para todos os cálculos financeiros (VPL, TIR, payback)
   */
  financeiros: CommonTypes.ProjectFinancials;

  // =================================================================================
  // DADOS DA UNIDADE GERADORA LOCAL (GRUPO B)
  // =================================================================================

  /** 
   * Geração mensal do sistema fotovoltaico em kWh
   * @description Produção de energia estimada mês a mês
   * @source Simulação PVGIS, dados históricos ou medição
   * @pattern Variação sazonal típica: maior no verão, menor no inverno
   * @example Janeiro: 450kWh, Julho: 540kWh (hemisfério sul)
   */
  geracao: CommonTypes.MonthlyData;

  /** 
   * Consumo mensal da unidade geradora em kWh
   * @description Perfil de consumo do local onde o sistema será instalado
   * @source Histórico de contas de energia do cliente
   * @usage Para cálculo de autoconsumo e excedentes
   * @pattern Geralmente menor que a geração para sistemas compensatórios
   */
  consumoLocal: CommonTypes.MonthlyData;

  /** 
   * Tarifa de energia da unidade geradora (R$/kWh)
   * @description Tarifa completa praticada pela concessionária local
   * @include TE + TUSD + impostos + encargos
   * @source Conta de energia mais recente
   * @example 0.85 para R$ 0,85/kWh (tarifa residencial típica)
   */
  tarifaBase: number;

  /** 
   * Tipo de conexão elétrica da unidade
   * @description Define a padrão de conexão e demanda mínima
   * @options 'Monofasico' | 'Bifasico' | 'Trifasico'
   * @usage Para dimensionamento de proteção e adequação à rede
   * @pattern Residencial: Monofásico/Bifásico, Comercial: Trifásico
   */
  tipoConexao: 'Monofasico' | 'Bifasico' | 'Trifasico';

  /** 
   * Percentual da geração usada instantaneamente
   * @description Fração da energia gerada consumida no momento da geração
   * @range 0 a 1 (0% a 100%)
   * @example 0.8 para 80% de autoconsumo instantâneo
   * @usage Para cálculo de economia por autoconsumo direto
   * @pattern Valores típicos: 0.3-0.9 dependendo do perfil
   */
  fatorSimultaneidade: number;

  // =================================================================================
  // PARÂMETROS DO FIO B
  // =================================================================================

  /** 
   * Parâmetros do cronograma do Fio B
   * @description Configuração de implementação gradual do custo de disponibilidade
   * @see Lei 14.300/2022 - Marco Legal da Geração Distribuída
   * @usage Para cálculo de economia líquida em autoconsumo
   * @pattern Implementação gradual: 45% → 60% → 75% → 90%
   */
  fioB: CommonTypes.FioBParams;

  // =================================================================================
  // CONFIGURAÇÕES DE AUTOCONSUMO REMOTO
  // =================================================================================

  /** 
   * Configuração de unidade remota do Grupo B
   * @description Unidade consumidora remota classificada no Grupo B
   * @usage Para clientes residenciais ou pequenos comerciais remotos
   * @pattern Geralmente parentes ou filiais do mesmo titular
   * @see CommonTypes.RemoteConsumptionGrupoB para detalhes
   */
  remotoB: CommonTypes.RemoteConsumptionGrupoB;

  /** 
   * Configuração de unidade remota do Grupo A Verde
   * @description Unidade consumidora remota em modo Verde (compensação)
   * @usage Para clientes de média/alta tensão com compensação de energia
   * @pattern Créditos gerados compensam consumo futuro
   * @see CommonTypes.RemoteConsumptionGrupoA para detalhes
   */
  remotoAVerde: CommonTypes.RemoteConsumptionGrupoA;

  /** 
   * Configuração de unidade remota do Grupo A Azul
   * @description Unidade consumidora remota em modo Azul (desconto)
   * @usage Para clientes de média/alta tensão com desconto na fatura
   * @pattern Desconto imediato na conta de energia
   * @see CommonTypes.RemoteConsumptionGrupoA para detalhes
   */
  remotoAAzul: CommonTypes.RemoteConsumptionGrupoA;
}

/**
 * Configuração completa para cenário com unidade geradora do Grupo A (Verde)
 * @description Estrutura completa para dimensionamento de sistema fotovoltaico
 *              com unidade geradora classificada no Grupo A (média/alta tensão)
 * @usage Para clientes comerciais, industriais e similares de maior porte
 * @pattern Strategy Pattern - diferenciação por posto tarifário
 * @example
 * ```typescript
 * const configA: GrupoAConfig = {
 *   financeiros: { ... },
 *   geracao: { Jan: 5000, Fev: 5200, ..., Dez: 4800 },
 *   consumoLocal: {
 *     foraPonta: { Jan: 3000, Fev: 3100, ..., Dez: 2900 },
 *     ponta: { Jan: 800, Fev: 850, ..., Dez: 750 }
 *   },
 *   tarifas: { foraPonta: 0.65, ponta: 0.95, demanda: 45.00 },
 *   te: { foraPonta: 0.40, ponta: 0.60 },
 *   fatorSimultaneidadeLocal: 0.85,
 *   fioB: { schedule: { 2025: 0.45, 2026: 0.60 }, baseYear: 2025 },
 *   remotoB: { enabled: true, percentage: 0.40, ... },
 *   remotoAVerde: { enabled: false, percentage: 0, ... },
 *   remotoAAzul: { enabled: false, percentage: 0, ... }
 * };
 * ```
 */
export interface GrupoAConfig {
  // =================================================================================
  // PARÂMETROS GERAIS
  // =================================================================================

  /** 
   * Parâmetros financeiros do projeto
   * @description Mesma estrutura do Grupo B, mas com valores tipicamente maiores
   * @see CommonTypes.ProjectFinancials para detalhes dos campos
   * @usage Base para todos os cálculos financeiros
   * @pattern CAPEX geralmente maior devido ao porte do sistema
   */
  financeiros: CommonTypes.ProjectFinancials;

  // =================================================================================
  // DADOS DA UNIDADE GERADORA LOCAL (GRUPO A VERDE)
  // =================================================================================

  /** 
   * Geração mensal do sistema fotovoltaico em kWh
   * @description Produção de energia estimada mês a mês
   * @source Simulação PVGIS com dados de alta precisão
   * @pattern Valores tipicamente maiores que Grupo B
   * @example Janeiro: 5000kWh, Julho: 6000kWh (sistema comercial)
   */
  geracao: CommonTypes.MonthlyData;

  /** 
   * Consumo mensal da unidade geradora separado por posto
   * @description Consumo dividido entre fora de ponta e ponta
   * @structure Objeto aninhado com dois MonthlyData
   * @source Histórico detalhado de contas de energia
   * @pattern Fora de ponta: maior volume, Ponta: menor volume mas tarifa maior
   */
  consumoLocal: {
    /** 
     * Consumo mensal fora de ponta em kWh
     * @description Consumo no período normal de tarifação
     * @usage Horários comerciais, noturnos e fins de semana
     * @pattern Geralmente 70-90% do consumo total
     */
    foraPonta: CommonTypes.MonthlyData;

    /** 
     * Consumo mensal em ponta em kWh
     * @description Consumo no período de ponta (3 horas diárias)
     * @usage Horários de maior demanda do sistema
     * @pattern Geralmente 10-30% do consumo total
     */
    ponta: CommonTypes.MonthlyData;
  };

  /** 
   * Tarifas totais (TE + TUSD) por posto tarifário
   * @description Estrutura tarifária completa da concessionária
   * @include Todos os componentes tarifários e encargos
   * @source Contrato com concessionária ou fatura recente
   * @pattern Ponta sempre mais cara que fora de ponta
   */
  tarifas: {
    /** 
     * Tarifa fora de ponta em R$/kWh
     * @description Tarifa aplicada no período normal
     * @example 0.65 para R$ 0,65/kWh (comercial típico)
     */
    foraPonta: number;

    /** 
     * Tarifa em ponta em R$/kWh
     * @description Tarifa aplicada no período de pico
     * @example 0.95 para R$ 0,95/kWh (comercial típico)
     */
    ponta: number;

    /** 
     * Custo da demanda contratada em R$/kW
     * @description Custo fixo pela potência contratada
     * @usage Aplicado mesmo que não consuma a demanda total
     * @example 45.00 para R$ 45,00/kW (demanda comercial)
     */
    demanda: number;
  };

  /** 
   * Componente TE (Tarifa de Energia) por posto
   * @description Parcela da tarifa que é compensada em autoconsumo
   * @usage Para cálculo do fator de equivalência e economia
   * @pattern Valores menores que as tarifas totais
   */
  te: {
    /** TE fora de ponta em R$/kWh */
    foraPonta: number;
    /** TE em ponta em R$/kWh */
    ponta: number;
  };

  /** 
   * Percentual da geração usada instantaneamente
   * @description Fração da energia gerada consumida no momento
   * @range 0 a 1 (0% a 100%)
   * @example 0.85 para 85% de autoconsumo instantâneo
   * @usage Para cálculo de economia por autoconsumo direto
   * @pattern Geralmente maior que Grupo B devido ao perfil de consumo
   */
  fatorSimultaneidadeLocal: number;

  // =================================================================================
  // PARÂMETROS DO FIO B (PARA AS UNIDADES REMOTAS)
  // =================================================================================

  /** 
   * Parâmetros do cronograma do Fio B
   * @description Mesma configuração do Grupo B
   * @usage Para cálculo de economia nas unidades remotas
   * @see Lei 14.300/2022
   */
  fioB: CommonTypes.FioBParams;

  // =================================================================================
  // CONFIGURAÇÕES DE AUTOCONSUMO REMOTO
  // =================================================================================

  /** 
   * Configuração de unidade remota do Grupo B
   * @description Unidade consumidora remota classificada no Grupo B
   * @usage Para residências ou pequenos comércios remotos
   * @pattern Geralmente menor consumo que unidade principal
   */
  remotoB: CommonTypes.RemoteConsumptionGrupoB;

  /** 
   * Configuração de unidade remota do Grupo A Verde
   * @description Unidade consumidora remota em modo Verde
   * @usage Para filiais ou unidades comerciais remotas
   * @pattern Compensação de energia entre unidades
   */
  remotoAVerde: CommonTypes.RemoteConsumptionGrupoA;

  /** 
   * Configuração de unidade remota do Grupo A Azul
   * @description Unidade consumidora remota em modo Azul
   * @usage Para unidades industriais ou comerciais remotas
   * @pattern Desconto imediato na fatura
   */
  remotoAAzul: CommonTypes.RemoteConsumptionGrupoA;
}

// =================================================================================
// TIPO UNIÃO E TYPE GUARDS
// =================================================================================

/**
 * Tipo união para configurações de qualquer grupo tarifário
 * @description Permite trabalhar com ambos os tipos de configuração
 * @usage Em funções que aceitam qualquer configuração de grupo
 * @pattern Polimorfismo - tratamento unificado de diferentes grupos
 * @example
 * ```typescript
 * function processarConfig(config: GrupoConfig) {
 *   if (isGrupoBConfig(config)) {
 *     // Lógica específica Grupo B
 *   } else {
 *     // Lógica específica Grupo A
 *   }
 * }
 * ```
 */
export type GrupoConfig = GrupoBConfig | GrupoAConfig;

/**
 * Type guard para verificar se configuração é GrupoBConfig
 * @description Função de tipo para identificar configurações do Grupo B
 * @param config Configuração a ser verificada
 * @returns true se for GrupoBConfig, false caso contrário
 * @usage Para tratamento condicional baseado no tipo
 * @pattern Type Guard Pattern - verificação de tipo em runtime
 * @example
 * ```typescript
 * const config: GrupoConfig = getConfig();
 * if (isGrupoBConfig(config)) {
 *   console.log('Tarifa base:', config.tarifaBase);
 * }
 * ```
 */
export function isGrupoBConfig(config: GrupoConfig): config is GrupoBConfig {
  return 'tarifaBase' in config && 'tipoConexao' in config;
}

/**
 * Type guard para verificar se configuração é GrupoAConfig
 * @description Função de tipo para identificar configurações do Grupo A
 * @param config Configuração a ser verificada
 * @returns true se for GrupoAConfig, false caso contrário
 * @usage Para tratamento condicional baseado no tipo
 * @pattern Type Guard Pattern - verificação de tipo em runtime
 * @example
 * ```typescript
 * const config: GrupoConfig = getConfig();
 * if (isGrupoAConfig(config)) {
 *   console.log('Tarifa ponta:', config.tarifas.ponta);
 * }
 * ```
 */
export function isGrupoAConfig(config: GrupoConfig): config is GrupoAConfig {
  return 'consumoLocal' in config && 'foraPonta' in config.consumoLocal;
}

// =================================================================================
// UTILITÁRIOS E FUNÇÕES AUXILIARES
// =================================================================================

/**
 * Obtém o tipo do grupo tarifário a partir da configuração
 * @description Retorna string identificadora do tipo de configuração
 * @param config Configuração a ser analisada
 * @returns 'GrupoB' | 'GrupoA' | 'Desconhecido'
 * @usage Para logging, validação e tratamento genérico
 * @example
 * ```typescript
 * const config: GrupoConfig = getConfig();
 * const tipo = getGrupoTipo(config);
 * console.log(`Configuração do ${tipo}`);
 * ```
 */
export function getGrupoTipo(config: GrupoConfig): 'GrupoB' | 'GrupoA' | 'Desconhecido' {
  if (isGrupoBConfig(config)) return 'GrupoB';
  if (isGrupoAConfig(config)) return 'GrupoA';
  return 'Desconhecido';
}

/**
 * Valida estrutura completa de GrupoBConfig
 * @description Verifica se todos os campos obrigatórios estão presentes e válidos
 * @param config Configuração a ser validada
 * @returns Objeto com resultado da validação e erros encontrados
 * @usage Para validação de entrada de dados
 * @pattern Result Pattern - retorno estruturado de validação
 * @example
 * ```typescript
 * const validacao = validateGrupoBConfig(config);
 * if (validacao.isValid) {
 *   // Configuração válida
 * } else {
 *   console.error('Erros:', validacao.errors);
 * }
 * ```
 */
export function validateGrupoBConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validação de financeiros
  if (!config.financeiros || typeof config.financeiros !== 'object') {
    errors.push('financeiros é obrigatório');
  } else {
    if (typeof config.financeiros.capex !== 'number' || config.financeiros.capex <= 0) {
      errors.push('financeiros.capex deve ser número positivo');
    }
    if (typeof config.financeiros.anos !== 'number' || config.financeiros.anos <= 0) {
      errors.push('financeiros.anos deve ser número positivo');
    }
  }

  // Validação de dados mensais
  if (!CommonTypes.validateMonthlyData(config.geracao)) {
    errors.push('geracao deve conter todos os meses com valores numéricos');
  }
  if (!CommonTypes.validateMonthlyData(config.consumoLocal)) {
    errors.push('consumoLocal deve conter todos os meses com valores numéricos');
  }

  // Validação de campos obrigatórios
  if (typeof config.tarifaBase !== 'number' || config.tarifaBase <= 0) {
    errors.push('tarifaBase deve ser número positivo');
  }
  if (!['Monofasico', 'Bifasico', 'Trifasico'].includes(config.tipoConexao)) {
    errors.push('tipoConexao deve ser Monofasico, Bifasico ou Trifasico');
  }
  if (typeof config.fatorSimultaneidade !== 'number' || 
      config.fatorSimultaneidade < 0 || config.fatorSimultaneidade > 1) {
    errors.push('fatorSimultaneidade deve ser número entre 0 e 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida estrutura completa de GrupoAConfig
 * @description Verifica se todos os campos obrigatórios estão presentes e válidos
 * @param config Configuração a ser validada
 * @returns Objeto com resultado da validação e erros encontrados
 * @usage Para validação de entrada de dados
 * @pattern Result Pattern - retorno estruturado de validação
 */
export function validateGrupoAConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validação de financeiros (mesma do Grupo B)
  if (!config.financeiros || typeof config.financeiros !== 'object') {
    errors.push('financeiros é obrigatório');
  }

  // Validação de dados mensais
  if (!CommonTypes.validateMonthlyData(config.geracao)) {
    errors.push('geracao deve conter todos os meses com valores numéricos');
  }

  // Validação de consumoLocal (específico Grupo A)
  if (!config.consumoLocal || typeof config.consumoLocal !== 'object') {
    errors.push('consumoLocal é obrigatório');
  } else {
    if (!CommonTypes.validateMonthlyData(config.consumoLocal.foraPonta)) {
      errors.push('consumoLocal.foraPonta deve conter todos os meses com valores numéricos');
    }
    if (!CommonTypes.validateMonthlyData(config.consumoLocal.ponta)) {
      errors.push('consumoLocal.ponta deve conter todos os meses com valores numéricos');
    }
  }

  // Validação de tarifas (específico Grupo A)
  if (!config.tarifas || typeof config.tarifas !== 'object') {
    errors.push('tarifas é obrigatório');
  } else {
    if (typeof config.tarifas.foraPonta !== 'number' || config.tarifas.foraPonta <= 0) {
      errors.push('tarifas.foraPonta deve ser número positivo');
    }
    if (typeof config.tarifas.ponta !== 'number' || config.tarifas.ponta <= 0) {
      errors.push('tarifas.ponta deve ser número positivo');
    }
    if (typeof config.tarifas.demanda !== 'number' || config.tarifas.demanda < 0) {
      errors.push('tarifas.demanda deve ser número não negativo');
    }
  }

  // Validação de TE (específico Grupo A)
  if (!config.te || typeof config.te !== 'object') {
    errors.push('te é obrigatório');
  } else {
    if (typeof config.te.foraPonta !== 'number' || config.te.foraPonta <= 0) {
      errors.push('te.foraPonta deve ser número positivo');
    }
    if (typeof config.te.ponta !== 'number' || config.te.ponta <= 0) {
      errors.push('te.ponta deve ser número positivo');
    }
  }

  // Validação de campos obrigatórios
  if (typeof config.fatorSimultaneidadeLocal !== 'number' || 
      config.fatorSimultaneidadeLocal < 0 || config.fatorSimultaneidadeLocal > 1) {
    errors.push('fatorSimultaneidadeLocal deve ser número entre 0 e 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calcula potência instalada a partir da geração mensal
 * @description Estima a potência do sistema com base na geração anual
 * @param geracao Dados mensais de geração em kWh
 * @param irradiacaoMedia Irradiação solar média anual em kWh/m²/dia
 * @param performanceRatio Performance ratio do sistema (default: 0.85)
 * @returns Potência estimada em kWp
 * @usage Para validação e dimensionamento rápido
 * @example
 * ```typescript
 * const geracao = { Jan: 450, Fev: 480, ..., Dez: 400 };
 * const potencia = calcularPotenciaInstalada(geracao, 5.2);
 * // Result: ~12.5 kWp
 * ```
 */
export function calcularPotenciaInstalada(
  geracao: CommonTypes.MonthlyData, 
  irradiacaoMedia: number,
  performanceRatio: number = 0.85
): number {
  const geracaoAnual = CommonTypes.calculateAnnualTotal(geracao);
  const geracaoDiariaMedia = geracaoAnual / 365;
  const potenciaEstimada = geracaoDiariaMedia / (irradiacaoMedia * performanceRatio);
  
  return Math.round(potenciaEstimada * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Calcula área necessária para instalação
 * @description Estima área de telhado necessária para o sistema
 * @param potenciaKwp Potência do sistema em kWp
 * @param potenciaModulo Potência do módulo em Wp (default: 550)
 * @param areaModulo Área do módulo em m² (default: 2.5)
 * @returns Área estimada em m²
 * @usage Para verificação de viabilidade de instalação
 * @example
 * ```typescript
 * const area = calcularAreaNecessaria(12.5);
 * // Result: ~56.8 m²
 * ```
 */
export function calcularAreaNecessaria(
  potenciaKwp: number,
  potenciaModulo: number = 550,
  areaModulo: number = 2.5
): number {
  const numeroModulos = (potenciaKwp * 1000) / potenciaModulo;
  const areaTotal = numeroModulos * areaModulo;
  
  return Math.round(areaTotal * 10) / 10; // Arredondar para 1 casa decimal
}