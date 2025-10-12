import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateSolarModuleUseCase } from '../../application/use-cases/equipment/CreateSolarModuleUseCase';
import { GetSolarModulesUseCase } from '../../application/use-cases/equipment/GetSolarModulesUseCase';
import { UpdateSolarModuleUseCase } from '../../application/use-cases/equipment/UpdateSolarModuleUseCase';
import { DeleteSolarModuleUseCase } from '../../application/use-cases/equipment/DeleteSolarModuleUseCase';
import { GetSolarModuleByIdUseCase } from '../../application/use-cases/equipment/GetSolarModuleByIdUseCase';
import { 
  CreateModuleRequest,
  UpdateModuleRequest,
  DeleteModuleRequest
} from '@bess-pro/shared';

/**
 * Solar Module Controller - Usando diretamente @bess-pro/shared
 */
export class SolarModuleController extends BaseController {

  constructor(
    private createSolarModuleUseCase: CreateSolarModuleUseCase,
    private getSolarModulesUseCase: GetSolarModulesUseCase,
    private getSolarModuleByIdUseCase: GetSolarModuleByIdUseCase,
    private updateSolarModuleUseCase: UpdateSolarModuleUseCase,
    private deleteSolarModuleUseCase: DeleteSolarModuleUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      
      const request: CreateModuleRequest & { userId: string } = {
        ...req.body,
        userId
      };
      
      const result = await this.createSolarModuleUseCase.execute(request);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserIdOptional(req) || 'system';
      
      const query = {
        userId,
        model: req.query.model as string,
        minPower: req.query.minPower ? parseFloat(req.query.minPower as string) : undefined,
        maxPower: req.query.maxPower ? parseFloat(req.query.maxPower as string) : undefined,
        minEfficiency: req.query.minEfficiency ? parseFloat(req.query.minEfficiency as string) : undefined,
        cellType: req.query.cellType as string,
        technology: req.query.technology as string,
        manufacturerId: req.query.manufacturerId as string,
        searchTerm: req.query.searchTerm as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
      
      const result = await this.getSolarModulesUseCase.execute(query);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.findAll:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      
      const request: UpdateModuleRequest & { userId: string } = {
        id: req.params.id,
        ...req.body,
        userId
      };
      
      const result = await this.updateSolarModuleUseCase.execute(request);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.update:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      
      const request: DeleteModuleRequest & { userId: string } = {
        id: req.params.id,
        userId
      };
      
      const result = await this.deleteSolarModuleUseCase.execute(request);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.delete:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { id } = req.params;

      const request = {
        id,
        userId
      };

      const result = await this.getSolarModuleByIdUseCase.execute(request);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.findById:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }
}