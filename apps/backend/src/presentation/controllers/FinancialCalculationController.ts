import { Request, Response } from 'express';
import { CalculateProjectFinancialsUseCase } from '@/application/use-cases/calculation/CalculateProjectFinancialsUseCase';
import { BaseController } from './BaseController';
import { CalculationInputValidator } from '@/application/validators/CalculationInputValidator';

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
      // 1. Validar entrada
      const validation = CalculationInputValidator.validateFinancialAnalysis({
        ...req.body,
        projectId: req.params.projectId
      });
      if (!validation.isValid) {
        return this.badRequest(res, validation.errors.join(', '));
      }

      // 2. Extrair dados
      const { projectId } = req.params;
      const userId = req.user?.id;
      const financialInput = req.body;
      const saveToProject = req.query.save !== 'false'; // Por padrão, salva

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      const command = {
        projectId,
        userId,
        input: financialInput,
        saveToProject,
      };

      // 3. Executar use case
      const result = await this.calculateFinancialsUseCase.execute(command);

      // 4. Retornar resposta
      if (result.success) {
        return this.ok(res, result.data);
      } else {
        return this.badRequest(res, result.message);
      }

    } catch (error: any) {
      console.error('[FinancialCalculationController] Error:', error);

      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      if (error.message.includes('não encontrado') || error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }

      if (error.message.includes('inválido') || error.message.includes('invalid')) {
        return this.badRequest(res, error.message);
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
      // 1. Extrair dados
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      // 2. Executar use case
      const results = await this.calculateFinancialsUseCase.getLastResults(projectId, userId);

      if (!results) {
        return this.notFound(res, 'Nenhum cálculo financeiro encontrado para este projeto');
      }

      // 3. Retornar resposta
      return this.ok(res, {
        success: true,
        data: results,
        message: 'Resultados financeiros recuperados com sucesso',
      });

    } catch (error: any) {
      console.error('[FinancialCalculationController] Error getting results:', error);

      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      if (error.message.includes('não encontrado') || error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }

      if (error.message.includes('inválido') || error.message.includes('invalid')) {
        return this.badRequest(res, error.message);
      }

      return this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }
}