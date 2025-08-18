import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateProjectUseCase, UpdateProjectUseCase, DeleteProjectUseCase, GetProjectListUseCase, GetProjectDetailsUseCase } from '@/application';
import { CloneProjectUseCase } from '../../application/use-cases/project/CloneProjectUseCase';
import { ServiceTokens } from '@/infrastructure';
import { Container } from '@/infrastructure/di/Container';


export class ProjectController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { projectName, projectType, address, leadId, projectData } = req.body;


      const useCase = this.container.resolve<CreateProjectUseCase>(ServiceTokens.CREATE_PROJECT_USE_CASE);
      
      const result = await useCase.execute({
        projectName,
        projectType,
        userId,
        address,
        leadId,
        projectData,
      });


      if (result.isSuccess) {
        return this.created(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Create project error:', error);
      return this.internalServerError(res, 'Erro ao criar projeto');
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const projectId = req.params.id;
      const { projectName, address, projectData } = req.body;

      const useCase = this.container.resolve<UpdateProjectUseCase>(ServiceTokens.UPDATE_PROJECT_USE_CASE);
      
      const result = await useCase.execute({
        projectId,
        userId,
        projectName,
        address,
        projectData,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Update project error:', error);
      return this.internalServerError(res, 'Erro ao atualizar projeto');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const projectId = req.params.id;

      const useCase = this.container.resolve<DeleteProjectUseCase>(ServiceTokens.DELETE_PROJECT_USE_CASE);
      
      const result = await useCase.execute({
        projectId,
        userId,
      });

      if (result.isSuccess) {
        return this.ok(res, { message: 'Projeto deletado com sucesso' });
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Delete project error:', error);
      return this.internalServerError(res, 'Erro ao deletar projeto');
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { page, pageSize } = this.extractPagination(req);
      const { projectType, hasLocation, hasLead, searchTerm } = req.query;


      const useCase = this.container.resolve<GetProjectListUseCase>(ServiceTokens.GET_PROJECT_LIST_USE_CASE);
      
      const result = await useCase.execute({
        userId,
        projectType: projectType as 'pv' | 'bess',
        hasLocation: hasLocation === 'true' ? true : hasLocation === 'false' ? false : undefined,
        hasLead: hasLead === 'true' ? true : hasLead === 'false' ? false : undefined,
        searchTerm: searchTerm as string,
        page,
        pageSize,
      });


      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('List projects error:', error);
      return this.internalServerError(res, 'Erro ao listar projetos');
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const projectId = req.params.id;

      const useCase = this.container.resolve<GetProjectDetailsUseCase>(ServiceTokens.GET_PROJECT_DETAILS_USE_CASE);
      
      const result = await useCase.execute({
        projectId,
        userId,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Get project error:', error);
      return this.internalServerError(res, 'Erro ao buscar projeto');
    }
  }

  async clone(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const sourceProjectId = req.params.id;
      const { newProjectName } = req.body;

      const useCase = this.container.resolve<CloneProjectUseCase>(ServiceTokens.CLONE_PROJECT_USE_CASE);
      
      const result = await useCase.execute({
        userId,
        sourceProjectId,
        newProjectName
      });

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Clone project error:', error);
      return this.internalServerError(res, 'Erro ao clonar projeto');
    }
  }
}