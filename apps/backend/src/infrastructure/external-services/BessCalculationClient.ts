/**
 * Cliente para comunicação com o serviço Python de cálculos BESS
 *
 * Este cliente encapsula todas as chamadas HTTP para o microserviço Python
 * de cálculos de sistemas híbridos (Solar + BESS).
 *
 * Endpoints disponíveis:
 * - POST /api/v1/bess/hybrid-dimensioning: Calcula sistema híbrido completo
 * - GET /api/v1/bess/health: Health check do serviço
 *
 * O serviço Python executa:
 * 1. Cálculo de geração solar (PVLIB ModelChain)
 * 2. Simulação de operação BESS (8760 horas)
 * 3. Análise financeira integrada (VPL, TIR, Payback)
 * 4. Comparação de cenários (sem sistema, só solar, só BESS, híbrido)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// INTERFACES - REQUEST
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
 * Requisição completa para cálculo de sistema híbrido Solar + BESS
 *
 * Combina três partes principais:
 * 1. Parâmetros do sistema solar (mesmo formato do endpoint /solar/calculate)
 * 2. Parâmetros do BESS (capacidade e potência pré-definidos pelo usuário)
 * 3. Parâmetros econômicos e tarifários
 */
export interface HybridDimensioningRequest {
  // ========================================================================
  // PARTE 1: SISTEMA SOLAR
  // ========================================================================
  // Reutiliza a mesma estrutura do endpoint /solar/calculate existente
  sistema_solar: {
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
      vmpp: number;
      impp: number;
      voc_stc: number;
      isc_stc: number;
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
        potencia_fv_max_w?: number;
        numero_mppt: number;
        eficiencia_max?: number;
        efficiency_dc_ac?: number;
        tensao_cc_max_v?: number;
        strings_por_mppt?: number;
        tipo_rede?: string;
      };
      orientacoes: Array<{
        nome: string;
        orientacao: number; // 0-360° (0=Norte, 180=Sul)
        inclinacao: number; // 0-90°
        modulos_por_string: number;
        numero_strings?: number;
      }>;
    }>;
  };

  // ========================================================================
  // PARTE 2: SISTEMA BESS (PRÉ-DIMENSIONADO)
  // ========================================================================
  // O usuário já definiu o tamanho do BESS antes de chamar a API

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

  // ========================================================================
  // PARTE 3: TARIFAS E CONSUMO
  // ========================================================================

  /** Estrutura tarifária */
  tarifa: TarifaEnergia;

  /** Perfil de consumo (opcional) */
  perfil_consumo?: PerfilConsumo;

  // ========================================================================
  // PARTE 4: ESTRATÉGIA DE OPERAÇÃO
  // ========================================================================

  /** Estratégia de operação do BESS */
  estrategia?: 'arbitragem' | 'peak_shaving' | 'auto_consumo' | 'custom';

  /** Limite de demanda para peak shaving em kW */
  limite_demanda_kw?: number;

  // ========================================================================
  // PARTE 5: PARÂMETROS ECONÔMICOS
  // ========================================================================

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
// INTERFACES - RESPONSE
// ============================================================================

/**
 * Resposta completa do cálculo de sistema híbrido
 *
 * Contém três seções principais:
 * 1. Resultados do sistema solar (geração, performance)
 * 2. Resultados do sistema BESS (armazenamento, ciclos, economia)
 * 3. Análise integrada (métricas combinadas, comparação de cenários)
 */
export interface HybridDimensioningResponse {
  // ========================================================================
  // PARTE 1: RESULTADOS SISTEMA SOLAR
  // ========================================================================
  // Mesma estrutura retornada pelo endpoint /solar/calculate
  sistema_solar: {
    potencia_total_kwp: number;
    energia_anual_kwh: number;
    geracao_mensal_kwh: {
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
    yield_especifico: number; // kWh/kWp
    fator_capacidade: number; // %
    pr_total: number; // Performance Ratio %
    inversores?: Array<any>;
    [key: string]: any;
  };

  // ========================================================================
  // PARTE 2: RESULTADOS SISTEMA BESS
  // ========================================================================
  sistema_bess: {
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
  };

  // ========================================================================
  // PARTE 3: ANÁLISE HÍBRIDA INTEGRADA
  // ========================================================================
  analise_hibrida: {
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
  };
}

// ============================================================================
// CLIENTE HTTP
// ============================================================================

/**
 * Cliente para comunicação com o serviço Python de cálculos BESS
 */
export class BessCalculationClient {
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * Inicializa o cliente BESS
   *
   * @param baseUrl - URL base do serviço Python (ex: http://localhost:8100)
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Configurar cliente HTTP com axios
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 300000, // 5 minutos (cálculo pode ser demorado)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`🔧 BessCalculationClient inicializado: ${baseUrl}`);
  }

