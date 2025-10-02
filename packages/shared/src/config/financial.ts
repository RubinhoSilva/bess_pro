/**
 * Configurações centralizadas para cálculos financeiros
 * Valores baseados nas melhores práticas e regulamentações brasileiras
 */

export const FINANCIAL_CONFIG = {
  // ===== PARÂMETROS TEMPORAIS =====
  vida_util_padrao: 25, // anos
  periodo_analise: 25, // anos
  
  // ===== TAXAS E PERCENTUAIS =====
  taxa_desconto_padrao: 8.0, // % ao ano
  inflacao_energia_padrao: 4.5, // % ao ano
  degradacao_modulos_padrao: 0.5, // % ao ano
  inflacao_om_padrao: 4.0, // % ao ano
  
  // ===== SIMULTANEIDADE E EFICIÊNCIA =====
  fator_simultaneidade_padrao: 0.25, // 25% de autoconsumo instantâneo
  eficiencia_inversor_padrao: 0.96, // 96%
  perdas_sistema_padrao: 0.10, // 10%
  
  // ===== CUSTOS OPERACIONAIS =====
  custo_om_percentual_padrao: 0.01, // 1% do investimento ao ano
  custo_seguro_percentual_padrao: 0.003, // 0.3% do investimento ao ano
  reposicao_inversor_ano: 12, // ano de reposição do inversor
  custo_reposicao_inversor_percentual: 0.15, // 15% do investimento
  
  // ===== LEI 14.300/2022 (Autoconsumo Remoto) =====
  fio_b_schedule: {
    2025: 0.45, // 45% não compensado
    2026: 0.60, // 60% não compensado
    2027: 0.75, // 75% não compensado
    2028: 0.90, // 90% não compensado
    2029: 1.00  // 100% não compensado (fim da compensação)
  },
  base_year: 2025,
  
  // ===== DISTRIBUIÇÃO DE CRÉDITOS (AUTOCONSUMO REMOTO) =====
  percentuais_creditos: {
    grupo_b: 0.40,      // 40% para Grupo B (residencial/comercial)
    grupo_a_verde: 0.30, // 30% para Grupo A Verde
    grupo_a_azul: 0.30   // 30% para Grupo A Azul
  },
  
  // ===== TARIFAS DE REFERÊNCIA (GRUPO B) =====
  tarifas_grupo_b: {
    tarifa_residencial: 0.84,    // R$/kWh
    fio_b_residencial: 0.25,     // R$/kWh
    tarifa_comercial: 0.75,      // R$/kWh
    fio_b_comercial: 0.20        // R$/kWh
  },
  
  // ===== TARIFAS DE REFERÊNCIA (GRUPO A - VERDE) =====
  tarifas_grupo_a_verde: {
    tarifa_fora_ponta: 0.48,     // R$/kWh
    tarifa_ponta: 2.20,          // R$/kWh
    tusd_fora_ponta: 0.16121,    // R$/kWh
    tusd_ponta: 1.6208,          // R$/kWh
    te_fora_ponta: 0.34334,      // R$/kWh
    te_ponta: 0.55158            // R$/kWh
  },
  
  // ===== TARIFAS DE REFERÊNCIA (GRUPO A - AZUL) =====
  tarifas_grupo_a_azul: {
    tarifa_fora_ponta: 0.48,     // R$/kWh
    tarifa_ponta: 2.20,          // R$/kWh
    tusd_fora_ponta: 0.16121,    // R$/kWh
    tusd_ponta: 1.6208,          // R$/kWh
    te_fora_ponta: 0.34334,      // R$/kWh
    te_ponta: 0.55158            // R$/kWh
  },
  
  // ===== LIMITES E VALIDAÇÕES =====
  limites: {
    investimento_minimo: 1000,           // R$
    investimento_maximo: 10000000,       // R$ 10 milhões
    geracao_minima_anual: 100,           // kWh/ano
    geracao_maxima_anual: 10000000,      // kWh/ano
    tarifa_minima: 0.1,                  // R$/kWh
    tarifa_maxima: 5.0,                  // R$/kWh
    taxa_desconto_minima: 0,             // %
    taxa_desconto_maxima: 30,            // %
    inflacao_minima: -20,                // %
    inflacao_maxima: 20,                 // %
    degradacao_minima: 0,                // %
    degradacao_maxima: 2,                // %
    fator_simultaneidade_minimo: 0,      // 0%
    fator_simultaneidade_maximo: 1,      // 100%
    vida_util_minima: 5,                 // anos
    vida_util_maxima: 50                 // anos
  },
  
  // ===== ANÁLISE DE SENSIBILIDADE =====
  sensibilidade: {
    variacao_tarifa: {
      min: -20,  // -20%
      max: 20,   // +20%
      passo: 5   // 5%
    },
    variacao_inflacao: {
      min: -2,   // -2%
      max: 2,    // +2%
      passo: 0.5 // 0.5%
    },
    variacao_desconto: {
      min: -2,   // -2%
      max: 2,    // +2%
      passo: 0.5 // 0.5%
    },
    variacao_geracao: {
      min: -10,  // -10%
      max: 10,   // +10%
      passo: 5   // 5%
    },
    variacao_investimento: {
      min: -20,  // -20%
      max: 20,   // +20%
      passo: 5   // 5%
    }
  },
  
  // ===== CENÁRIOS PADRÃO =====
  cenarios: {
    otimista: {
      variacao_tarifa: 1.10,      // +10%
      variacao_inflacao: 1.00,    // sem alteração
      variacao_desconto: 0.90,    // -1%
      variacao_investimento: 0.80 // -20%
    },
    conservador: {
      variacao_tarifa: 0.95,      // -5%
      variacao_inflacao: 1.00,    // sem alteração
      variacao_desconto: 1.10,    // +1%
      variacao_investimento: 1.00 // sem alteração
    },
    pessimista: {
      variacao_tarifa: 0.90,      // -10%
      variacao_inflacao: 1.00,    // sem alteração
      variacao_desconto: 1.20,    // +2%
      variacao_investimento: 1.20 // +20%
    }
  },
  
  // ===== PERFORMANCE E MÉTRICAS =====
  metricas: {
    payback_maximo: 25,           // anos
    tir_minima_aceitavel: 8,      // % ao ano
    vpl_minimo_aceitavel: 0,      // R$
    lcoe_maximo_aceitavel: 1.0,   // R$/kWh
    roi_minimo_aceitavel: 100,    // % ao longo da vida útil
    yield_especifico_minimo: 1000, // kWh/kWp/ano
    eficiencia_investimento_minima: 10 // % ao ano
  },
  
  // ===== CONFIGURAÇÕES DE CACHE =====
  cache: {
    ttl_padrao: 3600,              // 1 hora em segundos
    ttl_sensibilidade: 1800,       // 30 minutos
    ttl_cenarios: 1800,            // 30 minutos
    max_size: 1000,                // máximo de entradas
    key_prefix: 'financial_'       // prefixo para chaves
  },
  
  // ===== AMBIENTE E REGIÕES =====
  regioes: {
    nordeste: {
      irradiacao_media: 5.5,       // kWh/m²/dia
      tarifa_media: 0.65,          // R$/kWh
      inflacao_energia: 5.0        // % ao ano
    },
    sudeste: {
      irradiacao_media: 4.8,       // kWh/m²/dia
      tarifa_media: 0.75,          // R$/kWh
      inflacao_energia: 4.5        // % ao ano
    },
    sul: {
      irradiacao_media: 4.2,       // kWh/m²/dia
      tarifa_media: 0.85,          // R$/kWh
      inflacao_energia: 4.0        // % ao ano
    },
    centro_oeste: {
      irradiacao_media: 5.2,       // kWh/m²/dia
      tarifa_media: 0.70,          // R$/kWh
      inflacao_energia: 4.8        // % ao ano
    },
    norte: {
      irradiacao_media: 4.5,       // kWh/m²/dia
      tarifa_media: 0.90,          // R$/kWh
      inflacao_energia: 5.2        // % ao ano
    }
  }
} as const;

