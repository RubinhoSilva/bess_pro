import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CalculateBessSystemUseCase } from '@/application/use-cases/bess/CalculateBessSystemUseCase';
import { GetBatteryDatabaseUseCase } from '@/application/use-cases/bess/GetBatteryDatabaseUseCase';
import { GetLoadProfileTemplateUseCase } from '@/application/use-cases/bess/GetLoadProfileTemplateUseCase';
import { CompareBatteryConfigurationsUseCase } from '@/application/use-cases/bess/CompareBatteryConfigurationsUseCase';
import { CalculationInputValidator } from '@/application/validators/CalculationInputValidator';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class BessController extends BaseController {
  constructor(
    private calculateBessSystemUseCase: CalculateBessSystemUseCase,
    private getBatteryDatabaseUseCase: GetBatteryDatabaseUseCase,
    private getLoadProfileTemplateUseCase: GetLoadProfileTemplateUseCase,
    private compareBatteryConfigurationsUseCase: CompareBatteryConfigurationsUseCase
  ) {
    super();
  }

  async calculateBessSystem(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // 1. Validar entrada
      const validation = CalculationInputValidator.validateBessCalculation({
        ...req.body,
        projectId: req.params.projectId
      });
      if (!validation.isValid) {
        return this.badRequest(res, validation.errors.join(', '));
      }

      // 2. Extrair dados
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      const { loadProfile, systemParams, simulationDays } = req.body;
      const command = { projectId, userId, loadProfile, systemParams, simulationDays };

      // 3. Executar use case
      const result = await this.calculateBessSystemUseCase.execute(command);

      // 4. Retornar resposta
      return this.handleResult(res, result);

    } catch (error: any) {
      console.error('BESS calculation error:', error);

      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      if (error.message.includes('inválido') || error.message.includes('invalid')) {
        return this.badRequest(res, error.message);
      }

      return this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async getBatteryDatabase(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // 1. Extrair dados
      const userId = req.user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      const command = { userId };

      // 2. Executar use case
      const result = await this.getBatteryDatabaseUseCase.execute(command);

      // 3. Retornar resposta
      return this.handleResult(res, result);

    } catch (error: any) {
      console.error('Get battery database error:', error);

      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      return this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async getLoadProfileTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // 1. Extrair dados
      const userId = req.user?.id;
      const { profileType } = req.query;

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      const command = { userId, profileType: profileType as string };

      // 2. Executar use case
      const result = await this.getLoadProfileTemplateUseCase.execute(command);

      // 3. Retornar resposta
      return this.handleResult(res, result);

    } catch (error: any) {
      console.error('Get load profile template error:', error);

      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      return this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async compareBatteryConfigurations(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // 1. Validar entrada
      const validation = CalculationInputValidator.validateBatteryComparison(req.body);
      if (!validation.isValid) {
        return this.badRequest(res, validation.errors.join(', '));
      }

      // 2. Extrair dados
      const userId = req.user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Usuário não autenticado');
      }

      const { configurations } = req.body;
      const command = { userId, configurations };

      // 3. Executar use case
      const result = await this.compareBatteryConfigurationsUseCase.execute(command);

      // 4. Retornar resposta
      return this.handleResult(res, result);

    } catch (error: any) {
      console.error('Compare battery configurations error:', error);

      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      if (error.message.includes('inválido') || error.message.includes('invalid')) {
        return this.badRequest(res, error.message);
      }

      return this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }
}