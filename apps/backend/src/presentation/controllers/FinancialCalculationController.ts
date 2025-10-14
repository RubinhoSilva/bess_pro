import { Request, Response } from 'express';
import { CalculateProjectFinancialsUseCase } from '@/application/use-cases/calculation/CalculateProjectFinancialsUseCase';
import { BaseController } from './BaseController';
import { AppError } from '../../shared/errors/AppError';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class FinancialCalculationController extends BaseController {
  constructor(
    private calculateFinancialsUseCase: CalculateProjectFinancialsUseCase
  ) {
    super();
  }

  /**
   * POST /api/v1/projects/:projectId/calculations/financial
   * Calcula análise financeira avançada para o projeto
   */
  async calculateProjectFinancials(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;
      const financialInput = req.body;
      const saveToProject = req.query.save !== 'false'; // Por padrão, salva

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      console.log(`[FinancialCalculationController] Calculating financials for project ${projectId}`, {
        userId,
        investimento: financialInput.investimento_inicial,
      });

      const result = await this.calculateFinancialsUseCase.execute({
        projectId,
        userId,
        input: financialInput,
        saveToProject,
      });

      return this.ok(res, result);
    } catch (error: any) {
      console.error('[FinancialCalculationController] Error:', error);

      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            return this.badRequest(res, error.message);
          case 401:
            return this.unauthorized(res, error.message);
          case 403:
            return this.forbidden(res, error.message);
          case 404:
            return this.notFound(res, error.message);
          default:
            return this.internalServerError(res, error.message);
        }
      }

      return this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  /**
   * GET /api/v1/projects/:projectId/calculations/financial
   * Obtém os últimos resultados financeiros salvos
   */
  async getLastFinancialResults(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      console.log(`[FinancialCalculationController] Getting last financial results for project ${projectId}`);

      const results = await this.calculateFinancialsUseCase.getLastResults(projectId, userId);

      if (!results) {
        return this.notFound(res, 'Nenhum cálculo financeiro encontrado para este projeto');
      }

      return this.ok(res, {
        success: true,
        data: results,
        message: 'Resultados financeiros recuperados com sucesso',
      });
    } catch (error: any) {
      console.error('[FinancialCalculationController] Error getting results:', error);

      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            return this.badRequest(res, error.message);
          case 401:
            return this.unauthorized(res, error.message);
          case 403:
            return this.forbidden(res, error.message);
          case 404:
            return this.notFound(res, error.message);
          default:
            return this.internalServerError(res, error.message);
        }
      }

      return this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }
}