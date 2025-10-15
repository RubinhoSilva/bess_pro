/**
 * @fileoverview Tipos comuns para configurações de grupos tarifários
 * @description Namespace contendo tipos base utilizados em ambos os cenários (Grupo A e Grupo B)
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-15
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Definições de tipos base reutilizáveis
 * - Interfaces para dados mensais tipados
 * - Estruturas financeiras padronizadas
 * - Configurações de autoconsumo remoto
 * - Utilitários de validação e conversão
 */

export namespace CommonTypes {
  
  /**
   * Define os meses do ano para garantir consistência nos dados mensais
   * @description Tipo union que representa todos os meses do ano em português
   * @usage Usado como chave em objetos MonthlyData para garantir type safety
   * @example
   * ```typescript
   * const mes: CommonTypes.Month = 'Jan';
   * const dados: MonthlyData = { Jan: 100, Fev: 120, ... };
   * ```
   */
  export type Month = 'Jan' | 'Fev' | 'Mar' | 'Abr' | 'Mai' | 'Jun' | 'Jul' | 'Ago' | 'Set' | 'Out' | 'Nov' | 'Dez';

  /**
   * Interface para dados mensais de geração ou consumo (em kWh)
   * @description Objeto tipado que garante a presença de todos os meses do ano
   * @template T - Tipo numérico padrão (number)
   * @usage Base para todos os dados mensais do sistema
   * @example
   * ```typescript
   * const geracao: MonthlyData = {
   *   Jan: 450, Fev: 480, Mar: 520, Abr: 490,
   *   Mai: 510, Jun: 530, Jul: 540, Ago: 520,
   *   Set: 480, Out: 450, Nov: 420, Dez: 400
   * };
   * ```
   */
  export type MonthlyData = {
    [K in Month]: number;
  };

  /**
   * Interface para parâmetros financeiros e de projeto do sistema
   * @description Contém todos os parâmetros financeiros necessários para análise de viabilidade
   * @usage Utilizado em GrupoBConfig e GrupoAConfig para padronizar dados financeiros
   * @example
   * ```typescript
   * const financeiros: ProjectFinancials = {
   *   capex: 50000,
   *   anos: 25,
   *   taxaDesconto: 0.08,
   *   inflacaoEnergia: 0.045,
   *   degradacao: 0.005,
   *   salvagePct: 0.10,
   *   omaFirstPct: 0.015,
   *   omaInflacao: 0.04
   * };
   * ```
   */
  export interface ProjectFinancials {
    /** 
     * Investimento inicial do projeto em Reais (R$)
     * @description Custo total para instalação do sistema fotovoltaico
     * @include equipamentos, mão de obra, projetos, licenças
     */
    capex: number;

    /** 
     * Vida útil do projeto em anos
     * @description Período de análise financeira do projeto
     * @default 25 anos para sistemas fotovoltaicos
     * @range 15 a 30 anos típico
     */
    anos: number;

    /** 
     * Taxa de desconto anual (decimal)
     * @description Taxa mínima de atratividade do investidor
     * @example 0.08 para 8% ao ano
     * @usage Para cálculo de VPL e TIR
     */
    taxaDesconto: number;

    /** 
     * Inflação anual da energia (decimal)
     * @description Reajuste esperado nas tarifas de energia
     * @example 0.045 para 4.5% ao ano
     * @source ANEEL - histórico de reajustes
     */
    inflacaoEnergia: number;

    /** 
     * Degradação anual dos painéis (decimal)
     * @description Perda de eficiência dos módulos solares por ano
     * @example 0.005 para 0.5% ao ano
     * @range 0.3% a 0.8% típico para painéis de qualidade
     */
    degradacao: number;

    /** 
     * Percentual do valor residual ao final da vida útil (decimal)
     * @description Valor estimado dos equipamentos ao final do projeto
     * @example 0.10 para 10% do CAPEX inicial
     * @usage Para cálculo de VPL mais preciso
     */
    salvagePct: number;

