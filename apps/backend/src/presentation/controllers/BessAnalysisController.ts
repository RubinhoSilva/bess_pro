/**
 * Controller para análise de sistemas BESS (Battery Energy Storage System)
 *
 * Responsável por:
 * - Receber requisições HTTP do frontend
 * - Validar parâmetros de entrada
 * - Chamar o serviço Python de cálculo BESS (via BessCalculationClient)
 * - Retornar resultados formatados
 *
 * Endpoints disponíveis:
 * - POST /calculate-hybrid: Calcula sistema híbrido Solar + BESS completo
 * - GET /health: Health check do serviço BESS
 */

import { Request, Response, NextFunction } from 'express';
import { BessCalculationClient, HybridDimensioningRequest } from '@/infrastructure/external-services/BessCalculationClient';
import { BaseController } from './BaseController';

/**
 * Controller para análise de sistemas BESS
 */
export class BessAnalysisController extends BaseController {
  constructor(private bessClient: BessCalculationClient) {
    super();
  }
  /**
   * POST /api/v1/bess-analysis/calculate-hybrid
   *
   * Calcula sistema híbrido Solar + BESS completo
   *
   * Este endpoint orquestra um cálculo complexo que envolve:
   *
   * 1. **Cálculo Solar (PVLIB ModelChain)**
   *    - Busca dados meteorológicos (PVGIS ou NASA)
   *    - Executa simulação PVLIB multi-inversor
   *    - Retorna geração mensal/anual, PR, yield específico
   *
   * 2. **Simulação BESS (8760 horas)**
   *    - Gera perfil de consumo horário
   *    - Simula operação da bateria hora a hora
   *    - Aplica estratégia (arbitragem, peak shaving, autoconsumo)
   *    - Calcula ciclos equivalentes, SOC médio, economia
   *
   * 3. **Análise Financeira Integrada**
   *    - Calcula fluxos de energia (solar→consumo, solar→BESS, BESS→consumo, rede→consumo)
   *    - Compara 4 cenários: sem sistema, só solar, só BESS, híbrido
   *    - Retorna VPL, TIR, Payback (simples e descontado)
   *    - Calcula autossuficiência energética e taxa de autoconsumo solar
   *
   * Body esperado:
   * {
   *   sistema_solar: { ... }, // Parâmetros do sistema solar (mesmo formato do /solar/calculate)
   *   capacidade_kwh: 100,    // Capacidade da bateria (kWh)
   *   potencia_kw: 50,        // Potência do inversor BESS (kW)
   *   tarifa: { ... },        // Estrutura tarifária
   *   estrategia: "arbitragem", // Estratégia de operação
   *   custo_kwh_bateria: 3000, // R$/kWh
   *   custo_kw_inversor_bess: 1500, // R$/kW
   *   taxa_desconto: 0.08,    // 8%
   *   vida_util_anos: 10
   * }
   *
   * Retorna:
   * {
   *   sistema_solar: { ... },     // Resultados do cálculo solar
   *   sistema_bess: { ... },      // Resultados da simulação BESS
   *   analise_hibrida: {          // Análise integrada
   *     fluxos_energia: { ... },
   *     autossuficiencia: { ... },
   *     retorno_financeiro: { ... },
   *     comparacao_cenarios: { ... }
   *   }
   * }
   */
  async calculateHybridSystem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> {
    const startTime = Date.now();

    try {
      

      // =====================================================================
      // ETAPA 1: VALIDAR PARÂMETROS DE ENTRADA
      // =====================================================================

      const requestBody = req.body as HybridDimensioningRequest;

      // Validações básicas
      if (!requestBody.sistema_solar) {
        console.error('❌ Erro: sistema_solar não fornecido');
        return this.badRequest(res, 'Parâmetros do sistema solar são obrigatórios');
      }

      if (!requestBody.capacidade_kwh || !requestBody.potencia_kw) {
        console.error('❌ Erro: capacidade_kwh ou potencia_kw não fornecidos');
        return this.badRequest(res, 'Capacidade e potência do BESS são obrigatórias');
      }

      if (!requestBody.tarifa) {
        console.error('❌ Erro: tarifa não fornecida');
        return this.badRequest(res, 'Estrutura tarifária é obrigatória');
      }

      

const startTime = Date.now();
      const result = await this.bessClient.calculateHybridSystem(requestBody);
      const duration = Date.now() - startTime;

      return this.ok(res, {
        success: true,
        data: result,
        metadata: {
          duration_ms: duration,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;

      

      // Verificar tipo de erro e retornar status code apropriado
      if (error.message?.includes('400')) {
        return this.badRequest(res, 'Erro de validação nos parâmetros de entrada');
      } else if (error.message?.includes('422')) {
        return this.badRequest(res, 'Erro durante o cálculo do sistema híbrido');
      } else if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
        return this.internalServerError(res, 'Serviço de cálculo BESS indisponível');
      } else {
        return this.internalServerError(res, 'Erro interno do servidor');
      }
    }
  }

  /**
   * GET /api/v1/bess-analysis/health
   *
   * Health check do serviço BESS
   *
   * Verifica se:
   * - O backend Node.js está respondendo
   * - O serviço Python está disponível
   * - A comunicação entre Node.js e Python está funcionando
   *
   * Retorna:
   * {
   *   status: "healthy",
   *   backend: "ok",
   *   python_service: {
   *     status: "healthy",
   *     service: "BESS Calculation Service",
   *     version: "1.0.0"
   *   }
   * }
   */
  async healthCheck(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> {
    try {
      console.log('🏥 Health check do serviço BESS');

      // Tentar fazer health check do serviço Python
      const pythonHealth = await this.bessClient.healthCheck();

      console.log('✅ Serviço BESS está saudável');

      return this.ok(res, {
        status: 'healthy',
        backend: 'ok',
        python_service: pythonHealth,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('❌ Health check do serviço BESS falhou:', error);

      return res.status(503).json({
        status: 'unhealthy',
        backend: 'ok',
        python_service: {
          status: 'unavailable',
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
