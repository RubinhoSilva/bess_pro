/**
 * Rotas para análise de sistemas BESS (Battery Energy Storage System)
 *
 * Endpoints disponíveis:
 * - POST /api/v1/bess-analysis/calculate-hybrid: Calcula sistema híbrido Solar + BESS
 * - GET /api/v1/bess-analysis/health: Health check do serviço BESS
 *
 * Todas as rotas requerem autenticação JWT (exceto health check)
 */

import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { BessAnalysisController } from '../controllers/BessAnalysisController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export const createBessAnalysisRoutes = (container: Container): Router => {
  const router = Router();

  // Get controller instance from DI container
  const bessAnalysisController = container.resolve<BessAnalysisController>('BessAnalysisController');

  // Create auth middleware instance
  const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');

  /**
   * POST /api/v1/bess-analysis/calculate-hybrid
   *
   * Calcula sistema híbrido Solar + BESS completo
   *
   * Este endpoint executa um cálculo complexo que envolve:
   * 1. Cálculo de geração solar (PVLIB ModelChain)
   * 2. Simulação de operação BESS (8760 horas)
   * 3. Análise financeira integrada (VPL, TIR, Payback)
   * 4. Comparação de cenários (sem sistema, só solar, só BESS, híbrido)
   *
   * Requer autenticação: Sim
   * Timeout: 5 minutos (cálculo pode ser demorado)
   */
  router.post(
    '/calculate-hybrid',
    authMiddleware.authenticate(),
    bessAnalysisController.calculateHybridSystem.bind(bessAnalysisController)
  );

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
   * Requer autenticação: Não (útil para monitoramento)
   */
  router.get(
    '/health',
    bessAnalysisController.healthCheck.bind(bessAnalysisController)
  );

  return router;
};
