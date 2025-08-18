import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateInverterUseCase } from '../../application/use-cases/equipment/CreateInverterUseCase';
import { GetInvertersUseCase } from '../../application/use-cases/equipment/GetInvertersUseCase';
import { UpdateInverterUseCase } from '../../application/use-cases/equipment/UpdateInverterUseCase';
import { DeleteInverterUseCase } from '../../application/use-cases/equipment/DeleteInverterUseCase';
import { CreateInverterCommand } from '../../application/dtos/input/equipment/CreateInverterCommand';
import { GetInvertersQuery } from '../../application/dtos/input/equipment/GetInvertersQuery';
import { UpdateInverterCommand } from '../../application/dtos/input/equipment/UpdateInverterCommand';
import { DeleteInverterCommand } from '../../application/dtos/input/equipment/DeleteInverterCommand';

export class InverterController extends BaseController {

  constructor(
    private createInverterUseCase: CreateInverterUseCase,
    private getInvertersUseCase: GetInvertersUseCase,
    private updateInverterUseCase: UpdateInverterUseCase,
    private deleteInverterUseCase: DeleteInverterUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const command: CreateInverterCommand = {
        ...req.body,
        userId
      };
      
      const result = await this.createInverterUseCase.execute(command);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in InverterController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserIdOptional(req); // Allow public access
      const query: GetInvertersQuery = {
        userId,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        search: req.query.search as string,
        fabricante: req.query.fabricante as string,
        tipoRede: req.query.tipoRede as string,
        potenciaMin: req.query.potenciaMin ? parseFloat(req.query.potenciaMin as string) : undefined,
        potenciaMax: req.query.potenciaMax ? parseFloat(req.query.potenciaMax as string) : undefined,
        moduleReferencePower: req.query.moduleReferencePower ? parseFloat(req.query.moduleReferencePower as string) : undefined,
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
      const command: UpdateInverterCommand = {
        userId,
        id: req.params.id,
        ...req.body
      };
      
      const result = await this.updateInverterUseCase.execute(command);
      
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
}