    /** 
     * Percentual do CAPEX para O&M no primeiro ano (decimal)
     * @description Custos operacionais e de manutenção
     * @example 0.015 para 1.5% do investimento inicial
     * @include limpeza, manutenção preventiva, seguros
     */
    omaFirstPct: number;

    /** 
     * Inflação anual para os custos O&M (decimal)
     * @description Reajuste esperado nos custos de operação
     * @example 0.04 para 4% ao ano
     * @usage Para projeção de custos O&M futuros
     */
    omaInflacao: number;
  }

  /**
   * Interface para o cronograma do Fio B (Lei 14.300/2022)
   * @description Define a implementação gradual do custo de disponibilidade
   * @usage Para cálculo de economia em sistemas de autoconsumo
   * @see Lei 14.300/2022 - Marco Legal da Geração Distribuída
   * @example
   * ```typescript
   * const fioB: FioBParams = {
   *   schedule: { 2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90, 2029: 0.90 },
   *   baseYear: 2025
   * };
   * ```
   */
  export interface FioBParams {
    /** 
     * Cronograma de implementação do Fio B
     * @description Percentual da tarifa de energia cobrado como Fio B
     * @key {year: number} - Ano de vigência
     * @value {number} - Percentual da tarifa (0 a 1)
     * @example { 2025: 0.45 } significa 45% da tarifa em 2025
     */
    schedule: { [year: number]: number };

    /** 
     * Ano base para o cronograma
     * @description Ano de referência para cálculos proporcionais
     * @example 2025 para cronograma iniciado em 2025
     */
    baseYear: number;
  }

  // =================================================================================
  // TIPOS PARA AUTOCONSUMO REMOTO
  // =================================================================================

  /**
   * Base para consumo remoto, com flag de ativação e percentual de abatimento
   * @description Interface base para todas as configurações de autoconsumo remoto
   * @usage Estendida por RemoteConsumptionGrupoB e RemoteConsumptionGrupoA
   * @pattern Template Method Pattern
   */
  export interface RemoteConsumptionBase {
    /** 
     * Flag que indica se o autoconsumo remoto está ativo
     * @description true = unidade remota configurada e ativa
     * @usage Para habilitar/desabilitar cálculos de créditos
     */
    enabled: boolean;

    /** 
     * Percentual dos créditos direcionados a esta unidade
     * @description Fração dos excedentes de energia creditada para esta unidade
     * @range 0 a 1 (0% a 100%)
     * @example 0.40 para 40% dos créditos
     * @validation soma deve ser ≤ 1 entre todas as unidades remotas
     */
    percentage: number;
  }

  /**
   * Configuração para unidade remota do Grupo B
   * @description Unidade consumidora do Grupo B em regime de autoconsumo remoto
   * @extends RemoteConsumptionBase
   * @usage Para clientes residenciais e pequenos comerciais remotos
   * @example
   * ```typescript
   * const remotoB: RemoteConsumptionGrupoB = {
   *   enabled: true,
   *   percentage: 0.40,
   *   data: { Jan: 200, Fev: 210, ..., Dez: 190 },
   *   tarifaTotal: 0.85,
   *   fioBValue: 0.25
   * };
   * ```
   */
  export interface RemoteConsumptionGrupoB extends RemoteConsumptionBase {
    /** 
     * Consumo mensal da unidade remota em kWh
     * @description Perfil de consumo mensal completo da unidade remota
     * @usage Para cálculo de abatimento e economia
     * @source Histórico de contas de energia
     */
    data: MonthlyData;

    /** 
     * Tarifa total de energia da unidade (R$/kWh)
     * @description Tarifa completa (TE + TUSD) praticada pela concessionária
     * @include impostos e encargos
     * @example 0.85 para R$ 0,85/kWh
     */
    tarifaTotal: number;

    /** 
     * Valor do Fio B aplicável à unidade (R$/kWh)
     * @description Custo de disponibilidade da rede elétrica
     * @usage Para cálculo de economia líquida
     * @depends Ano atual e cronograma FioBParams
     */
    fioBValue: number;
  }

