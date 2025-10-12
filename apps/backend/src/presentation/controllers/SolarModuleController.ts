import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateSolarModuleUseCase } from '../../application/use-cases/equipment/CreateSolarModuleUseCase';
import { GetSolarModulesUseCase } from '../../application/use-cases/equipment/GetSolarModulesUseCase';
import { UpdateSolarModuleUseCase } from '../../application/use-cases/equipment/UpdateSolarModuleUseCase';
import { DeleteSolarModuleUseCase } from '../../application/use-cases/equipment/DeleteSolarModuleUseCase';
import { GetSolarModuleByIdUseCase } from '../../application/use-cases/equipment/GetSolarModuleByIdUseCase';
import { 
  CreateSolarModuleRequest, 
  CreateSolarModuleCommand 
} from '../../application/dtos/input/equipment/CreateSolarModuleRequest';
import { GetSolarModulesQuery } from '../../application/dtos/input/equipment/GetSolarModulesQuery';
import { 
  UpdateSolarModuleRequest,
  UpdateSolarModuleCommand 
} from '../../application/dtos/input/equipment/UpdateSolarModuleRequest';
import { DeleteSolarModuleCommand } from '../../application/dtos/input/equipment/DeleteSolarModuleCommand';
import { GetSolarModuleByIdQuery } from '../../application/dtos/input/equipment/GetSolarModuleByIdQuery';
import { EquipmentCatalogMapper } from '../../application/mappers/EquipmentCatalogMapper';

