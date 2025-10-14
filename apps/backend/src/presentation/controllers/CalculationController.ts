import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AnalyzeFinancialUseCase } from '@/application';
import { CalculationInputValidator } from '@/application/validators/CalculationInputValidator';
import { CalculateStandaloneSolarSystemUseCase } from '@/application/use-cases/calculation/CalculateStandaloneSolarSystemUseCase';

export class CalculationController extends BaseController {
  constructor(
    private calculateStandaloneSolarSystemUseCase: CalculateStandaloneSolarSystemUseCase,
    private analyzeFinancialUseCase: AnalyzeFinancialUseCase
  ) {
    super();
  }

  async calculateSolarSystemStandalone(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validar entrada
      const validation = CalculationInputValidator.validateStandaloneSolarCalculation(req.body);
      if (!validation.isValid) {
        return this.badRequest(res, validation.errors.join(', '));
      }

      // 2. Extrair dados
      const userId = this.extractUserId(req);
      const command = { ...req.body, userId };

      // 3. Executar use case
      const result = await this.calculateStandaloneSolarSystemUseCase.execute(command);

      // 4. Retornar resposta
      return this.handleResult(res, result);

    } catch (error) {
      console.error('Calculate solar system standalone error:', error);
      return this.internalServerError(res, 'Erro ao calcular sistema solar');
    }
  }



  async analyzeFinancial(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validar entrada
      const validation = CalculationInputValidator.validateFinancialAnalysis(req.body);
      if (!validation.isValid) {
        return this.badRequest(res, validation.errors.join(', '));
      }

      // 2. Extrair dados
      const userId = this.extractUserId(req);
      const projectId = req.params.projectId;
      const { financialParams } = req.body;
      const command = { projectId, userId, financialParams };

      // 3. Executar use case
      const result = await this.analyzeFinancialUseCase.execute(command);

      // 4. Retornar resposta
      return this.handleResult(res, result);

    } catch (error) {
      console.error('Analyze financial error:', error);
      return this.internalServerError(res, 'Erro na análise financeira');
    }
  }


}