  /**
   * Configuração para unidades remotas do Grupo A (Verde ou Azul)
   * @description Unidade consumidora do Grupo A em regime de autoconsumo remoto
   * @extends RemoteConsumptionBase
   * @usage Para clientes de média e alta tensão remotos
   * @pattern Strategy Pattern - diferencia Verde vs Azul nas tarifas
   * @example
   * ```typescript
   * const remotoA: RemoteConsumptionGrupoA = {
   *   enabled: true,
   *   percentage: 0.30,
   *   dataOffPeak: { Jan: 500, Fev: 520, ..., Dez: 480 },
   *   dataPeak: { Jan: 200, Fev: 210, ..., Dez: 190 },
   *   tarifas: { offPeak: 0.65, peak: 0.95 },
   *   tusd: { offPeak: 0.25, peak: 0.35 },
   *   te: { offPeak: 0.40, peak: 0.60 }
   * };
   * ```
   */
  export interface RemoteConsumptionGrupoA extends RemoteConsumptionBase {
    /** 
     * Consumo mensal fora de ponta em kWh
     * @description Consumo no período normal de tarifação
     * @usage Horários comerciais e noturnos (depende da concessionária)
     * @pattern Maior parte do consumo industrial/comercial
     */
    dataOffPeak: MonthlyData;

    /** 
     * Consumo mensal em ponta em kWh
     * @description Consumo no período de ponta (horário de pico)
     * @usage Geralmente 3 horas diárias definidas pela concessionária
     * @pattern Tarifa mais elevada, consumo menor
     */
    dataPeak: MonthlyData;

    /** 
     * Tarifas totais (TE + TUSD) por posto tarifário
     * @description Tarifas completas praticadas pela concessionária
     * @usage Para cálculo de economia bruta
     * @include todos os componentes tarifários
     */
    tarifas: {
      /** Tarifa fora de ponta em R$/kWh */
      offPeak: number;
      /** Tarifa em ponta em R$/kWh */
      peak: number;
    };

    /** 
     * Componente TUSD (Tarifa de Uso do Sistema de Distribuição)
     * @description Parcela da tarifa referente ao uso da rede
     * @usage Para cálculo de economia líquida (TUSD não é compensada)
     * @pattern Valor menor que tarifa total
     */
    tusd: {
      /** TUSD fora de ponta em R$/kWh */
      offPeak: number;
      /** TUSD em ponta em R$/kWh */
      peak: number;
    };

    /** 
     * Componente TE (Tarifa de Energia)
     * @description Parcela da tarifa referente à energia consumida
     * @usage Para cálculo do fator de equivalência
     * @pattern Valor que é compensado em autoconsumo
     */
    te: {
      /** TE fora de ponta em R$/kWh */
      offPeak: number;
      /** TE em ponta em R$/kWh */
      peak: number;
    };
  }

  // =================================================================================
  // UTILITÁRIOS E FUNÇÕES AUXILIARES
  // =================================================================================

  /**
   * Converte array de 12 números para MonthlyData tipado
   * @description Transforma dados no formato array para objeto tipado
   * @param data Array com 12 valores numéricos (Janeiro a Dezembro)
   * @returns MonthlyData objeto tipado com todos os meses
   * @throws Error se array não tiver exatamente 12 elementos
   * @example
   * ```typescript
   * const array = [100, 120, 130, 140, 150, 160, 170, 160, 150, 140, 130, 120];
   * const monthly = CommonTypes.arrayToMonthlyData(array);
   * // Result: { Jan: 100, Fev: 120, ..., Dez: 120 }
   * ```
   */
  export function arrayToMonthlyData(data: number[]): MonthlyData {
    if (data.length !== 12) {
      throw new Error(`Array deve ter exatamente 12 elementos, recebido: ${data.length}`);
    }

    const months: Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result = {} as MonthlyData;
    
    months.forEach((month, index) => {
      result[month] = data[index] || 0;
    });
    
    return result;
  }

