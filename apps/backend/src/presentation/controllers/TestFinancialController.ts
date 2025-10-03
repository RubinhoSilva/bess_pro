import { Request, Response } from 'express';
import { SimplePvlibServiceClient } from '@/infrastructure/external-apis/SimplePvlibServiceClient';

export class TestFinancialController {
  private pvlibClient: SimplePvlibServiceClient;

  constructor() {
    this.pvlibClient = new SimplePvlibServiceClient('http://host.docker.internal:8110');
  }

  async testIntegration(req: Request, res: Response): Promise<Response> {
    try {
      console.log('[TestFinancialController] Iniciando teste de integração Node.js → Python');

      const testData = {
        investimento_inicial: 10000,
        geracao_mensal: [500, 450, 600, 700, 800, 900, 950, 900, 750, 600, 500, 450],
        consumo_mensal: [400, 380, 420, 450, 500, 550, 580, 560, 480, 420, 400, 380],
        tarifa_energia: 0.75,
        custo_fio_b: 0.05,
        vida_util: 25,
        taxa_desconto: 8.0,
        inflacao_energia: 5.0
      };

      const result = await this.pvlibClient.calculateFinancials(testData);

      console.log('[TestFinancialController] Resultado recebido:', {
        vpl: result.vpl,
        tir: result.tir,
        payback: result.payback_simples
      });

      return res.json({
        success: true,
        message: 'Integração Node.js → Python funcionando!',
        data: result
      });
    } catch (error: any) {
      console.error('[TestFinancialController] Erro na integração:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro na integração',
        error: error.message
      });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const isHealthy = await this.pvlibClient.healthCheck();
      return res.json({
        success: true,
        healthy: isHealthy,
        message: isHealthy ? 'Serviço Python saudável' : 'Serviço Python indisponível'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        healthy: false,
        message: 'Erro ao verificar saúde do serviço',
        error: error.message
      });
    }
  }
}