/**
 * Serviço para comunicação com API de análise BESS
 *
 * Este serviço encapsula todas as chamadas HTTP relacionadas à análise
 * de sistemas híbridos Solar + BESS.
 *
 * Endpoints:
 * - POST /bess-analysis/calculate-hybrid: Calcula sistema híbrido completo
 * - GET /bess-analysis/health: Health check do serviço BESS
 */

import { api } from './api';
import {
  HybridDimensioningRequest,
  HybridCalculationApiResponse,
  HybridDimensioningResponse,
  BessHealthCheckResponse,
} from '../types/bess';
import { FrontendCalculationLogger } from './calculationLogger';

// Logger específico para BESS
const bessLogger = new FrontendCalculationLogger('bess-analysis');

/**
 * Calcula sistema híbrido Solar + BESS completo
 *
 * Este método chama o backend Node.js que por sua vez chama o serviço Python
 * para executar:
 * 1. Cálculo de geração solar (PVLIB ModelChain)
 * 2. Simulação de operação BESS (8760 horas)
 * 3. Análise financeira integrada (VPL, TIR, Payback)
 * 4. Comparação de cenários (sem sistema, só solar, só BESS, híbrido)
 *
 * @param request - Parâmetros do sistema híbrido
 * @returns Resultado completo com análise integrada
 * @throws Error se a chamada falhar
 *
 * @example
 * ```typescript
 * const result = await calculateHybridSystem({
 *   sistema_solar: {
 *     lat: -15.7942,
 *     lon: -47.8822,
 *     origem_dados: 'PVGIS',
 *     // ... outros parâmetros
 *   },
 *   capacidade_kwh: 100,
 *   potencia_kw: 50,
 *   tarifa: {
 *     tipo: 'branca',
 *     tarifa_ponta_kwh: 1.20,
 *     tarifa_fora_ponta_kwh: 0.50,
 *   },
 *   estrategia: 'arbitragem',
 *   custo_kwh_bateria: 3000,
 *   taxa_desconto: 0.08,
 *   vida_util_anos: 10,
 * });
 * ```
 */
export async function calculateHybridSystem(
  request: HybridDimensioningRequest
): Promise<HybridCalculationApiResponse> {
  const startTime = Date.now();

  try {
    bessLogger.calculation('Hybrid System Calculation', 'Starting calculation', 'Hybrid system calculation started', {
      capacidade_kwh: request.capacidade_kwh,
      potencia_kw: request.potencia_kw,
      estrategia: request.estrategia || 'arbitragem',
      lat: request.sistema_solar.lat,
      lon: request.sistema_solar.lon,
    });



    // Chamar endpoint do backend Node.js
    // POST /api/v1/bess-analysis/calculate-hybrid
    // Timeout: 5 minutos (cálculo pode ser demorado)
    const response = await api.post<HybridCalculationApiResponse>(
      '/bess-analysis/calculate-hybrid',
      request,
      {
        timeout: 300000, // 5 minutos
      }
    );

    const duration = Date.now() - startTime;

    bessLogger.result('Hybrid System Calculation', `Completed in ${duration}ms`, { duration });

    // 🔍 Logs para debug da resposta da API
    console.log('🔍 calculateHybridSystem - Resposta completa da API:', response.data);
    console.log('🔍 calculateHybridSystem - Sistema solar da resposta:', response.data.sistema_solar);
    console.log('🔍 calculateHybridSystem - Potência na resposta:', response.data.sistema_solar?.potenciaTotalKwp);
    console.log('🔍 calculateHybridSystem - Energia na resposta:', response.data.sistema_solar?.energiaAnualKwh);

    return response.data;

  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível verificar o status do serviço BESS'
    );
  }
}

/**
 * Valida os parâmetros de entrada antes de enviar para o backend
 *
 * Executa validações básicas no frontend para fornecer feedback rápido
 * ao usuário sem necessidade de chamada ao backend.
 *
 * @param request - Parâmetros a serem validados
 * @returns Array de erros de validação (vazio se válido)
 *
 * @example
 * ```typescript
 * const errors = validateHybridRequest(request);
 * if (errors.length > 0) {
 *   // Erros de validação encontrados
 * }
 * ```
 */
export function validateHybridRequest(
  request: Partial<HybridDimensioningRequest>
): string[] {
  const errors: string[] = [];

  // Validar sistema solar
  if (!request.sistema_solar) {
    errors.push('Parâmetros do sistema solar são obrigatórios');
  } else {
    if (!request.sistema_solar.lat || !request.sistema_solar.lon) {
      errors.push('Latitude e longitude são obrigatórias');
    }
    if (!request.sistema_solar.inversores || request.sistema_solar.inversores.length === 0) {
      errors.push('Pelo menos um inversor deve ser configurado');
    }
  }

  // Validar BESS
  if (!request.capacidade_kwh || request.capacidade_kwh <= 0) {
    errors.push('Capacidade da bateria deve ser maior que zero');
  }
  if (!request.potencia_kw || request.potencia_kw <= 0) {
    errors.push('Potência do inversor BESS deve ser maior que zero');
  }

  // Validar relação potência/capacidade (C-rate)
  if (request.capacidade_kwh && request.potencia_kw) {
    const cRate = request.potencia_kw / request.capacidade_kwh;
    if (cRate > 3) {
      errors.push(
        `C-rate muito alto (${cRate.toFixed(2)}C). Potência do inversor não deve exceder 3x a capacidade da bateria`
      );
    }
    if (cRate < 0.1) {
      errors.push(
        `C-rate muito baixo (${cRate.toFixed(2)}C). Potência do inversor muito baixa em relação à capacidade da bateria`
      );
    }
  }

  // Validar tarifa
  if (!request.tarifa) {
    errors.push('Estrutura tarifária é obrigatória');
  } else {
    if (!request.tarifa.tipo) {
      errors.push('Tipo de tarifa é obrigatório');
    }
    if (request.tarifa.tipo === 'branca' || request.tarifa.tipo === 'azul') {
      if (!request.tarifa.tarifa_ponta_kwh) {
        errors.push('Tarifa ponta é obrigatória para tarifa branca/azul');
      }
      if (!request.tarifa.tarifa_fora_ponta_kwh) {
        errors.push('Tarifa fora ponta é obrigatória para tarifa branca/azul');
      }
    }
  }

  // Validar parâmetros econômicos
  if (request.taxa_desconto !== undefined && (request.taxa_desconto < 0 || request.taxa_desconto > 1)) {
    errors.push('Taxa de desconto deve estar entre 0 e 1 (0% a 100%)');
  }

  if (request.vida_util_anos !== undefined && (request.vida_util_anos < 1 || request.vida_util_anos > 30)) {
    errors.push('Vida útil deve estar entre 1 e 30 anos');
  }

  return errors;
}

/**
 * Exporta objeto com todos os métodos do serviço
 */
export const BessAnalysisService = {
  calculateHybridSystem,
  validateHybridRequest,
};

export default BessAnalysisService;
