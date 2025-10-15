/**
 * Types para análise de sistemas híbridos Solar + BESS
 *
 * Estes tipos espelham as interfaces do backend para garantir type safety
 * na comunicação entre frontend e backend.
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Estrutura de tarifa de energia
 * Suporta 4 tipos: branca, convencional, verde, azul
 */
export interface TarifaEnergia {
  /** Tipo de tarifa */
  tipo: 'branca' | 'convencional' | 'verde' | 'azul';

  /** Tarifa ponta em R$/kWh */
  tarifa_ponta_kwh?: number;

  /** Tarifa fora ponta em R$/kWh */
  tarifa_fora_ponta_kwh?: number;

  /** Tarifa intermediária em R$/kWh (tarifa branca) */
  tarifa_intermediaria_kwh?: number;

  /** Horário de início da ponta (ex: "18:00:00") */
  horario_ponta_inicio?: string;

  /** Horário de fim da ponta (ex: "21:00:00") */
  horario_ponta_fim?: string;

  /** Tarifa de demanda ponta em R$/kW */
  tarifa_demanda_ponta?: number;

  /** Tarifa de demanda fora ponta em R$/kW */
  tarifa_demanda_fora_ponta?: number;
}

/**
 * Perfil de consumo horário
 */
export interface PerfilConsumo {
  /** Tipo de perfil */
  tipo: 'residencial' | 'comercial' | 'industrial' | 'custom';

  /** Curva horária típica (24 valores em % do consumo diário) */
  curva_horaria?: number[];
}

/**
 * Parâmetros do sistema solar para cálculo híbrido
 * Reutiliza a mesma estrutura do endpoint /solar/calculate existente
 */
export interface SistemaSolarParams {
  lat: number;
  lon: number;
  origem_dados: 'PVGIS' | 'NASA';
  startyear: number;
  endyear: number;
  modelo_decomposicao: 'erbs' | 'disc' | 'louche';
  modelo_transposicao: 'perez' | 'isotropic' | 'haydavies';
  mount_type: string;
  consumo_mensal_kwh: number[]; // 12 valores
  perdas: {
    sujeira: number;
    sombreamento: number;
    incompatibilidade: number;
    fiacao: number;
    outras: number;
  };
  modulo: {
    fabricante: string;
    modelo: string;
    potencia_nominal_w: number;
    largura_mm: number;
    altura_mm: number;
    peso_kg: number;
    vmpp: number;
    impp: number;
    voc_stc: number;
    isc_stc: number;
    eficiencia: number;
    temp_coef_pmax: number;
    alpha_sc?: number;
    beta_oc?: number;
    gamma_r?: number;
    cells_in_series?: number;
    a_ref?: number;
    il_ref?: number;
    io_ref?: number;
    rs?: number;
    rsh_ref?: number;
  };
  inversores: Array<{
    inversor: {
      fabricante: string;
      modelo: string;
      potencia_saida_ca_w: number;
      potencia_fv_max_w: number;
      numero_mppt: number;
      eficiencia_max: number;
      efficiency_dc_ac: number;
      tensao_cc_max_v: number;
      strings_por_mppt: number;
      tipo_rede: string;
    };
    orientacoes: Array<{
      nome: string;
      orientacao: number; // 0-360° (0=Norte, 180=Sul)
      inclinacao: number; // 0-90°
      modulos_por_string: number;
      numero_strings?: number;
    }>;
  }>;
}

/**
 * Requisição completa para cálculo de sistema híbrido Solar + BESS
 *
 * Combina três partes principais:
 * 1. Parâmetros do sistema solar
 * 2. Parâmetros do BESS (capacidade e potência pré-definidos)
 * 3. Parâmetros econômicos e tarifários
 */
export interface HybridDimensioningRequest {
  // PARTE 1: SISTEMA SOLAR
  sistema_solar: SistemaSolarParams;

  // PARTE 2: SISTEMA BESS (PRÉ-DIMENSIONADO)
  /** Capacidade nominal da bateria em kWh */
  capacidade_kwh: number;

  /** Potência nominal do inversor BESS em kW */
  potencia_kw: number;

  /** Tipo de tecnologia da bateria */
  tipo_bateria?: 'litio' | 'chumbo_acido' | 'flow';

  /** Eficiência round-trip (carga + descarga) */
  eficiencia_roundtrip?: number;

  /** Profundidade máxima de descarga (0-1) */
  profundidade_descarga_max?: number;

  /** Estado de carga inicial (0-1) */
  soc_inicial?: number;

  /** SOC mínimo permitido (0-0.5) */
  soc_minimo?: number;

  /** SOC máximo permitido (0.5-1) */
  soc_maximo?: number;

  // PARTE 3: TARIFAS E CONSUMO
  /** Estrutura tarifária */
  tarifa: TarifaEnergia;

  /** Perfil de consumo (opcional) */
  perfil_consumo?: PerfilConsumo;

  // PARTE 4: ESTRATÉGIA DE OPERAÇÃO
  /** Estratégia de operação do BESS */
  estrategia?: 'arbitragem' | 'peak_shaving' | 'auto_consumo' | 'custom';

  /** Limite de demanda para peak shaving em kW */
  limite_demanda_kw?: number;

  // PARTE 5: PARÂMETROS ECONÔMICOS
  /** Custo por kWh de capacidade da bateria (R$/kWh) */
  custo_kwh_bateria?: number;

