/**
 * Response adapter for solar analysis
 * 
 * Converts between Python PVLIB responses and frontend format
 */

import { 
  PythonPvlibResponse,
  PythonIrradiationResponse,
  PythonFinancialResponse,
  PythonMPPTResponse,
  SolarAnalysisResult,
  AdvancedModulesResult,
  MonthlyIrradiationResult,
  FinancialAnalysisResult,
  MPPTLimitsResult,
  CompleteSystemResult,
  SolarAnalysisError
} from '../../types/solar-analysis';

/**
 * Adapter functions for response formatting
 */

/**
 * Converte resposta Python para formato frontend
 */
export function pythonToFrontend(
  pythonResponse: PythonPvlibResponse,
  originalRequest: any
): AdvancedModulesResult {
  return {
    success: true,
    data: {
      num_modulos: pythonResponse.num_modulos,
      potencia_total_kw: pythonResponse.potencia_total_kwp,
      energia_por_modulo_kwh: pythonResponse.energia_por_modulo,
      energia_total_anual_kwh: pythonResponse.energia_anual_kwh,
      energia_dc_anual_kwh: pythonResponse.energia_dc_anual_kwh,
      perda_clipping_kwh: pythonResponse.perda_clipping_kwh,
      perda_clipping_pct: pythonResponse.perda_clipping_pct,
      geracao_mensal_kwh: pythonResponse.geracao_mensal_kwh,
      consumo_anual_kwh: pythonResponse.consumo_anual_kwh,
      yield_especifico: pythonResponse.yield_especifico,
      cobertura_percentual: pythonResponse.cobertura_percentual,
      fator_capacidade: pythonResponse.fator_capacidade,
      pr_total: pythonResponse.pr_total,
      hsp_equivalente_dia: pythonResponse.hsp_equivalente_dia,
      hsp_equivalente_anual: pythonResponse.hsp_equivalente_anual,
      energia_anual_std: pythonResponse.energia_anual_std,
      variabilidade_percentual: pythonResponse.variabilidade_percentual,
      energia_por_ano: pythonResponse.energia_por_ano,
      energia_diaria_media: pythonResponse.energia_diaria_media,
      energia_diaria_std: pythonResponse.energia_diaria_std,
      energia_diaria_min: pythonResponse.energia_diaria_min,
      energia_diaria_max: pythonResponse.energia_diaria_max,
      compatibilidade_sistema: pythonResponse.compatibilidade_sistema,
      area_necessaria_m2: pythonResponse.area_necessaria_m2,
      peso_total_kg: pythonResponse.peso_total_kg,
      economia_anual_co2: pythonResponse.economia_anual_co2,
      perdas_detalhadas: pythonResponse.perdas_detalhadas,
      parametros_completos: pythonResponse.parametros_completos,
      dados_processados: pythonResponse.dados_processados,
      anos_analisados: pythonResponse.anos_analisados,
      periodo_dados: pythonResponse.periodo_dados,
      inversores: pythonResponse.inversores,
      // Mantém compatibilidade com formato atual do frontend
      aguas_telhado: originalRequest.aguasTelhado
    },
    timestamp: new Date().toISOString(),
    message: 'Cálculo avançado de módulos realizado com sucesso'
  };
}

/**
 * Converte resposta de irradiação para formato frontend
 */
