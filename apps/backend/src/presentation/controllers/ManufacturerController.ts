import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateManufacturerUseCase } from '../../application/use-cases/manufacturer/CreateManufacturerUseCase';
import { GetManufacturersUseCase } from '../../application/use-cases/manufacturer/GetManufacturersUseCase';
import { GetManufacturerByIdUseCase } from '../../application/use-cases/manufacturer/GetManufacturerByIdUseCase';
import { UpdateManufacturerUseCase } from '../../application/use-cases/manufacturer/UpdateManufacturerUseCase';
import { DeleteManufacturerUseCase } from '../../application/use-cases/manufacturer/DeleteManufacturerUseCase';
import { 
  CreateManufacturerRequestBackend, 
  CreateManufacturerCommand 
} from '../../application/dtos/input/manufacturer/CreateManufacturerRequest';
import { GetManufacturersQuery } from '../../application/dtos/input/manufacturer/GetManufacturersQuery';
import { 
  UpdateManufacturerRequestBackend,
  UpdateManufacturerCommand 
} from '../../application/dtos/input/manufacturer/UpdateManufacturerRequest';
import { DeleteManufacturerCommand } from '../../application/dtos/input/manufacturer/DeleteManufacturerCommand';
import { ManufacturerType } from '../../domain/entities/Manufacturer';

/**
 * Manufacturer Controller - Usando novos DTOs alinhados com @bess-pro/shared
 * 
 * Mantém compatibilidade com a API atual enquanto usa os novos DTOs internamente.
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
      const userId = this.extractUserId(req);
      const user = (req as any).user;
      const teamId = user?.teamId;
      
      // Verificar se o request body está no formato novo (shared) ou antigo (command)
      let request: CreateManufacturerRequestBackend;
      
      if (this.isNewFormatRequest(req.body)) {
        // Formato novo (alinhado com shared types)
        request = {
          ...req.body,
          userId,
          teamId
        };
      } else {
        // Formato antigo (command) - converter para novo formato
        const command: CreateManufacturerCommand = {
          ...req.body,
          userId,
          teamId
        };
        request = this.convertCreateCommandToRequest(command);
      }
      
      // Converter para o formato esperado pelo use case (se necessário)
      const result = await this.createManufacturerUseCase.execute(request as any);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserIdOptional(req) || 'system'; // Allow public access with default
      const user = (req as any).user;
      const teamId = user?.teamId;
      
      const query: GetManufacturersQuery = {
        userId,
        teamId,
        // ManufacturerFilters (shared types)
        search: req.query.search as string,
        country: req.query.country as string,
        specialties: req.query.specialties ? (req.query.specialties as string).split(',') : undefined,
        markets: req.query.markets ? (req.query.markets as string).split(',') : undefined,
        certifications: req.query.certifications ? (req.query.certifications as string).split(',') : undefined,
        foundedYearRange: req.query.foundedYearMin || req.query.foundedYearMax ? {
          min: req.query.foundedYearMin ? parseInt(req.query.foundedYearMin as string) : undefined,
          max: req.query.foundedYearMax ? parseInt(req.query.foundedYearMax as string) : undefined
        } : undefined,
        hasWebsite: req.query.hasWebsite ? req.query.hasWebsite === 'true' : undefined,
        hasSupport: req.query.hasSupport ? req.query.hasSupport === 'true' : undefined,
        status: req.query.status as 'active' | 'inactive' | 'all',

        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
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
      const userId = this.extractUserId(req);
      const user = (req as any).user;
      const teamId = user?.teamId;
      
      // Verificar se o request body está no formato novo (shared) ou antigo (command)
      let request: UpdateManufacturerRequestBackend;
      
      if (this.isNewFormatUpdateRequest(req.body)) {
        // Formato novo (alinhado com shared types)
        request = {
          id: req.params.id,
          ...req.body,
          userId,
          teamId
        };
      } else {
        // Formato antigo (command) - converter para novo formato
        const command: UpdateManufacturerCommand = {
          userId,
          teamId,
          id: req.params.id,
          ...req.body
        };
        request = this.convertUpdateCommandToRequest(command);
      }
      
      // Converter para o formato esperado pelo use case (se necessário)
      const result = await this.updateManufacturerUseCase.execute(request as any);
      
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

  // === Métodos Auxiliares ===

  /**
   * Verifica se o request está no formato novo (shared types)
   */
  private isNewFormatRequest(body: any): boolean {
    return body.name && (body.email !== undefined || body.phone !== undefined);
  }

  /**
   * Verifica se o request de update está no formato novo (shared types)
   */
  private isNewFormatUpdateRequest(body: any): boolean {
    return body.name !== undefined || 
           body.email !== undefined || 
           body.phone !== undefined ||
           body.specialties !== undefined;
  }

  /**
   * Converte CreateCommand para CreateRequest (compatibilidade)
   */
  private convertCreateCommandToRequest(command: CreateManufacturerCommand): CreateManufacturerRequestBackend {
    return {
      userId: command.userId,
      teamId: command.teamId,
      name: command.name,
      description: command.description,
      website: command.website,
      email: command.contact?.email,
      phone: command.contact?.phone,
      address: command.contact?.address,
      foundedYear: command.business?.foundedYear,
      headquarters: command.business?.headquarters,
      specialties: command.metadata?.specialties || [],
      markets: command.metadata?.markets || [],
      certifications: command.certifications || [],
      logoUrl: command.metadata?.logoUrl,
      imageUrl: command.metadata?.imageUrl,

    };
  }

  /**
   * Converte UpdateCommand para UpdateRequest (compatibilidade)
   */
  private convertUpdateCommandToRequest(command: UpdateManufacturerCommand): UpdateManufacturerRequestBackend {
    const request: any = {
      id: command.id,
      userId: command.userId,
      teamId: command.teamId
    };

    // Mapear campos do formato antigo para o novo (usando any para contornar readonly)
    if (command.name !== undefined) request.name = command.name;
    if (command.description !== undefined) request.description = command.description;
    if (command.website !== undefined) request.website = command.website;
    
    if (command.contact?.email !== undefined || command.contact?.phone !== undefined ||
        command.contact?.address !== undefined) {
      request.email = command.contact?.email;
      request.phone = command.contact?.phone;
      request.address = command.contact?.address;
    }
    
    if (command.business?.foundedYear !== undefined || command.business?.headquarters !== undefined) {
      request.foundedYear = command.business?.foundedYear;
      request.headquarters = command.business?.headquarters;
    }
    
    if (command.metadata?.specialties !== undefined || command.metadata?.markets !== undefined ||
        command.metadata?.logoUrl !== undefined || command.metadata?.imageUrl !== undefined) {
      request.specialties = command.metadata?.specialties;
      request.markets = command.metadata?.markets;
      request.logoUrl = command.metadata?.logoUrl;
      request.imageUrl = command.metadata?.imageUrl;
    }
    
    if (command.certifications !== undefined) request.certifications = command.certifications;
    if (command.status !== undefined) request.status = command.status;

    return request as UpdateManufacturerRequestBackend;
  }
}