  /**
   * Calcula sistema híbrido Solar + BESS
   *
   * Este método chama o endpoint Python que executa:
   * 1. Cálculo de geração solar (PVLIB ModelChain)
   * 2. Geração de perfil de consumo horário (8760 pontos)
   * 3. Simulação de operação do BESS (8760 horas)
   * 4. Análise financeira integrada (VPL, TIR, Payback)
   * 5. Comparação de 4 cenários (sem sistema, só solar, só BESS, híbrido)
   *
   * @param request - Parâmetros do sistema híbrido
   * @returns Resultado completo com análise integrada
   * @throws Error se a chamada falhar
   */
  async calculateHybridSystem(
    request: HybridDimensioningRequest
  ): Promise<HybridDimensioningResponse> {
    const startTime = Date.now();

    try {


        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-bess-hybrid-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        // Salvar payload
        fs.writeFileSync(filepath, JSON.stringify(request, null, 2), 'utf8');
        console.log(`💾 [BessCalculationClient] Payload salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [BessCalculationClient] Erro ao salvar payload:', error);
      }

      // Mapear campos do frontend para o formato esperado pelo Python
      // Frontend envia 'inversores' mas Python espera 'aguasTelhado'
      const pythonRequest = {
        ...request,
        sistema_solar: {
          ...request.sistema_solar,
          // Mapear inversores -> aguasTelhado
          aguasTelhado: request.sistema_solar.inversores?.map((inv: any, index: number) => ({
            id: `agua_${index + 1}`,
            nome: inv.orientacoes?.[0]?.nome || `Água ${index + 1}`,
            orientacao: inv.orientacoes?.[0]?.orientacao || 0,
            inclinacao: inv.orientacoes?.[0]?.inclinacao || 0,
            numeroModulos: inv.orientacoes?.[0]?.modulos_por_string * (inv.orientacoes?.[0]?.numero_strings || 1) || 1,
            inversor: inv.inversor
          })) || []
        }
      };

      // Chamar endpoint Python
      // POST /api/v1/bess/hybrid-dimensioning
      const response = await this.httpClient.post<HybridDimensioningResponse>(
        '/api/v1/bess/hybrid-dimensioning',
        pythonRequest
      );

      const duration = Date.now() - startTime;

      console.log(`✅ Cálculo híbrido concluído em ${duration}ms`);
      console.log(`   Solar: ${response.data.sistema_solar.potencia_total_kwp.toFixed(2)}kWp`);
      console.log(`   BESS: ${response.data.sistema_bess.ciclos_equivalentes_ano.toFixed(1)} ciclos/ano`);
      console.log(`   Autossuficiência: ${response.data.analise_hibrida.autossuficiencia.autossuficiencia_percentual.toFixed(1)}%`);
      console.log(`   VPL: R$ ${response.data.analise_hibrida.retorno_financeiro.npv_reais.toFixed(2)}`);

      return response.data;

    } catch (error) {
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        console.error(`❌ Erro ao calcular sistema híbrido (${duration}ms):`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message,
        });

        // Re-throw com mensagem mais descritiva
        throw new Error(
          `Erro ao calcular sistema híbrido: ${axiosError.response?.data || axiosError.message}`
        );
      }

      console.error(`❌ Erro desconhecido ao calcular sistema híbrido (${duration}ms):`, error);
      throw error;
    }
  }

  /**
   * Health check do serviço BESS
   *
   * Verifica se o serviço Python está disponível e respondendo
   *
   * @returns Status do serviço
   * @throws Error se o serviço estiver indisponível
   */
  async healthCheck(): Promise<{ service: string; status: string; version: string }> {
    try {
      const response = await this.httpClient.get('/api/v1/bess/health');
      return response.data;
    } catch (error) {
      console.error('❌ Health check do serviço BESS falhou:', error);
      throw new Error('Serviço BESS indisponível');
    }
  }
}
