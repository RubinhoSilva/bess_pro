/**
 * Cliente para comunicação com o serviço Python de cálculos financeiros (pvlib-service)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ===== INTERFACES DE ENTRADA =====

export interface FinancialCalculationInput {
  // Investimento
  investimento_inicial: number;

  // Geração e consumo
  geracao_mensal: number[]; // 12 valores
  consumo_mensal: number[]; // 12 valores

  // Tarifas
  tarifa_energia: number;
  custo_fio_b: number;

  // Parâmetros temporais
  vida_util: number;
  taxa_desconto: number;
  inflacao_energia: number;

  // Parâmetros opcionais
  degradacao_modulos?: number;
  custo_om?: number;
  inflacao_om?: number;

  // Simultaneidade
  fator_simultaneidade?: number;

  // Lei 14.300
  fio_b_schedule?: Record<number, number>;
  base_year?: number;

  // Autoconsumo remoto Grupo B
  autoconsumo_remoto_b?: boolean;
  consumo_remoto_b_mensal?: number[];
  tarifa_remoto_b?: number;
  fio_b_remoto_b?: number;
  perc_creditos_b?: number;

  // Autoconsumo remoto Grupo A Verde
  autoconsumo_remoto_a_verde?: boolean;
  consumo_remoto_a_verde_fp_mensal?: number[];
  consumo_remoto_a_verde_p_mensal?: number[];
  tarifa_remoto_a_verde_fp?: number;
  tarifa_remoto_a_verde_p?: number;
  tusd_remoto_a_verde_fp?: number;
  tusd_remoto_a_verde_p?: number;
  te_ponta_a_verde?: number;
  te_fora_ponta_a_verde?: number;
  perc_creditos_a_verde?: number;

  // Autoconsumo remoto Grupo A Azul
  autoconsumo_remoto_a_azul?: boolean;
  consumo_remoto_a_azul_fp_mensal?: number[];
  consumo_remoto_a_azul_p_mensal?: number[];
  tarifa_remoto_a_azul_fp?: number;
  tarifa_remoto_a_azul_p?: number;
  tusd_remoto_a_azul_fp?: number;
  tusd_remoto_a_azul_p?: number;
  te_ponta_a_azul?: number;
  te_fora_ponta_a_azul?: number;
  perc_creditos_a_azul?: number;
}

// ===== INTERFACES DE SAÍDA =====

export interface CashFlowDetail {
  ano: number;
  geracao_anual: number;
  economia_energia: number;
  custos_om: number;
  fluxo_liquido: number;
  fluxo_acumulado: number;
  valor_presente: number;
}

export interface FinancialIndicators {
  yield_especifico: number;
  custo_nivelado_energia: number;
  eficiencia_investimento: number;
  retorno_sobre_investimento: number;
}

export interface SensitivityPoint {
  parametro: number;
  vpl: number;
}

export interface SensitivityAnalysis {
  vpl_variacao_tarifa: SensitivityPoint[];
  vpl_variacao_inflacao: SensitivityPoint[];
  vpl_variacao_desconto: SensitivityPoint[];
}

export interface ScenarioAnalysis {
  base: {
    vpl: number;
    tir: number;
    payback: number;
  };
  otimista: {
    vpl: number;
    tir: number;
    payback: number;
  };
  conservador: {
    vpl: number;
    tir: number;
    payback: number;
  };
  pessimista: {
    vpl: number;
    tir: number;
    payback: number;
  };
}

export interface FinancialCalculationResult {
  // Indicadores principais
  vpl: number;
  tir: number;
  payback_simples: number;
  payback_descontado: number;

  // Métricas de economia
  economia_total_25_anos: number;
  economia_anual_media: number;
  lucratividade_index: number;

  // Fluxo de caixa detalhado
  cash_flow: CashFlowDetail[];

  // Indicadores de performance
  indicadores: FinancialIndicators;

  // Análises complementares
  sensibilidade: SensitivityAnalysis;
  cenarios: ScenarioAnalysis;
}

export interface PvlibServiceResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ===== EXCEÇÕES CUSTOMIZADAS =====

export class PvlibServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'PvlibServiceError';
  }
}

export class PvlibServiceUnavailableError extends PvlibServiceError {
  constructor(message: string = 'Serviço de cálculos Python indisponível') {
    super(message, 503);
    this.name = 'PvlibServiceUnavailableError';
  }
}

export class PvlibValidationError extends PvlibServiceError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = 'PvlibValidationError';
  }
}

// ===== CLIENTE =====

export interface IPvlibServiceClient {
  calculateAdvancedFinancials(input: FinancialCalculationInput): Promise<FinancialCalculationResult>;
  calculateSimpleFinancials(input: FinancialCalculationInput): Promise<Partial<FinancialCalculationResult>>;
  healthCheck(): Promise<boolean>;
}

export class PvlibServiceClient implements IPvlibServiceClient {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor(
    baseURL?: string,
    timeout: number = 30000 // 30 segundos
  ) {
    this.baseURL = baseURL || process.env.PVLIB_SERVICE_URL || 'http://localhost:8000';
    this.timeout = timeout;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logging de requests
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[PvlibService] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[PvlibService] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[PvlibService] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.handleAxiosError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Calcula análise financeira avançada completa
   */
  async calculateAdvancedFinancials(
    input: FinancialCalculationInput
  ): Promise<FinancialCalculationResult> {
    try {
      console.log('[PvlibService] Iniciando cálculo financeiro avançado', {
        investimento: input.investimento_inicial,
        geracao_anual: input.geracao_mensal.reduce((a, b) => a + b, 0),
        consumo_anual: input.consumo_mensal.reduce((a, b) => a + b, 0),
      });

      const response = await this.client.post<PvlibServiceResponse<FinancialCalculationResult>>(
        '/api/v1/financial/calculate-advanced',
        input
      );

      if (!response.data.success) {
        throw new PvlibServiceError(
          response.data.message || 'Erro no cálculo financeiro',
          500,
          response.data
        );
      }

      console.log('[PvlibService] Cálculo financeiro concluído com sucesso', {
        vpl: response.data.data.vpl,
        tir: response.data.data.tir,
        payback: response.data.data.payback_simples,
      });

      return response.data.data;
    } catch (error) {
      if (error instanceof PvlibServiceError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      }

      throw new PvlibServiceError(
        'Erro inesperado no cálculo financeiro',
        500,
        error
      );
    }
  }

  /**
   * Calcula análise financeira simplificada (apenas indicadores principais)
   */
  async calculateSimpleFinancials(
    input: FinancialCalculationInput
  ): Promise<Partial<FinancialCalculationResult>> {
    try {
      console.log('[PvlibService] Iniciando cálculo financeiro simplificado');

      const response = await this.client.post<PvlibServiceResponse<Partial<FinancialCalculationResult>>>(
        '/api/v1/financial/calculate-simple',
        input
      );

      if (!response.data.success) {
        throw new PvlibServiceError(
          response.data.message || 'Erro no cálculo financeiro',
          500,
          response.data
        );
      }

      console.log('[PvlibService] Cálculo simplificado concluído');

      return response.data.data;
    } catch (error) {
      if (error instanceof PvlibServiceError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      }

      throw new PvlibServiceError(
        'Erro inesperado no cálculo financeiro simplificado',
        500,
        error
      );
    }
  }

  /**
   * Verifica se o serviço Python está disponível
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 5000, // 5 segundos para health check
      });

      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      console.warn('[PvlibService] Health check falhou:', error);
      return false;
    }
  }

  /**
   * Trata erros do Axios e converte para exceções customizadas
   */
  private handleAxiosError(error: AxiosError): never {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('[PvlibService] Serviço Python indisponível');
      throw new PvlibServiceUnavailableError();
    }

    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;

      if (status === 400) {
        throw new PvlibValidationError(
          data.detail || 'Erro de validação nos dados de entrada',
          data
        );
      }

      if (status === 422) {
        throw new PvlibValidationError(
          'Dados de entrada inválidos',
          data.detail
        );
      }

      throw new PvlibServiceError(
        data.detail || data.message || 'Erro no serviço de cálculos',
        status,
        data
      );
    }

    throw new PvlibServiceError(
      error.message || 'Erro de comunicação com serviço Python',
      500,
      error
    );
  }
}