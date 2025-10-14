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
import { CalculateHybridSystemUseCase } from '@/application/use-cases/hybrid/CalculateHybridSystemUseCase';
import { BaseController } from './BaseController';

/**
 * Controller para análise de sistemas BESS
 */
export class BessAnalysisController extends BaseController {
  constructor(
    private bessClient: BessCalculationClient,
    private calculateHybridSystemUseCase: CalculateHybridSystemUseCase
  ) {
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
      // ETAPA 1: VALIDAR E MAPEAR PARÂMETROS DE ENTRADA
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

      // Mapear request para o formato do use case
      const hybridSystemRequest = {
        location: {
          latitude: requestBody.sistema_solar.lat || 0,
          longitude: requestBody.sistema_solar.lon || 0
        },
        pvSystem: {
          peakPower: requestBody.sistema_solar.inversores?.[0]?.orientacoes?.[0]?.modulos_por_string || 0,
          tilt: requestBody.sistema_solar.inversores?.[0]?.orientacoes?.[0]?.inclinacao || 0,
          azimuth: requestBody.sistema_solar.inversores?.[0]?.orientacoes?.[0]?.orientacao || 0,
          systemLoss: 14, // Valor padrão
          performanceRatio: 0.75 // Valor padrão
        },
        bessSystem: {
          capacity: requestBody.capacidade_kwh,
          maxChargePower: requestBody.potencia_kw,
          maxDischargePower: requestBody.potencia_kw,
          efficiency: requestBody.eficiencia_roundtrip || 90,
          depthOfDischarge: (requestBody.profundidade_descarga_max || 0.8) * 100,
          initialSOC: (requestBody.soc_inicial || 0.5) * 100
        },
        loadProfile: {
          dailyConsumption: requestBody.sistema_solar.consumo_mensal_kwh?.[0] || 0,
          peakDemand: 0, // Valor padrão
          loadProfile: Array(24).fill(0) // Valor padrão
        },
        economicParameters: {
          electricityPrice: requestBody.tarifa?.tarifa_ponta_kwh || 0,
          feedInTariff: requestBody.tarifa?.tarifa_fora_ponta_kwh || 0,
          discountRate: (requestBody.taxa_desconto || 12) / 100,
          projectLifespan: 25
        }
      };

      // =====================================================================
      // ETAPA 2: EXECUTAR USE CASE DE CÁLCULO HÍBRIDO
      // =====================================================================

      const result = await this.calculateHybridSystemUseCase.execute(hybridSystemRequest);
      const duration = Date.now() - startTime;

      if (!result.isSuccess) {
        return this.badRequest(res, result.error!);
      }

      return this.ok(res, {
        success: true,
        data: result.value!,
        metadata: {
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          calculationMethod: result.value!.metadata.calculationMethod
        },
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.error('❌ Erro no cálculo de sistema híbrido:', {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });

      // Verificar tipo de erro e retornar status code apropriado
      if (error.message?.includes('400') || error.message?.includes('validação')) {
        return this.badRequest(res, 'Erro de validação nos parâmetros de entrada');
      } else if (error.message?.includes('422') || error.message?.includes('cálculo')) {
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
