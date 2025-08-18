import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GenerateFinancialReportUseCase } from '@/application/use-cases/report/GenerateFinancialReportUseCase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
export class ReportController extends BaseController {
  constructor(
    private generateFinancialReportUseCase: GenerateFinancialReportUseCase
  ) {
    super();
  }

  async generateFinancialReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      if (!projectId) {
        this.badRequest(res, 'ID do projeto é obrigatório');
        return;
      }

      const {
        totalInvestment,
        geracaoEstimadaMensal,
        consumoMensal,
        tarifaEnergiaB,
        custoFioB,
        vidaUtil,
        inflacaoEnergia,
        taxaDesconto,
        technicalSpecs
      } = req.body;

      // Validações básicas
      if (!totalInvestment || !geracaoEstimadaMensal || !consumoMensal || !tarifaEnergiaB || !custoFioB || !technicalSpecs) {
        this.badRequest(res, 'Parâmetros obrigatórios não informados');
        return;
      }

      if (!Array.isArray(geracaoEstimadaMensal) || geracaoEstimadaMensal.length !== 12) {
        this.badRequest(res, 'Geração mensal deve ser um array com 12 valores');
        return;
      }

      if (!Array.isArray(consumoMensal) || consumoMensal.length !== 12) {
        this.badRequest(res, 'Consumo mensal deve ser um array com 12 valores');
        return;
      }

      const result = await this.generateFinancialReportUseCase.execute({
        projectId,
        userId,
        reportParams: {
          totalInvestment,
          geracaoEstimadaMensal,
          consumoMensal,
          tarifaEnergiaB,
          custoFioB,
          vidaUtil,
          inflacaoEnergia,
          taxaDesconto,
          technicalSpecs
        }
      });

      if (result.isSuccess) {
        this.ok(res, result.value);
      } else {
        this.badRequest(res, result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async generateQuickReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      if (!projectId) {
        this.badRequest(res, 'ID do projeto é obrigatório');
        return;
      }

      // Para relatório rápido, usar valores padrão
      const defaultParams = {
        totalInvestment: 50000,
        geracaoEstimadaMensal: new Array(12).fill(800), // 800 kWh/mês
        consumoMensal: new Array(12).fill(600), // 600 kWh/mês
        tarifaEnergiaB: 0.75, // R$ 0,75/kWh
        custoFioB: 0.25, // R$ 0,25/kWh
        vidaUtil: 25,
        inflacaoEnergia: 8,
        taxaDesconto: 10,
        technicalSpecs: {
          totalPower: 10, // 10 kWp
          moduleCount: 20,
          moduleModel: 'Módulo Padrão 500W',
          inverterModel: 'Inversor Padrão 10kW',
          estimatedGeneration: 15000, // 15.000 kWh/ano
          co2Savings: 1110 // kg CO2/ano
        }
      };

      const result = await this.generateFinancialReportUseCase.execute({
        projectId,
        userId,
        reportParams: defaultParams
      });

      if (result.isSuccess) {
        this.ok(res, result.value);
      } else {
        this.badRequest(res, result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }
}