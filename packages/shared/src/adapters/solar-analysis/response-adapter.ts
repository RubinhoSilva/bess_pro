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
  SolarAnalysisError,
  FrontendIrradiationData,
  FrontendPvlibData
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
  // DEBUG: Log completo da resposta Python
  console.log('=== DEBUG PYTHON RESPONSE ===');
  console.log('geracao_por_orientacao recebido:', JSON.stringify(pythonResponse.geracao_por_orientacao, null, 2));
  console.log('geracao_mensal_kwh tipo:', typeof pythonResponse.geracao_mensal_kwh);
  console.log('geracao_mensal_kwh valor:', pythonResponse.geracao_mensal_kwh);
  
  // GARANTIR CLONE PROFUNDO para evitar problemas de referência
  const geracaoPorOrientacaoClonado = JSON.parse(JSON.stringify(pythonResponse.geracao_por_orientacao || {}));
  const inversoresClonados = JSON.parse(JSON.stringify(pythonResponse.inversores || []));
  
  const frontendData: FrontendPvlibData = {
    numModulos: pythonResponse.num_modulos,
    potenciaTotalKwp: pythonResponse.potencia_total_kwp,
    energiaPorModulo: pythonResponse.energia_por_modulo,
    energiaAnualKwh: pythonResponse.energia_anual_kwh,
    energiaDcAnualKwh: pythonResponse.energia_dc_anual_kwh,
    perdaClippingKwh: pythonResponse.perda_clipping_kwh,
    perdaClippingPct: pythonResponse.perda_clipping_pct,
    geracaoMensalKwh: pythonResponse.geracao_mensal_kwh,
    consumoAnualKwh: pythonResponse.consumo_anual_kwh,
    yieldEspecifico: pythonResponse.yield_especifico,
    coberturaPercentual: pythonResponse.cobertura_percentual,
    fatorCapacidade: pythonResponse.fator_capacidade,
    prTotal: pythonResponse.pr_total,
    hspEquivalenteDia: pythonResponse.hsp_equivalente_dia,
    hspEquivalenteAnual: pythonResponse.hsp_equivalente_anual,
    energiaAnualStd: pythonResponse.energia_anual_std,
    variabilidadePercentual: pythonResponse.variabilidade_percentual,
    energiaPorAno: pythonResponse.energia_por_ano,
    energiaDiariaMedia: pythonResponse.energia_diaria_media,
    energiaDiariaStd: pythonResponse.energia_diaria_std,
    energiaDiariaMin: pythonResponse.energia_diaria_min,
    energiaDiariaMax: pythonResponse.energia_diaria_max,
    compatibilidadeSistema: pythonResponse.compatibilidade_sistema,
    areaNecessariaM2: pythonResponse.area_necessaria_m2,
    pesoTotalKg: pythonResponse.peso_total_kg,
    economiaAnualCo2: pythonResponse.economia_anual_co2,
    perdasDetalhadas: pythonResponse.perdas_detalhadas,
    parametrosCompletos: pythonResponse.parametros_completos,
    dadosProcessados: pythonResponse.dados_processados,
    anosAnalisados: pythonResponse.anos_analisados,
    periodoDados: pythonResponse.periodo_dados,
    inversores: inversoresClonados,
    // CAMPO CRÍTICO - Usar clone profundo para garantir serialização
    geracaoPorOrientacao: geracaoPorOrientacaoClonado
  };

  // DEBUG: Log do que será retornado
  console.log('=== DEBUG FRONTEND DATA ===');
  console.log('geracaoPorOrientacao no frontendData:', JSON.stringify(frontendData.geracaoPorOrientacao, null, 2));
  console.log('frontendData completo:', JSON.stringify(frontendData, null, 2));

  const result = {
    success: true,
    data: frontendData,
    timestamp: new Date().toISOString(),
    message: 'Cálculo avançado de módulos realizado com sucesso'
  };

  // DEBUG: Log final
  console.log('=== DEBUG FINAL RESULT ===');
  console.log('Resultado final:', JSON.stringify(result, null, 2));

  return result;
}

/**
 * Converte resposta de irradiação para formato frontend
 */
export function irradiationToFrontend(
  pythonResponse: PythonIrradiationResponse
): MonthlyIrradiationResult {
  const frontendData: FrontendIrradiationData = {
    irradiacaoMensal: pythonResponse.irradiacao_mensal,
    mediaAnual: pythonResponse.media_anual,
    maximo: pythonResponse.maximo,
    minimo: pythonResponse.minimo,
    variacaoSazonal: pythonResponse.variacao_sazonal,
    configuracao: pythonResponse.configuracao,
    coordenadas: pythonResponse.coordenadas,
    periodoAnalise: pythonResponse.periodo_analise,
    registrosProcessados: pythonResponse.registros_processados
  };

  return {
    success: true,
    data: frontendData,
    timestamp: new Date().toISOString(),
    message: `Dados de irradiação obtidos com sucesso de ${pythonResponse.configuracao.fonte_dados} para ${pythonResponse.coordenadas.lat.toFixed(4)}, ${pythonResponse.coordenadas.lon.toFixed(4)}`
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