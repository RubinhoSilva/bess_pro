import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateManufacturerUseCase } from '../../application/use-cases/manufacturer/CreateManufacturerUseCase';
import { GetManufacturersUseCase } from '../../application/use-cases/manufacturer/GetManufacturersUseCase';
import { GetManufacturerByIdUseCase } from '../../application/use-cases/manufacturer/GetManufacturerByIdUseCase';
import { UpdateManufacturerUseCase } from '../../application/use-cases/manufacturer/UpdateManufacturerUseCase';
import { DeleteManufacturerUseCase } from '../../application/use-cases/manufacturer/DeleteManufacturerUseCase';
import { CreateManufacturerRequestBackend } from '../../application/dtos/input/manufacturer/CreateManufacturerRequest';
import { GetManufacturersQuery } from '../../application/dtos/input/manufacturer/GetManufacturersQuery';
import { UpdateManufacturerRequestBackend } from '../../application/dtos/input/manufacturer/UpdateManufacturerRequest';
import { DeleteManufacturerCommand } from '../../application/dtos/input/manufacturer/DeleteManufacturerCommand';

/**
 * Manufacturer Controller - Usando DTOs alinhados com @bess-pro/shared
 */
export class ManufacturerController extends BaseController {

  constructor(
    private createManufacturerUseCase: CreateManufacturerUseCase,
    private getManufacturersUseCase: GetManufacturersUseCase,
    private getManufacturerByIdUseCase: GetManufacturerByIdUseCase,
    private updateManufacturerUseCase: UpdateManufacturerUseCase,
    private deleteManufacturerUseCase: DeleteManufacturerUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      
      const request: CreateManufacturerRequestBackend = {
        ...req.body
      };
      
      const result = await this.createManufacturerUseCase.execute(request);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      // Extrair filters da query string
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

      // Validar teamId obrigatório
      const teamId = this.extractTeamId(req); 

      const query: GetManufacturersQuery = {
        teamId,
        // ManufacturerFilters (shared types)
        search: filters.search || req.query.search as string,
        country: filters.country || req.query.country as string,
        specialties: filters.specialties || (req.query.specialties ? (req.query.specialties as string).split(',') : undefined),
        markets: filters.markets || (req.query.markets ? (req.query.markets as string).split(',') : undefined),
        certifications: filters.certifications || (req.query.certifications ? (req.query.certifications as string).split(',') : undefined),
        foundedYearRange: filters.foundedYearRange || (req.query.foundedYearMin || req.query.foundedYearMax ? {
          min: req.query.foundedYearMin ? parseInt(req.query.foundedYearMin as string) : undefined,
          max: req.query.foundedYearMax ? parseInt(req.query.foundedYearMax as string) : undefined
        } : undefined),
        hasWebsite: filters.hasWebsite !== undefined ? filters.hasWebsite : (req.query.hasWebsite ? req.query.hasWebsite === 'true' : undefined),
        hasSupport: filters.hasSupport !== undefined ? filters.hasSupport : (req.query.hasSupport ? req.query.hasSupport === 'true' : undefined),
        status: filters.status || req.query.status as 'active' | 'inactive' | 'all',

        page: filters.page || (req.query.page ? parseInt(req.query.page as string) : undefined),
        pageSize: filters.pageSize || (req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined),
        sortBy: filters.sortBy || req.query.sortBy as string,
        sortOrder: filters.sortOrder || req.query.sortOrder as 'asc' | 'desc'
      };
      
      const result = await this.getManufacturersUseCase.execute(query);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.findAll:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }


  async findById(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.getManufacturerByIdUseCase.execute({
        id: req.params.id
      });
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.findById:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      
      const request: UpdateManufacturerRequestBackend = {
        id: req.params.id,
        ...req.body
      };
      
      const result = await this.updateManufacturerUseCase.execute(request);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.update:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const command: DeleteManufacturerCommand = {
        userId,
        id: req.params.id
      };
      
      const result = await this.deleteManufacturerUseCase.execute(command);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.delete:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }


}