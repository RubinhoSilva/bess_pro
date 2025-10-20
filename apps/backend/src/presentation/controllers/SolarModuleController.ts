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
      
      const request: CreateModuleRequest = {
        ...req.body,
        teamId: req.body.teamId || (req as any).user?.teamId
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
      // Extrair filters da query string (mesmo padrão do ManufacturerController)
      let filters: any = {};
      if (req.query.filters) {
        if (typeof req.query.filters === 'string') {
          try {
            filters = JSON.parse(req.query.filters);
          } catch (e) {
            console.error('Error parsing filters:', e);
            filters = {};
          }
        } else {
          filters = req.query.filters;
        }
      }

      // Extrair teamId (opcional para acesso público)
      const teamId = this.extractTeamId(req); // Allow public access with default

      // Construir filtros completos
      const completeFilters: any = {
        teamId,
        model: filters.model || req.query.model as string,
        minPower: filters.minPower || (req.query.minPower ? parseFloat(req.query.minPower as string) : undefined),
        maxPower: filters.maxPower || (req.query.maxPower ? parseFloat(req.query.maxPower as string) : undefined),
        minEfficiency: filters.minEfficiency || (req.query.minEfficiency ? parseFloat(req.query.minEfficiency as string) : undefined),
        cellType: filters.cellType || req.query.cellType as string,
        technology: filters.technology || req.query.technology as string,
        manufacturerId: filters.manufacturerId || req.query.manufacturerId as string,
        searchTerm: filters.searchTerm || req.query.searchTerm as string,
        page: filters.page || (req.query.page ? parseInt(req.query.page as string) : undefined),
        pageSize: filters.pageSize || (req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined),
        sortBy: filters.sortBy || req.query.sortBy as string,
        sortOrder: filters.sortOrder || req.query.sortOrder as 'asc' | 'desc'
      };

      console.log('Complete Filters:', completeFilters);
      
      const result = await this.getSolarModulesUseCase.execute({ filters: completeFilters });
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.findAll:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const request: UpdateModuleRequest = {
        id: req.params.id,
        ...req.body,
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
      const request: DeleteModuleRequest = {
        id: req.params.id,
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
      const teamId = req.body.teamId || (req as any).user?.teamId
      const { id } = req.params;

      if (!teamId) {
        return this.badRequest(res, 'TeamId é obrigatório para buscar módulos');
      }

      const request = {
        id,
        teamId
      };

      const result = await this.getSolarModuleByIdUseCase.execute(request);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.findById:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }
}