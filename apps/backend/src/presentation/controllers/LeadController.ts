import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { 
  CreateLeadUseCase, 
  ConvertLeadToProjectUseCase,
  GetLeadsUseCase,
  UpdateLeadUseCase,
  DeleteLeadUseCase,
  GetLeadByIdUseCase,
  UpdateLeadStageUseCase
} from '@/application';
import { ServiceTokens } from '@/infrastructure';
import { Container } from '@/infrastructure/di/Container';
import { LeadStage, LeadSource } from '@/domain/entities/Lead';

export class LeadController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { 
        name, 
        email, 
        phone, 
        company, 
        address, 
        stage, 
        source, 
        notes, 
        colorHighlight, 
        estimatedValue, 
        expectedCloseDate,
        value,
        powerKwp,
        clientType,
        tags
      } = req.body;

      const useCase = this.container.resolve<CreateLeadUseCase>(ServiceTokens.CREATE_LEAD_USE_CASE);
      
      const result = await useCase.execute({
        name,
        email,
        phone,
        company,
        address,
        stage: stage as LeadStage,
        source: source as LeadSource,
        notes,
        colorHighlight,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        value: value ? Number(value) : undefined,
        powerKwp: powerKwp ? Number(powerKwp) : undefined,
        clientType,
        tags,
        userId,
      });

      if (result.isSuccess) {
        return this.created(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Create lead error:', error);
      return this.internalServerError(res, 'Erro ao criar lead');
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { 
        stage, 
        source, 
        searchTerm, 
        sortBy, 
        sortOrder, 
        limit, 
        offset 
      } = req.query;

      const useCase = this.container.resolve<GetLeadsUseCase>(ServiceTokens.GET_LEADS_USE_CASE);
      
      const result = await useCase.execute({
        userId,
        stage: stage as LeadStage,
        source: source as LeadSource,
        searchTerm: searchTerm as string,
        sortBy: sortBy as 'createdAt' | 'updatedAt' | 'estimatedValue' | 'name',
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('List leads error:', error);
      return this.internalServerError(res, 'Erro ao listar leads');
    }
  }

  async convertToProject(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const leadId = req.params.id;
      const { projectName, projectType } = req.body;

      const useCase = this.container.resolve<ConvertLeadToProjectUseCase>(ServiceTokens.CONVERT_LEAD_TO_PROJECT_USE_CASE);
      
      const result = await useCase.execute({
        leadId,
        userId,
        projectName,
        projectType,
      });

      if (result.isSuccess) {
        return this.created(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Convert lead error:', error);
      return this.internalServerError(res, 'Erro ao converter lead');
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const leadId = req.params.id;

      const useCase = this.container.resolve<GetLeadByIdUseCase>(ServiceTokens.GET_LEAD_BY_ID_USE_CASE);
      
      const result = await useCase.execute({
        leadId,
        userId,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Get lead error:', error);
      return this.internalServerError(res, 'Erro ao buscar lead');
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const leadId = req.params.id;
      const { 
        name, 
        email, 
        phone, 
        company, 
        address, 
        stage, 
        source, 
        notes, 
        colorHighlight, 
        estimatedValue, 
        expectedCloseDate,
        value,
        powerKwp,
        clientType,
        tags
      } = req.body;


      const useCase = this.container.resolve<UpdateLeadUseCase>(ServiceTokens.UPDATE_LEAD_USE_CASE);
      
      const result = await useCase.execute({
        leadId,
        userId,
        name,
        email,
        phone,
        company,
        address,
        stage: stage as LeadStage,
        source: source as LeadSource,
        notes,
        colorHighlight,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        value: value ? Number(value) : undefined,
        powerKwp: powerKwp ? Number(powerKwp) : undefined,
        clientType,
        tags
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Update lead error:', error);
      return this.internalServerError(res, 'Erro ao atualizar lead');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const leadId = req.params.id;

      const useCase = this.container.resolve<DeleteLeadUseCase>(ServiceTokens.DELETE_LEAD_USE_CASE);
      
      const result = await useCase.execute({
        leadId,
        userId,
      });

      if (result.isSuccess) {
        return this.ok(res, { message: 'Lead deletado com sucesso' });
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Delete lead error:', error);
      return this.internalServerError(res, 'Erro ao deletar lead');
    }
  }

  async updateStage(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const leadId = req.params.id;
      const { stage } = req.body;

      const useCase = this.container.resolve<UpdateLeadStageUseCase>(ServiceTokens.UPDATE_LEAD_STAGE_USE_CASE);
      
      const result = await useCase.execute({
        leadId,
        userId,
        stage: stage as LeadStage,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Update lead stage error:', error);
      return this.internalServerError(res, 'Erro ao atualizar estágio do lead');
    }
  }
}