/**
 * Constantes centralizadas para cálculos de sistemas solares e BESS
 * Importado do backend para uso no frontend
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
   * Constantes de módulos fotovoltaicos detalhadas
   */
  MODULE_DETAILS: {
    /**
     * Tensão no ponto de máxima potência padrão
     * @unit V
     * @source Módulos monocristalinos 540W 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_VMPP_V: 41.8,

    /**
     * Corrente no ponto de máxima potência padrão
     * @unit A
     * @source Módulos monocristalinos 540W 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_IMPP_A: 13.16,

    /**
     * Tensão de circuito aberto padrão
     * @unit V
     * @source Módulos monocristalinos 540W 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_VOC_V: 49.8,

    /**
     * Corrente de curto-circuito padrão
     * @unit A
     * @source Módulos monocristalinos 540W 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_ISC_A: 13.90,

    /**
     * Número de células padrão
     * @unit células
     * @source Módulos monocristalinos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_CELLS: 144,

    /**
     * Coeficiente de temperatura de potência padrão
     * @unit %/°C
     * @source Especificação técnica módulos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_TEMP_COEF_PMAX: -0.40,

    /**
     * Coeficiente de temperatura de Voc padrão
     * @unit V/°C
     * @source Especificação técnica módulos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_TEMP_COEF_VOC: -0.27,

    /**
     * Coeficiente de temperatura de Isc padrão
     * @unit A/°C
     * @source Especificação técnica módulos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_TEMP_COEF_ISC: 0.048,

    /**
     * Fator de idealidade modificado padrão
     * @unit V
     * @source Modelo de diodo único PVLIB
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_A_REF: 1.8,

    /**
     * Fotocorrente em STC padrão
     * @unit A
     * @source Modelo de diodo único PVLIB
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_IL_REF_A: 13.5,

    /**
     * Corrente de saturação reversa em STC padrão
     * @unit A
     * @source Modelo de diodo único PVLIB
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_IO_REF_A: 2.5e-12,

    /**
     * Resistência série padrão
     * @unit Ω
     * @source Modelo de diodo único PVLIB
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_RS_OHM: 0.3,

    /**
     * Resistência paralelo em STC padrão
     * @unit Ω
     * @source Modelo de diodo único PVLIB
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_RSH_REF_OHM: 500,

    /**
     * Largura padrão módulo
     * @unit mm
     * @source Módulos monocristalinos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_WIDTH_MM: 2279,

    /**
     * Altura padrão módulo
     * @unit mm
     * @source Módulos monocristalinos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_HEIGHT_MM: 1134,

    /**
     * Espessura padrão módulo
     * @unit mm
     * @source Módulos monocristalinos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_THICKNESS_MM: 35,

    /**
     * Peso padrão módulo
     * @unit kg
     * @source Módulos monocristalinos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_WEIGHT_KG: 21.2,

    /**
     * Garantia padrão módulo
     * @unit anos
     * @source Garantia fabricantes 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_MODULE_WARRANTY_YEARS: 25,
  } as const,

  /**
   * Constantes de inversores padrão
   */
  INVERTER_DEFAULTS: {
    /**
     * Potência nominal de saída CA padrão
     * @unit W
     * @source Inversores residenciais 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_POWER_W: 8000,

    /**
     * Potência máxima FV padrão
     * @unit W
     * @source Especificação inversores 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_PV_MAX_W: 12000,

    /**
     * Tensão máxima CC padrão
     * @unit V
     * @source Especificação inversores 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_DC_MAX_V: 1000,

    /**
     * Número de MPPT padrão
     * @unit unidades
     * @source Inversores residenciais 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_MPPT_COUNT: 2,

    /**
     * Strings por MPPT padrão
     * @unit strings
     * @source Configuração típica 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_STRINGS_PER_MPPT: 3,

    /**
     * Eficiência máxima padrão
     * @unit %
     * @source Inversores modernos 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_EFFICIENCY: 97.5,

    /**
     * Corrente máxima de entrada padrão
     * @unit A
     * @source Especificação inversores 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_INPUT_MAX_A: 18.5,

    /**
     * Potência aparente padrão
     * @unit VA
     * @source Especificação inversores 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_APPARENT_POWER_VA: 8200,

    /**
     * Garantia padrão inversor
     * @unit anos
     * @source Garantia fabricantes 2024
     * @lastUpdate 2024-01
     */
    DEFAULT_INVERTER_WARRANTY_YEARS: 5,
  } as const,

  /**
   * Constantes de consumo padrão
   */
  CONSUMPTION_DEFAULTS: {
    /**
     * Consumo mensal padrão residencial
     * @unit kWh/mês
     * @source Média Brasil 2023
     * @lastUpdate 2024-01
     */
    DEFAULT_MONTHLY_CONSUMPTION_KWH: 400,

    /**
     * Consumo anual padrão
     * @unit kWh/ano
     * @source Média residencial Brasil
     * @lastUpdate 2024-01
     */
    DEFAULT_ANNUAL_CONSUMPTION_KWH: 6000,

    /**
     * Consumo diário residencial padrão
     * @unit kWh/dia
     * @source Perfil típico residencial
     * @lastUpdate 2024-01
     */
    RESIDENTIAL_DAILY_CONSUMPTION_KWH: 48.5,

    /**
     * Potência de pico residencial padrão
     * @unit kW
     * @source Demanda residencial típica
     * @lastUpdate 2024-01
     */
    RESIDENTIAL_PEAK_POWER_KW: 4.5,

    /**
     * Cargas essenciais residenciais padrão
     * @unit kW
     * @source Mínimo essencial residencial
     * @lastUpdate 2024-01
     */
    RESIDENTIAL_ESSENTIAL_LOADS_KW: 2.0,

    /**
     * Consumo diário comercial padrão
     * @unit kWh/dia
     * @source Perfil típico comercial
     * @lastUpdate 2024-01
     */
    COMMERCIAL_DAILY_CONSUMPTION_KWH: 156.2,

    /**
     * Potência de pico comercial padrão
     * @unit kW
     * @source Demanda comercial típica
     * @lastUpdate 2024-01
     */
    COMMERCIAL_PEAK_POWER_KW: 16.0,

    /**
     * Cargas essenciais comerciais padrão
     * @unit kW
     * @source Mínimo essencial comercial
     * @lastUpdate 2024-01
     */
    COMMERCIAL_ESSENTIAL_LOADS_KW: 5.0,

    /**
     * Consumo diário industrial padrão
     * @unit kWh/dia
     * @source Perfil típico industrial
     * @lastUpdate 2024-01
     */
    INDUSTRIAL_DAILY_CONSUMPTION_KWH: 1285,

    /**
     * Potência de pico industrial padrão
     * @unit kW
     * @source Demanda industrial típica
     * @lastUpdate 2024-01
     */
    INDUSTRIAL_PEAK_POWER_KW: 120,

    /**
     * Cargas essenciais industriais padrão
     * @unit kW
     * @source Mínimo essencial industrial
     * @lastUpdate 2024-01
     */
    INDUSTRIAL_ESSENTIAL_LOADS_KW: 30,
  } as const,

  /**
   * Constantes financeiras adicionais
   */
  FINANCIAL_DEFAULTS: {
    /**
     * Inclinação padrão painéis Brasil
     * @unit graus
     * @source Latitude média Brasil
     * @lastUpdate 2024-01
     */
    DEFAULT_TILT_DEGREES: 23,
  } as const,

  /**
   * Constantes geométricas
   */
  GEOMETRY: {
    /**
     * Azimute mínimo válido
     * @unit graus
     * @source Sistema de coordenadas
     * @lastUpdate 2024-01
     */
    MIN_AZIMUTH_DEGREES: 0,

    /**
     * Azimute máximo válido
     * @unit graus
     * @source Sistema de coordenadas
     * @lastUpdate 2024-01
     */
    MAX_AZIMUTH_DEGREES: 360,

    /**
     * Inclinação máxima painéis
     * @unit graus
     * @source Limite instalação
     * @lastUpdate 2024-01
     */
    MAX_TILT_DEGREES: 90,

    /**
     * Ângulo referência sombreamento
     * @unit graus
     * @source Cálculo perfil horizonte
     * @lastUpdate 2024-01
     */
    SHADING_REFERENCE_ANGLE_DEGREES: 30,

    /**
     * Fator perdas sombreamento
     * @unit adimensional
     * @source Ajuste cálculo sombreamento
     * @lastUpdate 2024-01
     */
    SHADING_LOSS_FACTOR: 0.1,
  } as const,

  /**
   * Constantes de valores padrão para formulários
   */
  FORM_DEFAULTS: {
    /**
     * Valores padrão para módulos solares
     */
    MODULE_FORM: {
      /**
       * Tipo de célula padrão
       * @unit enum
       * @source Módulos mais comuns mercado 2024
       * @lastUpdate 2024-01
       */
      DEFAULT_CELL_TYPE: 'monocrystalline',

      /**
       * Tecnologia de célula padrão
       * @unit enum
       * @source Tecnologia mais difundida 2024
       * @lastUpdate 2024-01
       */
      DEFAULT_CELL_TECHNOLOGY: 'perc',

      /**
       * Descrição padrão para módulos
       * @unit string
       * @source Descrição genérica
       * @lastUpdate 2024-01
       */
      DEFAULT_DESCRIPTION: 'Módulo fotovoltaico padrão',
    } as const,

    /**
     * Valores padrão para inversores
     */
    INVERTER_FORM: {
      /**
       * Tipo de rede padrão
       * @unit string
       * @source Configuração mais comum Brasil
       * @lastUpdate 2024-01
       */
      DEFAULT_GRID_TYPE: 'monofasico-220v',

      /**
       * Tipo de conexão padrão
       * @unit string
       * @source Sistema conectado à rede
       * @lastUpdate 2024-01
       */
      DEFAULT_CONNECTION_TYPE: 'on-grid',

      /**
       * Certificações padrão Brasil
       * @unit array
       * @source Requisitos obrigatórios
       * @lastUpdate 2024-01
       */
      DEFAULT_CERTIFICATIONS: ['INMETRO'],
    } as const,
  } as const,
} as const;

// Exportar tipos para facilitar uso
export type SolarConstants = typeof CalculationConstants.SOLAR;
export type ModuleDetailsConstants = typeof CalculationConstants.MODULE_DETAILS;
export type InverterDefaultsConstants = typeof CalculationConstants.INVERTER_DEFAULTS;
export type ConsumptionDefaultsConstants = typeof CalculationConstants.CONSUMPTION_DEFAULTS;
export type FinancialDefaultsConstants = typeof CalculationConstants.FINANCIAL_DEFAULTS;
export type GeometryConstants = typeof CalculationConstants.GEOMETRY;
export type FormDefaultsConstants = typeof CalculationConstants.FORM_DEFAULTS;