  /**
   * Converte MonthlyData tipado para array de 12 números
   * @description Transforma objeto tipado para formato array
   * @param data Objeto MonthlyData com todos os meses
   * @returns Array com 12 valores numéricos (Janeiro a Dezembro)
   * @throws Error se algum mês estiver faltando ou inválido
   * @example
   * ```typescript
   * const monthly = { Jan: 100, Fev: 120, ..., Dez: 120 };
   * const array = CommonTypes.monthlyDataToArray(monthly);
   * // Result: [100, 120, 130, 140, 150, 160, 170, 160, 150, 140, 130, 120]
   * ```
   */
  export function monthlyDataToArray(data: MonthlyData): number[] {
    const months: Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return months.map(month => {
      const value = data[month];
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Valor inválido para o mês ${month}: ${value}`);
      }
      return value;
    });
  }

  /**
   * Valida se objeto contém estrutura válida de MonthlyData
   * @description Type guard para verificar integridade dos dados mensais
   * @param data Objeto a ser validado
   * @returns true se for MonthlyData válido, false caso contrário
   * @usage Para validação de entrada de dados
   * @example
   * ```typescript
   * const dados = { Jan: 100, Fev: 120, ..., Dez: 110 };
   * if (CommonTypes.validateMonthlyData(dados)) {
   *   // dados é MonthlyData válido
   * }
   * ```
   */
  export function validateMonthlyData(data: any): data is MonthlyData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const months: Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return months.every(month => {
      const value = data[month];
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    });
  }

  /**
   * Calcula total anual a partir de MonthlyData
   * @description Soma todos os valores mensais para obter total anual
   * @param data Objeto MonthlyData com valores mensais
   * @returns Soma anual dos valores
   * @example
   * ```typescript
   * const consumo = { Jan: 100, Fev: 120, ..., Dez: 110 };
   * const anual = CommonTypes.calculateAnnualTotal(consumo);
   * // Result: 1440 (exemplo)
   * ```
   */
  export function calculateAnnualTotal(data: MonthlyData): number {
    const months: Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.reduce((total, month) => total + data[month], 0);
  }

  /**
   * Calcula média mensal a partir de MonthlyData
   * @description Calcula média aritmética dos valores mensais
   * @param data Objeto MonthlyData com valores mensais
   * @returns Média mensal dos valores
   * @example
   * ```typescript
   * const consumo = { Jan: 100, Fev: 120, ..., Dez: 110 };
   * const media = CommonTypes.calculateMonthlyAverage(consumo);
   * // Result: 120 (exemplo)
   * ```
   */
  export function calculateMonthlyAverage(data: MonthlyData): number {
    return calculateAnnualTotal(data) / 12;
  }

  /**
   * Encontra mês com maior consumo/geração
   * @description Identifica o mês de pico no perfil mensal
   * @param data Objeto MonthlyData com valores mensais
   * @returns Array com [mês, valor] do mês de pico
   * @example
   * ```typescript
   * const geracao = { Jan: 450, Fev: 480, ..., Dez: 400 };
   * const pico = CommonTypes.findPeakMonth(geracao);
   * // Result: ['Jul', 540] (exemplo - mês de maior irradiação)
   * ```
   */
  export function findPeakMonth(data: MonthlyData): [Month, number] {
    const months: Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    let peakMonth: Month = 'Jan';
    let peakValue: number = data['Jan'];
    
    months.forEach(month => {
      if (data[month] > peakValue) {
        peakMonth = month;
        peakValue = data[month];
      }
    });
    
    return [peakMonth, peakValue];
  }

  /**
   * Encontra mês com menor consumo/geração
   * @description Identifica o mês de vale no perfil mensal
   * @param data Objeto MonthlyData com valores mensais
   * @returns Array com [mês, valor] do mês de vale
   * @example
   * ```typescript
   * const geracao = { Jan: 450, Fev: 480, ..., Dez: 400 };
   * const vale = CommonTypes.findLowMonth(geracao);
   * // Result: ['Dez', 400] (exemplo - mês de menor irradiação)
   * ```
   */
  export function findLowMonth(data: MonthlyData): [Month, number] {
    const months: Month[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    let lowMonth: Month = 'Jan';
    let lowValue: number = data['Jan'];
    
    months.forEach(month => {
      if (data[month] < lowValue) {
        lowMonth = month;
        lowValue = data[month];
      }
    });
    
    return [lowMonth, lowValue];
  }
}