export function irradiationToFrontend(
  pythonResponse: PythonIrradiationResponse
): MonthlyIrradiationResult {
  return {
    success: true,
    data: {
      irradiacaoMensal: pythonResponse.irradiacao_mensal,
      mediaAnual: pythonResponse.media_anual,
      maximo: pythonResponse.maximo,
      minimo: pythonResponse.minimo,
      variacaoSazonal: pythonResponse.variacao_sazonal,
      configuracao: pythonResponse.configuracao,
      coordenadas: pythonResponse.coordenadas,
      periodoAnalise: pythonResponse.periodo_analise,
      registrosProcessados: pythonResponse.registros_processados,
      fonteDados: pythonResponse.configuracao.fonte_dados,
      message: `Dados de irradiação obtidos com sucesso de ${pythonResponse.configuracao.fonte_dados} para ${pythonResponse.coordenadas.lat.toFixed(4)}, ${pythonResponse.coordenadas.lon.toFixed(4)}`
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Converte resposta financeira para formato frontend
 */
export function financialToFrontend(
  pythonResponse: PythonFinancialResponse
): FinancialAnalysisResult {
  return {
    success: true,
    data: {
      investimento_inicial: pythonResponse.vpl, // Ajustar conforme necessário
      vpl: pythonResponse.vpl,
      tir: pythonResponse.tir,
      payback_simples: pythonResponse.payback_simples,
      payback_descontado: pythonResponse.payback_descontado,
      economia_total_25_anos: pythonResponse.economia_total_25_anos,
      economia_anual_media: pythonResponse.economia_anual_media,
      lucratividade_index: pythonResponse.lucratividade_index,
      cash_flow: pythonResponse.cash_flow,
      indicadores: pythonResponse.indicadores,
      sensibilidade: pythonResponse.sensibilidade,
      cenarios: pythonResponse.cenarios
    },
    timestamp: new Date().toISOString(),
    message: 'Análise financeira avançada calculada com sucesso'
  };
}

/**
 * Converte resposta MPPT para formato frontend
 */
export function mpptToFrontend(
  pythonResponse: PythonMPPTResponse
): MPPTLimitsResult {
  return {
    success: true,
    data: pythonResponse,
    timestamp: new Date().toISOString(),
    message: 'Cálculo de limites MPPT realizado com sucesso'
  };
}

/**
 * Converte resposta de sistema completo para formato frontend
 */
export function completeSystemToFrontend(
  pythonResponse: PythonPvlibResponse
): CompleteSystemResult {
  return {
    success: true,
    data: pythonResponse,
    timestamp: new Date().toISOString(),
    message: 'Cálculo completo do sistema solar realizado com sucesso'
  };
}

/**
 * Formata erro para resposta padrão
 */
export function errorToFrontend(
  error: any,
  endpoint: string
): SolarAnalysisError {
  return {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Erro interno no processamento',
      details: error.details || error.response?.data || error,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}

/**
 * Cria resposta de sucesso genérica
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SolarAnalysisResult {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    message: message || 'Operação realizada com sucesso'
  };
}

/**
 * Cria resposta de erro genérica
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): SolarAnalysisError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}

/**
 * Valida resposta do Python
 */
export function validatePythonResponse(
  response: any,
  expectedType: 'pvlib' | 'irradiation' | 'financial' | 'mppt'
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!response) {
    errors.push('Resposta vazia recebida do serviço Python');
    return { isValid: false, errors };
  }

  switch (expectedType) {
    case 'pvlib':
      if (!response.potencia_total_kwp && !response.num_modulos) {
        errors.push('Resposta PVLIB incompleta: falta potencia_total_kwp ou num_modulos');
      }
      break;
      
    case 'irradiation':
      if (!response.irradiacao_mensal || !Array.isArray(response.irradiacao_mensal)) {
        errors.push('Resposta de irradiação incompleta: falta irradiacao_mensal');
      }
      break;
      
    case 'financial':
      if (response.vpl === undefined || response.tir === undefined) {
        errors.push('Resposta financeira incompleta: falta VPL ou TIR');
      }
      break;
      
    case 'mppt':
      if (!response.modulos_por_mppt || !Array.isArray(response.modulos_por_mppt)) {
        errors.push('Resposta MPPT incompleta: falta modulos_por_mppt');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gera ID único para requisição
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Limpa dados removendo campos undefined
 */
export function cleanResponseData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(cleanResponseData);
  }

  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanResponseData(value);
      }
    }
    return cleaned;
  }

  return data;
}

/**
 * Adiciona metadados de processamento
 */
export function addProcessingMetadata(
  response: SolarAnalysisResult,
  metadata: {
    executionTime: number;
    dataSource: string;
    processingSteps: string[];
  }
): SolarAnalysisResult {
  return {
    ...response,
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        executionTime: metadata.executionTime,
        dataSource: metadata.dataSource,
        processingSteps: metadata.processingSteps,
        warningsCount: 0,
        errorsCount: 0
      }
    }
  };
}