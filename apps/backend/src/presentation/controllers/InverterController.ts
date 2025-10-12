import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateInverterUseCase } from '../../application/use-cases/equipment/CreateInverterUseCase';
import { GetInvertersUseCase } from '../../application/use-cases/equipment/GetInvertersUseCase';
import { GetInverterByIdUseCase } from '../../application/use-cases/equipment/GetInverterByIdUseCase';
import { UpdateInverterUseCase } from '../../application/use-cases/equipment/UpdateInverterUseCase';
import { DeleteInverterUseCase } from '../../application/use-cases/equipment/DeleteInverterUseCase';
import { 
  CreateInverterRequestBackend, 
  CreateInverterCommand 
} from '../../application/dtos/input/equipment/CreateInverterRequest';
import { GetInvertersQuery } from '../../application/dtos/input/equipment/GetInvertersQuery';
import { 
  UpdateInverterRequestBackend,
  UpdateInverterCommand 
} from '../../application/dtos/input/equipment/UpdateInverterRequest';
import { DeleteInverterCommand } from '../../application/dtos/input/equipment/DeleteInverterCommand';
import { GetInverterByIdQuery } from '../../application/dtos/input/equipment/GetInverterByIdQuery';

/**
 * Inverter Controller - Usando novos DTOs alinhados com @bess-pro/shared
 * 
 * Mantém compatibilidade com a API atual enquanto usa os novos DTOs internamente.
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
      const userId = this.extractUserId(req);
      
      // Verificar se o request body está no formato novo (shared) ou antigo (command)
      let request: CreateInverterRequestBackend;
      
      if (this.isNewFormatRequest(req.body)) {
        // Formato novo (alinhado com shared types)
        request = {
          ...req.body,
          userId
        };
      } else {
        // Formato antigo (command) - converter para novo formato
        const command: CreateInverterCommand = {
          ...req.body,
          userId
        };
        request = this.convertCreateCommandToRequest(command);
      }
      
      // Converter para o formato esperado pelo use case (se necessário)
      const result = await this.createInverterUseCase.execute(request as any);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserIdOptional(req) || 'system'; // Allow public access with default
      const query: GetInvertersQuery = {
        userId,
        // InverterFilters (shared types)
        manufacturer: req.query.manufacturer as string,
        model: req.query.model as string,
        minPower: req.query.minPower ? parseFloat(req.query.minPower as string) : undefined,
        maxPower: req.query.maxPower ? parseFloat(req.query.maxPower as string) : undefined,
        gridType: req.query.gridType as any,
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
      const userId = this.extractUserId(req);
      
      // Verificar se o request body está no formato novo (shared) ou antigo (command)
      let request: UpdateInverterRequestBackend;
      
      if (this.isNewFormatUpdateRequest(req.body)) {
        // Formato novo (alinhado com shared types)
        request = {
          id: req.params.id,
          ...req.body,
          userId
        };
      } else {
        // Formato antigo (command) - converter para novo formato
        const command: UpdateInverterCommand = {
          userId,
          id: req.params.id,
          ...req.body
        };
        request = this.convertUpdateCommandToRequest(command);
      }
      
      // Converter para o formato esperado pelo use case (se necessário)
      const result = await this.updateInverterUseCase.execute(request as any);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.update:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const command: DeleteInverterCommand = {
        userId,
        id: req.params.id
      };
      
      const result = await this.deleteInverterUseCase.execute(command);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.delete:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  // === Métodos Auxiliares ===

  /**
   * Verifica se o request está no formato novo (shared types)
   */
  private isNewFormatRequest(body: any): boolean {
    return body.power && body.mppt && body.electrical;
  }

  /**
   * Verifica se o request de update está no formato novo (shared types)
   */
  private isNewFormatUpdateRequest(body: any): boolean {
    return body.power !== undefined || 
           body.mppt !== undefined || 
           body.electrical !== undefined;
  }

  /**
   * Converte CreateCommand para CreateRequest (compatibilidade)
   */
  private convertCreateCommandToRequest(command: CreateInverterCommand): CreateInverterRequestBackend {
    return {
      userId: command.userId,
      manufacturer: {
        id: command.manufacturerId,
        name: command.fabricante,
        type: 'INVERTER' as any,
        description: '',
        contact: {
          email: '',
          phone: ''
        },
        business: {
          foundedYear: undefined
        },
        certifications: [],
        metadata: {
          specialties: [],
          markets: [],
          qualityStandards: []
        },
        status: 'active',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      model: command.modelo,
      power: {
        ratedACPower: command.potenciaNominal,
        maxPVPower: command.potenciaMaximaModulos,
        ratedDCPower: command.potenciaNominal,
        shortCircuitVoltageMax: command.tensaoCurtoCircuitoMaxima || command.tensaoEntradaMaxima,
        maxInputCurrent: command.correnteCurtoCircuitoMaxima || command.correnteEntradaMaxima,
        maxApparentPower: command.potenciaAparenteMaxima || command.potenciaSaidaCA
      },
      mppt: {
        numberOfMppts: command.numeroMppts,
        stringsPerMppt: command.stringsPorMppt
      },
      electrical: {
        maxEfficiency: command.eficienciaMaxima,
        gridType: this.mapTipoRedeToGridType(command.tipoRede),
        ratedVoltage: command.tensaoNominalSaida?.toString(),
        frequency: command.frequenciaSaida,
        powerFactor: command.fatorPotencia
      },
      metadata: {
        price: undefined,
        currency: 'BRL',
        productCode: '',
        datasheetUrl: command.datasheetUrl,
        imageUrl: '',
        certifications: command.certificacoes || [],
        warranty: command.garantiaAnos || 0,
        connectionType: this.mapTipoRedeToConnectionType(command.tipoRede)
      }
    };
  }

  /**
   * Converte UpdateCommand para UpdateRequest (compatibilidade)
   */
  private convertUpdateCommandToRequest(command: UpdateInverterCommand): UpdateInverterRequestBackend {
    const request: UpdateInverterRequestBackend = {
      id: command.id,
      userId: command.userId
    };

    // Mapear campos do formato antigo para o novo
    if (command.modelo !== undefined) request.model = command.modelo;
    
    if (command.potenciaNominal !== undefined || command.potenciaMaximaModulos !== undefined ||
        command.tensaoCurtoCircuitoMaxima !== undefined || command.correnteCurtoCircuitoMaxima !== undefined ||
        command.potenciaAparenteMaxima !== undefined || command.potenciaSaidaCA !== undefined) {
      request.power = {
        ratedACPower: command.potenciaNominal || 0,
        maxPVPower: command.potenciaMaximaModulos || 0,
        ratedDCPower: command.potenciaNominal || 0,
        shortCircuitVoltageMax: command.tensaoCurtoCircuitoMaxima || 0,
        maxInputCurrent: command.correnteCurtoCircuitoMaxima || 0,
        maxApparentPower: command.potenciaAparenteMaxima || 0
      };
    }
    
    if (command.numeroMppts !== undefined || command.stringsPorMppt !== undefined) {
      request.mppt = {
        numberOfMppts: command.numeroMppts || 0,
        stringsPerMppt: command.stringsPorMppt || 0
      };
    }
    
    if (command.eficienciaMaxima !== undefined || command.tipoRede !== undefined ||
        command.tensaoNominalSaida !== undefined || command.frequenciaSaida !== undefined ||
        command.fatorPotencia !== undefined) {
      request.electrical = {
        maxEfficiency: command.eficienciaMaxima || 0,
        gridType: this.mapTipoRedeToGridType(command.tipoRede),
        ratedVoltage: command.tensaoNominalSaida?.toString(),
        frequency: command.frequenciaSaida,
        powerFactor: command.fatorPotencia
      };
    }
    
    if (command.datasheetUrl !== undefined || command.certificacoes !== undefined ||
        command.garantiaAnos !== undefined || command.pesoKg !== undefined) {
      request.metadata = {
        datasheetUrl: command.datasheetUrl,
        certifications: command.certificacoes || [],
        warranty: command.garantiaAnos || 0,
        connectionType: this.mapTipoRedeToConnectionType(command.tipoRede)
      };
    }

    return request;
  }

  async findById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { id } = req.params;

      const query: GetInverterByIdQuery = {
        id,
        userId
      };

      const result = await this.getInverterByIdUseCase.execute(query);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.findById:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * Mapeia tipoRede (legado) para gridType (shared)
   */
  private mapTipoRedeToGridType(tipoRede?: string): 'monofasico' | 'bifasico' | 'trifasico' {
    switch (tipoRede?.toLowerCase()) {
      case 'monofasico':
      case 'monofásico':
        return 'monofasico';
      case 'bifasico':
      case 'bifásico':
        return 'bifasico';
      case 'trifasico':
      case 'trifásico':
      case 'on-grid':
        return 'trifasico';
      case 'off-grid':
        return 'trifasico'; // Default para off-grid
      case 'hibrido':
      case 'hybrid':
        return 'trifasico'; // Default para hybrid
      default:
        return 'trifasico'; // Default geral
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