/**
 * Solar Module Controller - Usando novos DTOs alinhados com @bess-pro/shared
 * 
 * Mantém compatibilidade com a API atual enquanto usa os novos DTOs internamente.
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
      
      // Verificar se o request body está no formato novo (shared) ou antigo (command)
      let request: CreateSolarModuleRequest;
      
      if (this.isNewFormatRequest(req.body)) {
        // Formato novo (alinhado com shared types)
        request = {
          ...req.body,
          userId
        };
      } else {
        // Formato antigo (command) - converter para novo formato
        const command: CreateSolarModuleCommand = {
          ...req.body,
          userId
        };
        request = EquipmentCatalogMapper.legacyCommandToCreateRequest(command);
      }
      
      // Converter para o formato esperado pelo use case (se necessário)
      const result = await this.createSolarModuleUseCase.execute(request as any);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserIdOptional(req) || 'system'; // Allow public access with default
      const query: GetSolarModulesQuery = {
        userId,
        // ModuleFilters (shared types)
        manufacturer: req.query.manufacturer as string,
        model: req.query.model as string,
        minPower: req.query.minPower ? parseFloat(req.query.minPower as string) : undefined,
        maxPower: req.query.maxPower ? parseFloat(req.query.maxPower as string) : undefined,
        minEfficiency: req.query.minEfficiency ? parseFloat(req.query.minEfficiency as string) : undefined,
        cellType: req.query.cellType as string,
        technology: req.query.technology as string,
        manufacturerId: req.query.manufacturerId as string,
        searchTerm: req.query.searchTerm as string,
        // Compatibilidade com API atual
        search: req.query.search as string,
        fabricante: req.query.fabricante as string,
        tipoCelula: req.query.tipoCelula as string,
        potenciaMin: req.query.potenciaMin ? parseFloat(req.query.potenciaMin as string) : undefined,
        potenciaMax: req.query.potenciaMax ? parseFloat(req.query.potenciaMax as string) : undefined,
        // Paginação
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
      
      // Verificar se o request body está no formato novo (shared) ou antigo (command)
      let request: UpdateSolarModuleRequest;
      
      if (this.isNewFormatUpdateRequest(req.body)) {
        // Formato novo (alinhado com shared types)
        request = {
          id: req.params.id,
          ...req.body,
          userId
        };
      } else {
        // Formato antigo (command) - converter para novo formato
        const command: UpdateSolarModuleCommand = {
          userId,
          id: req.params.id,
          ...req.body
        };
        request = this.convertUpdateCommandToRequest(command);
      }
      
      // Converter para o formato esperado pelo use case (se necessário)
      const result = await this.updateSolarModuleUseCase.execute(request as any);
      
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

  async findById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { id } = req.params;

      const query: GetSolarModuleByIdQuery = {
        id,
        userId
      };

      const result = await this.getSolarModuleByIdUseCase.execute(query);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in SolarModuleController.findById:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  // === Métodos Auxiliares ===

  /**
   * Verifica se o request está no formato novo (shared types)
   */
  private isNewFormatRequest(body: any): boolean {
    return body.specifications && body.parameters && body.dimensions;
  }

  /**
   * Verifica se o request de update está no formato novo (shared types)
   */
  private isNewFormatUpdateRequest(body: any): boolean {
    return body.specifications !== undefined || 
           body.parameters !== undefined || 
           body.dimensions !== undefined;
  }

  /**
   * Converte UpdateCommand para UpdateRequest (compatibilidade)
   */
  private convertUpdateCommandToRequest(command: UpdateSolarModuleCommand): UpdateSolarModuleRequest {
    const request: UpdateSolarModuleRequest = {
      id: command.id,
      userId: command.userId
    };

    // Mapear campos do formato antigo para o novo
    if (command.modelo !== undefined) request.model = command.modelo;
    if (command.potenciaNominal !== undefined) request.nominalPower = command.potenciaNominal;
    
    // Specifications
    if (command.vmpp !== undefined || command.impp !== undefined || 
        command.voc !== undefined || command.isc !== undefined ||
        command.eficiencia !== undefined || command.tipoCelula !== undefined ||
        command.numeroCelulas !== undefined || command.technology !== undefined) {
      request.specifications = {
        vmpp: command.vmpp || 0,
        impp: command.impp || 0,
        voc: command.voc || 0,
        isc: command.isc || 0,
        efficiency: command.eficiencia,
        cellType: command.tipoCelula as any,
        numberOfCells: command.numeroCelulas,
        technology: command.technology as any
      };
    }
    
    // Dimensions
    if (command.larguraMm !== undefined || command.alturaMm !== undefined ||
        command.espessuraMm !== undefined || command.pesoKg !== undefined) {
      request.dimensions = {
        widthMm: command.larguraMm || 0,
        heightMm: command.alturaMm || 0,
        thicknessMm: command.espessuraMm || 0,
        weightKg: command.pesoKg || 0
      };
    }
    
    // Parameters
    const hasTemperatureParams = command.tempCoefPmax !== undefined || 
                               command.tempCoefVoc !== undefined || 
                               command.tempCoefIsc !== undefined;
    const hasDiodeParams = command.aRef !== undefined || command.iLRef !== undefined ||
                          command.iORef !== undefined || command.rS !== undefined ||
                          command.rShRef !== undefined;
    const hasSapmParams = command.a0 !== undefined || command.a1 !== undefined ||
                         command.a2 !== undefined || command.a3 !== undefined ||
                         command.a4 !== undefined || command.b0 !== undefined ||
                         command.b1 !== undefined || command.b2 !== undefined ||
                         command.b3 !== undefined || command.b4 !== undefined ||
                         command.dtc !== undefined;
    const hasSpectralParams = command.material !== undefined;
    const hasAdvancedParams = command.alphaSc !== undefined || command.betaOc !== undefined ||
                            command.gammaR !== undefined;

    if (hasTemperatureParams || hasDiodeParams || hasSapmParams || 
        hasSpectralParams || hasAdvancedParams) {
      const parameters: any = {};
      
      if (hasTemperatureParams) {
        parameters.temperature = {
          tempCoeffPmax: command.tempCoefPmax || 0,
          tempCoeffVoc: command.tempCoefVoc || 0,
          tempCoeffIsc: command.tempCoefIsc || 0
        };
      }
      
      if (hasDiodeParams) {
        parameters.diode = {
          aRef: command.aRef || 0,
          iLRef: command.iLRef || 0,
          iORef: command.iORef || 0,
          rS: command.rS || 0,
          rShRef: command.rShRef || 0
        };
      }
      
      if (hasSapmParams) {
        parameters.sapm = {
          a0: command.a0 || 0,
          a1: command.a1 || 0,
          a2: command.a2 || 0,
          a3: command.a3 || 0,
          a4: command.a4 || 0,
          b0: command.b0 || 0,
          b1: command.b1 || 0,
          b2: command.b2 || 0,
          b3: command.b3 || 0,
          b4: command.b4 || 0,
          fd: command.dtc || 0
        };
      }
      
      if (hasSpectralParams) {
        parameters.spectral = {
          material: command.material,
          technology: command.technology
        };
      }
      
      if (hasAdvancedParams) {
        parameters.advanced = {
          alphaSc: command.alphaSc || 0,
          betaOc: command.betaOc || 0,
          gammaR: command.gammaR || 0
        };
      }
      
      request.parameters = parameters;
    }
    
    // Metadata
    if (command.datasheetUrl !== undefined || command.certificacoes !== undefined ||
        command.garantiaAnos !== undefined || command.tolerancia !== undefined) {
      request.metadata = {
        datasheetUrl: command.datasheetUrl,
        certifications: command.certificacoes || [],
        warranty: command.garantiaAnos || 0,
        tolerance: command.tolerancia
      };
    }

    return request;
  }
}