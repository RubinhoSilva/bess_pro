/**
 * Constantes centralizadas para cálculos de sistemas solares e BESS
 * @author BESS Pro Team
 * @version 1.0.0
 * @since 2024-01
 */

export const CalculationConstants = {
  /**
   * Constantes para cálculos solares
   */
  SOLAR: {
    /**
     * Potência padrão do módulo fotovoltaico
     * @unit W
     * @source Média mercado brasileiro 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_POWER_W: 540,

    /**
     * Área padrão do módulo fotovoltaico
     * @unit m²
     * @source Média módulos monocristalinos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_AREA_M2: 2.1,

    /**
     * Eficiência padrão do módulo fotovoltaico
     * @unit %
     * @source Módulos monocristalinos comerciais 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_EFFICIENCY: 21.2,

    /**
     * Fator de segurança para dimensionamento do inversor
     * @unit adimensional
     * @source IEC 62109 - Inversores fotovoltaicos
     * @lastUpdate 2024-01
     */
    INVERTER_SAFETY_FACTOR: 1.2,

    /**
     * Eficiência mínima aceitável para módulos
     * @unit %
     * @source Especificação técnica mínima
     * @lastUpdate 2024-01
     */
    MIN_EFFICIENCY_PERCENT: 5,

    /**
     * Eficiência máxima esperada para módulos
     * @unit %
     * @source Limite tecnológico atual
     * @lastUpdate 2024-01
     */
    MAX_EFFICIENCY_PERCENT: 25,

    /**
     * Potência mínima para sistemas solares
     * @unit kWp
     * @source Resolução Normativa ANEEL 482/2012
     * @lastUpdate 2024-01
     */
    MIN_POWER_KWP: 0.1,

    /**
     * Potência máxima para sistemas solares
     * @unit kWp
     * @source Limite técnico para microgeração
     * @lastUpdate 2024-01
     */
    MAX_POWER_KWP: 500,

    /**
     * Performance ratio padrão para sistemas brasileiros
     * @unit adimensional
     * @source Média nacional CRESESB 2023
     * @lastUpdate 2024-01
     */
    PERFORMANCE_RATIO_DEFAULT: 0.80,
  } as const,

  /**
   * Constantes de perdas do sistema
   */
  LOSSES: {
    /**
     * Perdas padrão por sujeira nos módulos
     * @unit %
     * @source NBR 16274:2014 - Sistemas fotovoltaicos
     * @lastUpdate 2024-01
     */
    DEFAULT_SOILING: 5,

    /**
     * Perdas padrão por sombreamento
     * @unit %
     * @source Manual CRESESB - Engenharia FV
     * @lastUpdate 2024-01
     */
    DEFAULT_SHADING: 3,

    /**
     * Perdas por mismatch entre módulos
     * @unit %
     * @source IEC 61724-1:2017 - Performance monitoring
     * @lastUpdate 2024-01
     */
    DEFAULT_MISMATCH: 2,

    /**
     * Perdas por cabeamento elétrico
     * @unit %
     * @source NBR 5410 - Instalações elétricas
     * @lastUpdate 2024-01
     */
    DEFAULT_WIRING: 2,

    /**
     * Perdas por temperatura dos módulos
     * @unit %
     * @source Temperatura média Brasil 25°C acima de STC
     * @lastUpdate 2024-01
     */
    DEFAULT_TEMPERATURE: 10,

    /**
     * Perdas por eficiência do inversor
     * @unit %
     * @source Especificação inversores comerciais
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER: 3,
  } as const,

  /**
   * Constantes para cálculos de CO2
   */
  CO2: {
    /**
     * Fator de emissão de CO2 da matriz elétrica brasileira
     * @unit kg CO2 / kWh
     * @source MME - Ministério de Minas e Energia 2023
     * @lastUpdate 2024-01
     */
    KG_PER_KWH_BRAZIL: 0.074,

    /**
     * CO2 absorvido por árvore por ano
     * @unit kg CO2 / árvore / ano
     * @source IPCC - Guidelines for National Greenhouse Gas Inventories
     * @lastUpdate 2024-01
     */
    KG_PER_TREE_YEAR: 21,
  } as const,

  /**
   * Constantes para cálculos financeiros
   */
  FINANCIAL: {
    /**
     * Tarifa de energia padrão residencial
     * @unit R$/kWh
     * @source Média tarifa residencial Brasil 2023
     * @lastUpdate 2024-01
     */
    DEFAULT_TARIFA_ENERGIA: 0.85,

    /**
     * Custo do fio B padrão
     * @unit R$/kWh
     * @source ANEEL - Subclasse residencial
     * @lastUpdate 2024-01
     */
    DEFAULT_CUSTO_FIO_B: 0.30,

    /**
     * Vida útil padrão de sistemas solares
     * @unit anos
     * @source Garantia fabricantes módulos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_VIDA_UTIL_ANOS: 25,

    /**
     * Taxa de desconto padrão para análise financeira
     * @unit %
     * @source Taxa mínima atratividade Brasil 2023
     * @lastUpdate 2024-01
     */
    DEFAULT_TAXA_DESCONTO: 10.0,

    /**
     * Inflação média da energia elétrica
     * @unit % ao ano
     * @source Histórico reajustes ANEEL 2013-2023
     * @lastUpdate 2024-01
     */
    DEFAULT_INFLACAO_ENERGIA: 5.5,

    /**
     * Custo operacional e manutenção padrão
     * @unit % do investimento inicial
     * @source NREL - O&M cost best practices
     * @lastUpdate 2024-01
     */
    DEFAULT_O_E_M_PERCENT: 1.0,
  } as const,

  /**
   * Constantes para sistemas BESS
   */
  BESS: {
    /**
     * Número máximo de baterias em sistema
     * @unit unidades
     * @source Limite técnico instalações residenciais
     * @lastUpdate 2024-01
     */
    MAX_BATTERIES: 20,

    /**
     * Número mínimo de baterias em sistema
     * @unit unidades
     * @source Configuração mínima funcional
     * @lastUpdate 2024-01
     */
    MIN_BATTERIES: 1,

    /**
     * Profundidade de descarga padrão
     * @unit %
     * @source Especificação baterias Li-ion 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_DOD_PERCENT: 90,

    /**
     * Eficiência padrão do sistema BESS
     * @unit %
     * @source Eficiência round-trip média
     * @lastUpdate 2024-01
     */
    DEFAULT_SYSTEM_EFFICIENCY: 85,

    /**
     * Ciclos de vida padrão baterias
     * @unit ciclos
     * @source Especificação baterias LFP 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_CYCLE_LIFE: 6000,

    /**
     * Capacidade padrão bateria residencial
     * @unit kWh
     * @source Média mercado brasileiro 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_CAPACITY_KWH: 13.5,
  } as const,

  /**
   * Constantes para dados de irradiação
   */
  IRRADIATION: {
    /**
     * Irradiação mensal padrão Brasil (kWh/m²/dia)
     * @unit kWh/m²/dia
     * @source Média nacional INPE 2023
     * @lastUpdate 2024-01
     */
    DEFAULT_MONTHLY_KWH_M2: [4.5, 5.0, 5.2, 5.0, 4.8, 4.5, 4.7, 5.0, 5.2, 5.5, 5.0, 4.8],

    /**
     * Irradiação mínima para viabilidade
     * @unit kWh/m²/dia
     * @source Limite técnico mínimo
     * @lastUpdate 2024-01
     */
    MIN_IRRADIATION: 0,

    /**
     * Irradiação máxima esperada
     * @unit kWh/m²/dia
     * @source Limite máximo mundial
     * @lastUpdate 2024-01
     */
    MAX_IRRADIATION: 10,
  } as const,

  /**
   * Constantes para simulação e operação
   */
  SIMULATION: {
    /**
     * Dias padrão para simulação BESS
     * @unit dias
     * @source Período representativo operação
     * @lastUpdate 2024-01
     */
    DEFAULT_SIMULATION_DAYS: 30,

    /**
     * Estado de carga inicial bateria
     * @unit % (0-1)
     * @source Condição operacional segura
     * @lastUpdate 2024-01
     */
    INITIAL_SOC: 0.5,

    /**
     * SOC máximo para carregamento
     * @unit % (0-1)
     * @source Especificação fabricantes
     * @lastUpdate 2024-01
     */
    MAX_SOC_CHARGE: 0.9,

    /**
     * SOC mínimo operacional
     * @unit % (0-1)
     * @source Limite segurança baterias
     * @lastUpdate 2024-01
     */
    MIN_SOC_DISCHARGE: 0.1,

    /**
     * SOC máximo absoluto
     * @unit % (0-1)
     * @source Proteção sobrecarga
     * @lastUpdate 2024-01
     */
    MAX_SOC_ABSOLUTE: 0.95,

    /**
     * Fator potência carregamento
     * @unit % (0-1)
     * @source Configuração carregadores
     * @lastUpdate 2024-01
     */
    CHARGE_POWER_FACTOR: 0.8,

    /**
     * Fator potência descarga
     * @unit % (0-1)
     * @source Configuração inversores
     * @lastUpdate 2024-01
     */
    DISCHARGE_POWER_FACTOR: 0.8,

    /**
     * Ciclos diários médios
     * @unit ciclos/dia
     * @source Perfil consumo residencial
     * @lastUpdate 2024-01
     */
    DAILY_CYCLES: 1.5,

    /**
     * Vida útil máxima sistema BESS
     * @unit anos
     * @source Limite técnico econômico
     * @lastUpdate 2024-01
     */
    MAX_SYSTEM_LIFETIME_YEARS: 15,
  } as const,

  /**
   * Constantes para análise financeira avançada
   */
  ADVANCED_FINANCIAL: {
    /**
     * Degradação anual módulos
     * @unit % ao ano
     * @source Garantia fabricantes 2024
     * @lastUpdate 2024-01
     */
    MODULE_DEGRADATION_RATE: 0.5,

    /**
     * Inflação custos O&M
     * @unit % ao ano
     * @source Índice nacional preços
     * @lastUpdate 2024-01
     */
    O_M_INFLATION_RATE: 4.0,

    /**
     * Custo inversor por kW
     * @unit R$/kW
     * @source Média mercado brasileiro 2024
     * @lastUpdate 2024-01
     */
    INVERTER_COST_PER_KW: 2000,

    /**
     * Fator penalidade configuração inadequada
     * @unit % (0-1)
     * @source Ajuste financeiro risco
     * @lastUpdate 2024-01
     */
    CONFIGURATION_PENALTY_FACTOR: 1.1,

    /**
     * Valor residual sistema
     * @unit % do investimento
     * @source Valor de sucata 25 anos
     * @lastUpdate 2024-01
     */
    RESIDUAL_VALUE_PERCENT: 10,
  } as const,

  /**
   * Constantes para otimização de carga
   */
  LOAD_OPTIMIZATION: {
    /**
     * Início horário de pico
     * @unit horas (0-23)
     * @source Horário ponta residencial
     * @lastUpdate 2024-01
     */
    PEAK_HOUR_START: 18,

    /**
     * Fim horário de pico
     * @unit horas (0-23)
     * @source Horário ponta residencial
     * @lastUpdate 2024-01
     */
    PEAK_HOUR_END: 21,

    /**
     * Início horário tarifa baixa
     * @unit horas (0-23)
     * @source Horário fora ponta
     * @lastUpdate 2024-01
     */
    OFF_PEAK_START: 0,

    /**
     * Fim horário tarifa baixa
     * @unit horas (0-23)
     * @source Horário fora ponta
     * @lastUpdate 2024-01
     */
    OFF_PEAK_END: 6,

    /**
     * Limite carga para peak shaving
     * @unit % (0-1)
     * @source Configuração otimização
     * @lastUpdate 2024-01
     */
    PEAK_SHAVING_THRESHOLD: 0.5,

    /**
     * Redução máxima peak shaving
     * @unit % (0-1)
     * @source Capacidade sistema
     * @lastUpdate 2024-01
     */
    MAX_PEAK_SHAVING_REDUCTION: 0.3,

    /**
     * Fator carregamento off-peak
     * @unit % (0-1)
     * @source Configuração carregadores
     * @lastUpdate 2024-01
     */
    OFF_PEAK_CHARGE_FACTOR: 0.7,

    /**
     * Capacidade carregamento diário
     * @unit % (0-1)
     * @source Limite segurança bateria
     * @lastUpdate 2024-01
     */
    DAILY_CHARGE_CAPACITY: 0.2,

    /**
     * Tarifa energia horário pico
     * @unit R$/kWh
     * @source Tarifa ponta residencial
     * @lastUpdate 2024-01
     */
    PEAK_TARIFF: 0.8,
  } as const,

  /**
   * Constantes para validação e limites
   */
  VALIDATION: {
    /**
     * Comprimento máximo array geração/consumo
     * @unit meses
     * @source Calendário anual
     * @lastUpdate 2024-01
     */
    MAX_MONTHLY_ARRAY_LENGTH: 12,

    /**
     * Timeout requisições API
     * @unit milissegundos
     * @source Configuração sistema
     * @lastUpdate 2024-01
     */
    API_TIMEOUT_MS: 30000,

    /**
     * Máximo perda por obstáculo sombreamento
     * @unit %
     * @source Limite técnico sombreamento
     * @lastUpdate 2024-01
     */
    MAX_SHADING_LOSS_PER_OBSTACLE: 50,

    /**
     * Máximo perda total sombreamento
     * @unit %
     * @source Limite viabilidade sistema
     * @lastUpdate 2024-01
     */
    MAX_TOTAL_SHADING_LOSS: 80,

    /**
     * Fator redundância capacidade
     * @unit % (0-1)
     * @source Margem segurança projeto
     * @lastUpdate 2024-01
     */
    CAPACITY_REDUNDANCY_FACTOR: 1.2,
  } as const,
} as const;

// Exportar tipos para facilitar uso
export type SolarConstants = typeof CalculationConstants.SOLAR;
export type LossesConstants = typeof CalculationConstants.LOSSES;
export type CO2Constants = typeof CalculationConstants.CO2;
export type FinancialConstants = typeof CalculationConstants.FINANCIAL;
export type BESSConstants = typeof CalculationConstants.BESS;
export type IrradiationConstants = typeof CalculationConstants.IRRADIATION;
export type SimulationConstants = typeof CalculationConstants.SIMULATION;
export type AdvancedFinancialConstants = typeof CalculationConstants.ADVANCED_FINANCIAL;
export type LoadOptimizationConstants = typeof CalculationConstants.LOAD_OPTIMIZATION;
export type ValidationConstants = typeof CalculationConstants.VALIDATION;