// ===== UTILITÁRIOS =====

/**
 * Obtém configuração por região
 */
export function getConfiguracaoRegiao(regiao: keyof typeof FINANCIAL_CONFIG.regioes) {
  return FINANCIAL_CONFIG.regioes[regiao];
}

/**
 * Valida se um valor está dentro dos limites
 */
export function validarLimites(
  valor: number,
  tipo: keyof typeof FINANCIAL_CONFIG.limites
): boolean {
  const limites = FINANCIAL_CONFIG.limites;
  const config = limites[tipo];
  
  if (!config || typeof config !== 'object') return true;
  
  const configObj = config as { min: number; max: number };
  if ('min' in configObj && 'max' in configObj) {
    return valor >= configObj.min && valor <= configObj.max;
  }
  
  return true;
}

/**
 * Obtém tarifa por grupo e modalidade
 */
export function getTarifaReferencia(
  grupo: 'b' | 'a_verde' | 'a_azul',
  modalidade?: string
): number {
  switch (grupo) {
    case 'b':
      return modalidade === 'comercial' 
        ? FINANCIAL_CONFIG.tarifas_grupo_b.tarifa_comercial
        : FINANCIAL_CONFIG.tarifas_grupo_b.tarifa_residencial;
    
    case 'a_verde':
      return FINANCIAL_CONFIG.tarifas_grupo_a_verde.tarifa_fora_ponta;
    
    case 'a_azul':
      return FINANCIAL_CONFIG.tarifas_grupo_a_azul.tarifa_fora_ponta;
    
    default:
      return FINANCIAL_CONFIG.tarifas_grupo_b.tarifa_residencial;
  }
}

/**
 * Calcula percentual de Fio B não compensado por ano
 */
export function getPercentualFioBNaoCompensado(ano: number): number {
  const schedule = FINANCIAL_CONFIG.fio_b_schedule;
  
  // Encontrar o ano mais próximo no cronograma
  const anosDisponiveis = Object.keys(schedule).map(Number).sort((a, b) => a - b);
  
  for (const anoSchedule of anosDisponiveis) {
    if (ano <= anoSchedule) {
      return schedule[anoSchedule as keyof typeof schedule];
    }
  }
  
  // Se não encontrar, retorna 100% (fim da compensação)
  return 1.0;
}

export default FINANCIAL_CONFIG;