  /** Custo por kW de potência do inversor BESS (R$/kW) */
  custo_kw_inversor_bess?: number;

  /** Custo fixo de instalação do BESS (R$) */
  custo_instalacao_bess?: number;

  /** Taxa de desconto anual para análise financeira (decimal) */
  taxa_desconto?: number;

  /** Vida útil estimada do BESS em anos */
  vida_util_anos?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Resultados do sistema solar
 */
export interface SistemaSolarResult {
  potenciaTotalKwp: number;
  energiaAnualKwh: number;
  geracaoMensalKwh: {
    Jan: number;
    Fev: number;
    Mar: number;
    Abr: number;
    Mai: number;
    Jun: number;
    Jul: number;
    Ago: number;
    Set: number;
    Out: number;
    Nov: number;
    Dez: number;
  };
  yieldEspecifico: number; // kWh/kWp
  fatorCapacidade: number; // %
  prTotal: number; // Performance Ratio %
  inversores?: any[];
  [key: string]: any;
}

/**
 * Resultados do sistema BESS
 */
export interface SistemaBessResult {
  // Parâmetros de entrada
  capacidade_kwh: number;
  potencia_kw: number;
  estrategia: string;
  eficiencia_roundtrip: number;

  // Energia processada
  energia_armazenada_anual_kwh: number;
  energia_descarregada_anual_kwh: number;
  energia_perdida_kwh: number;
  eficiencia_real: number;

  // Estado de carga (SOC)
  soc_medio_percentual: number;
  soc_minimo_percentual: number;
  soc_maximo_percentual: number;

  // Ciclos e degradação
  ciclos_equivalentes_ano: number;
  profundidade_descarga_media: number;
  degradacao_estimada_percentual: number;

  // Economia
  economia_arbitragem_reais?: number;
  economia_peak_shaving_reais?: number;
  economia_total_anual_reais: number;

  // Custos
  custo_sem_bess_reais: number;
  custo_com_bess_reais: number;

  // Utilização
  horas_carga: number;
  horas_descarga: number;
  horas_idle: number;
  utilizacao_percentual: number;
}

/**
 * Análise híbrida integrada
 */
export interface AnaliseHibrida {
  // Fluxos de energia
  fluxos_energia: {
    energia_solar_gerada_kwh: number;
    energia_consumida_total_kwh: number;
    energia_solar_para_consumo_kwh: number;
    energia_solar_para_bess_kwh: number;
    energia_solar_para_rede_kwh: number;
    energia_consumo_de_solar_kwh: number;
    energia_consumo_de_bess_kwh: number;
    energia_consumo_de_rede_kwh: number;
  };

  // Autossuficiência
  autossuficiencia: {
    autossuficiencia_percentual: number;
    taxa_autoconsumo_solar: number;
    dependencia_rede_percentual: number;
  };

  // Análise econômica
  analise_economica: {
    custo_energia_sem_sistema_reais: number;
    custo_energia_com_hibrido_reais: number;
    economia_anual_total_reais: number;
    economia_solar_reais: number;
    economia_bess_reais: number;
    receita_injecao_reais: number;
  };

  // Investimento
  investimento: {
    investimento_solar_reais: number;
    investimento_bess_reais: number;
    investimento_total_reais: number;
  };

  // Retorno financeiro
  retorno_financeiro: {
    payback_simples_anos: number;
    payback_descontado_anos: number;
    npv_reais: number;
    tir_percentual: number;
    lcoe_hibrido_reais_kwh: number;
  };

  // Comparação de cenários
  comparacao_cenarios: {
    sem_sistema: {
      investimento: number;
      economia_anual: number;
      custo_25_anos: number;
      npv: number;
    };
    somente_solar: {
      investimento: number;
      economia_anual: number;
      payback_anos: number;
      npv: number;
      tir_percentual: number;
    };
    somente_bess: {
      investimento: number;
      economia_anual: number;
      payback_anos: number;
      npv: number;
      tir_percentual: number;
    };
    hibrido: {
      investimento: number;
      economia_anual: number;
      payback_anos: number;
      npv: number;
      tir_percentual: number;
      vantagem_vs_solar_npv: number;
      vantagem_vs_bess_npv: number;
      vantagem_vs_solar_percentual: number;
      vantagem_vs_bess_percentual: number;
    };
  };

  // Recomendações e alertas
  recomendacoes: string[];
  alertas: string[];
}

/**
 * Resposta completa do cálculo híbrido
 */
export interface HybridDimensioningResponse {
  sistema_solar: SistemaSolarResult;
  sistema_bess: SistemaBessResult;
  analise_hibrida: AnaliseHibrida;
  metadata?: {
    duration_ms: number;
    timestamp: string;
  };
}

/**
 * Resposta da API com metadata
 */
export interface HybridCalculationApiResponse {
  success: boolean;
  data: HybridDimensioningResponse;
  metadata?: {
    duration_ms: number;
    timestamp: string;
  };
  timestamp?: string;
  sistema_solar?: SistemaSolarResult;
  sistema_bess?: SistemaBessResult;
  analise_hibrida?: AnaliseHibrida;
}

/**
 * Resposta do health check
 */
export interface BessHealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  backend: 'ok' | 'error';
  python_service: {
    status: string;
    service?: string;
    version?: string;
    error?: string;
  };
  timestamp: string;
}
