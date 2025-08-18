import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Container } from '@/infrastructure/di/Container';
import { CalculateSolarSystemUseCase, AnalyzeFinancialUseCase } from '@/application';
import { ServiceTokens } from '@/infrastructure';


export class CalculationController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  async calculateSolarSystem(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const projectId = req.params.projectId;
      const { systemParams, irradiationData } = req.body;

      const useCase = this.container.resolve<CalculateSolarSystemUseCase>(ServiceTokens.CALCULATE_SOLAR_SYSTEM_USE_CASE);
      
      const result = await useCase.execute({
        projectId,
        userId,
        systemParams,
        irradiationData,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Calculate solar system error:', error);
      return this.internalServerError(res, 'Erro ao calcular sistema solar');
    }
  }

  async analyzeFinancial(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const projectId = req.params.projectId;
      const { financialParams } = req.body;

      const useCase = this.container.resolve<AnalyzeFinancialUseCase>(ServiceTokens.ANALYZE_FINANCIAL_USE_CASE);
      
      const result = await useCase.execute({
        projectId,
        userId,
        financialParams,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Analyze financial error:', error);
      return this.internalServerError(res, 'Erro na análise financeira');
    }
  }
}