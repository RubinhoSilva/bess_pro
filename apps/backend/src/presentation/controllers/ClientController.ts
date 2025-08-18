import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateClientUseCase } from '../../application/use-cases/client/CreateClientUseCase';
import { GetClientListUseCase } from '../../application/use-cases/client/GetClientListUseCase';
import { GetClientDetailsUseCase } from '../../application/use-cases/client/GetClientDetailsUseCase';
import { UpdateClientUseCase } from '../../application/use-cases/client/UpdateClientUseCase';
import { DeleteClientUseCase } from '../../application/use-cases/client/DeleteClientUseCase';
import { ConvertLeadToClientUseCase } from '../../application/use-cases/client/ConvertLeadToClientUseCase';

export class ClientController extends BaseController {
  constructor(
    private createClientUseCase: CreateClientUseCase,
    private getClientListUseCase: GetClientListUseCase,
    private getClientDetailsUseCase: GetClientDetailsUseCase,
    private updateClientUseCase: UpdateClientUseCase,
    private deleteClientUseCase: DeleteClientUseCase,
    private convertLeadToClientUseCase: ConvertLeadToClientUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.createClientUseCase.execute(req.body, userId);
      return this.handleResult(res, result);
    } catch (error: any) {
      if (error.message === 'Usuário não autenticado') {
        return this.unauthorized(res);
      }
      return this.internalServerError(res, error.message);
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { page, pageSize } = this.extractPagination(req);
      
      const query = {
        page,
        pageSize,
        searchTerm: req.query.searchTerm as string
      };

      const result = await this.getClientListUseCase.execute(query, userId);
      return this.handleResult(res, result);
    } catch (error: any) {
      if (error.message === 'Usuário não autenticado') {
        return this.unauthorized(res);
      }
      return this.internalServerError(res, error.message);
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const clientId = req.params.id;
      const result = await this.getClientDetailsUseCase.execute(clientId, userId);
      return this.handleResult(res, result);
    } catch (error: any) {
      if (error.message === 'Usuário não autenticado') {
        return this.unauthorized(res);
      }
      return this.internalServerError(res, error.message);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const clientId = req.params.id;
      const result = await this.updateClientUseCase.execute(clientId, req.body, userId);
      return this.handleResult(res, result);
    } catch (error: any) {
      if (error.message === 'Usuário não autenticado') {
        return this.unauthorized(res);
      }
      return this.internalServerError(res, error.message);
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const clientId = req.params.id;
      const result = await this.deleteClientUseCase.execute(clientId, userId);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
    } catch (error: any) {
      if (error.message === 'Usuário não autenticado') {
        return this.unauthorized(res);
      }
      return this.internalServerError(res, error.message);
    }
  }

  async convertLeadToClient(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const leadId = req.params.leadId;
      
      const result = await this.convertLeadToClientUseCase.execute({ leadId }, userId);
      return this.handleResult(res, result);
    } catch (error: any) {
      if (error.message === 'Usuário não autenticado') {
        return this.unauthorized(res);
      }
      return this.internalServerError(res, error.message);
    }
  }
}