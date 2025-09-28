import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateManufacturerUseCase } from '../../application/use-cases/manufacturer/CreateManufacturerUseCase';
import { GetManufacturersUseCase } from '../../application/use-cases/manufacturer/GetManufacturersUseCase';
import { GetManufacturerByIdUseCase } from '../../application/use-cases/manufacturer/GetManufacturerByIdUseCase';
import { UpdateManufacturerUseCase } from '../../application/use-cases/manufacturer/UpdateManufacturerUseCase';
import { DeleteManufacturerUseCase } from '../../application/use-cases/manufacturer/DeleteManufacturerUseCase';
import { CreateManufacturerCommand } from '../../application/dtos/input/manufacturer/CreateManufacturerCommand';
import { UpdateManufacturerCommand } from '../../application/dtos/input/manufacturer/UpdateManufacturerCommand';
import { ManufacturerType } from '../../domain/entities/Manufacturer';

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
      const user = (req as any).user;
      const teamId = user?.teamId;
      const command: CreateManufacturerCommand = {
        ...req.body,
        teamId
      };
      
      const result = await this.createManufacturerUseCase.execute(command);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.create:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const teamId = user?.teamId;
      const typeParam = req.query.type as string;
      
      let type: ManufacturerType | undefined;
      if (typeParam && Object.values(ManufacturerType).includes(typeParam as ManufacturerType)) {
        type = typeParam as ManufacturerType;
      }
      
      const result = await this.getManufacturersUseCase.execute({
        teamId,
        type
      });
      
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
      const command: UpdateManufacturerCommand = {
        id: req.params.id,
        ...req.body
      };
      
      const result = await this.updateManufacturerUseCase.execute(command);
      
      return this.handleResult(res, result);
      
    } catch (error) {
      console.error('Error in ManufacturerController.update:', error);
      return this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.deleteManufacturerUseCase.execute({
        id: req.params.id
      });
      
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