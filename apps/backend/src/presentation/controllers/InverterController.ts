import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateInverterUseCase } from '../../application/use-cases/equipment/CreateInverterUseCase';
import { GetInvertersUseCase } from '../../application/use-cases/equipment/GetInvertersUseCase';
import { GetInverterByIdUseCase } from '../../application/use-cases/equipment/GetInverterByIdUseCase';
import { UpdateInverterUseCase } from '../../application/use-cases/equipment/UpdateInverterUseCase';
import { DeleteInverterUseCase } from '../../application/use-cases/equipment/DeleteInverterUseCase';
import { 
  CreateInverterRequest,
  UpdateInverterRequest,
  DeleteInverterRequest
} from '@bess-pro/shared';

// Interfaces temporárias para queries
interface GetInvertersQuery {
  teamId: string;
  manufacturer?: string;
  model?: string;
  minPower?: number;
  maxPower?: number;
  gridType?: 'on-grid' | 'off-grid' | 'hybrid';
  minMppts?: number;
  minEfficiency?: number;
  manufacturerId?: string;
  searchTerm?: string;
  search?: string;
  fabricante?: string;
  tipoRede?: string;
  potenciaMin?: number;
  potenciaMax?: number;
  moduleReferencePower?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetInverterByIdQuery {
  id: string;
  teamId: string;
}

/**
 * Inverter Controller - Usando diretamente @bess-pro/shared
 */
export class InverterController extends BaseController {

  constructor(
    private createInverterUseCase: CreateInverterUseCase,
    private getInvertersUseCase: GetInvertersUseCase,
    private getInverterByIdUseCase: GetInverterByIdUseCase,
    private updateInverterUseCase: UpdateInverterUseCase,
    private deleteInverterUseCase: DeleteInverterUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const teamId = this.extractTeamId(req);
      
      const request: CreateInverterRequest & { teamId: string } = {
        ...req.body,
        teamId
      };
      
      const result = await this.createInverterUseCase.execute(request);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const teamId = this.extractTeamId(req); // Allow public access with default
      const query: GetInvertersQuery = {
        teamId,
        // InverterFilters (shared types)
        manufacturer: req.query.manufacturer as string,
        model: req.query.model as string,
        minPower: req.query.minPower ? parseFloat(req.query.minPower as string) : undefined,
        maxPower: req.query.maxPower ? parseFloat(req.query.maxPower as string) : undefined,
        gridType: this.mapTipoRedeToConnectionType(req.query.tipoRede as string) || req.query.gridType as 'on-grid' | 'off-grid' | 'hybrid',
        minMppts: req.query.minMppts ? parseInt(req.query.minMppts as string) : undefined,
        minEfficiency: req.query.minEfficiency ? parseFloat(req.query.minEfficiency as string) : undefined,
        manufacturerId: req.query.manufacturerId as string,
        searchTerm: req.query.searchTerm as string,
        // Compatibilidade com API atual
        search: req.query.search as string,
        fabricante: req.query.fabricante as string,
        tipoRede: req.query.tipoRede as string,
        potenciaMin: req.query.potenciaMin ? parseFloat(req.query.potenciaMin as string) : undefined,
        potenciaMax: req.query.potenciaMax ? parseFloat(req.query.potenciaMax as string) : undefined,
        moduleReferencePower: req.query.moduleReferencePower ? parseFloat(req.query.moduleReferencePower as string) : undefined,
        // Paginação
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
      
      const result = await this.getInvertersUseCase.execute(query);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.findAll:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const teamId = this.extractTeamId(req);
      console.log('InverterController.update - Request Body:', req.body);
      
      const request: UpdateInverterRequest & { teamId: string } = {
        id: req.params.id,
        ...req.body,
        teamId
      };

      console.log('InverterController.update - Mapped Request:', request);
      
      const result = await this.updateInverterUseCase.execute(request);
      
      console.log('InverterController.update - UseCase Result:', result);

      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.update:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const teamId = this.extractTeamId(req);
      
      const request: DeleteInverterRequest & { teamId: string } = {
        id: req.params.id,
        teamId
      };
      
      const result = await this.deleteInverterUseCase.execute(request);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.delete:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findById(req: Request, res: Response): Promise<Response> {
    try {
      const teamId = this.extractTeamId(req);
      const { id } = req.params;

      const query: GetInverterByIdQuery = {
        id,
        teamId
      };

      const result = await this.getInverterByIdUseCase.execute(query);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.findById:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }


  /**
   * Mapeia tipoRede (legado) para connectionType (metadata)
   */
  private mapTipoRedeToConnectionType(tipoRede?: string): 'on-grid' | 'off-grid' | 'hybrid' {
    switch (tipoRede?.toLowerCase()) {
      case 'monofasico':
      case 'trifasico':
      case 'on-grid':
        return 'on-grid';
      case 'off-grid':
        return 'off-grid';
      case 'hibrido':
      case 'hybrid':
        return 'hybrid';
      default:
        return 'on-grid';
    }
  }
}