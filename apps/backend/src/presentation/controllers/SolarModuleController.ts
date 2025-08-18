import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateSolarModuleUseCase } from '../../application/use-cases/equipment/CreateSolarModuleUseCase';
import { GetSolarModulesUseCase } from '../../application/use-cases/equipment/GetSolarModulesUseCase';
import { UpdateSolarModuleUseCase } from '../../application/use-cases/equipment/UpdateSolarModuleUseCase';
import { DeleteSolarModuleUseCase } from '../../application/use-cases/equipment/DeleteSolarModuleUseCase';
import { CreateSolarModuleCommand } from '../../application/dtos/input/equipment/CreateSolarModuleCommand';
import { GetSolarModulesQuery } from '../../application/dtos/input/equipment/GetSolarModulesQuery';
import { UpdateSolarModuleCommand } from '../../application/dtos/input/equipment/UpdateSolarModuleCommand';
import { DeleteSolarModuleCommand } from '../../application/dtos/input/equipment/DeleteSolarModuleCommand';

export class SolarModuleController extends BaseController {

  constructor(
    private createSolarModuleUseCase: CreateSolarModuleUseCase,
    private getSolarModulesUseCase: GetSolarModulesUseCase,
    private updateSolarModuleUseCase: UpdateSolarModuleUseCase,
    private deleteSolarModuleUseCase: DeleteSolarModuleUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const command: CreateSolarModuleCommand = {
        ...req.body,
        userId
      };
      
      const result = await this.createSolarModuleUseCase.execute(command);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserIdOptional(req); // Allow public access
      const query: GetSolarModulesQuery = {
        userId,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        search: req.query.search as string,
        fabricante: req.query.fabricante as string,
        tipoCelula: req.query.tipoCelula as string,
        potenciaMin: req.query.potenciaMin ? parseFloat(req.query.potenciaMin as string) : undefined,
        potenciaMax: req.query.potenciaMax ? parseFloat(req.query.potenciaMax as string) : undefined,
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
      const command: UpdateSolarModuleCommand = {
        userId,
        id: req.params.id,
        ...req.body
      };
      
      const result = await this.updateSolarModuleUseCase.execute(command);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.update:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const command: DeleteSolarModuleCommand = {
        userId,
        id: req.params.id
      };
      
      const result = await this.deleteSolarModuleUseCase.execute(command);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.delete:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }
}