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

      // Validar leadId obrigatório
      if (!leadId) {
        return this.badRequest(res, 'Lead é obrigatório para criar dimensionamento');
      }

      const useCase = this.container.resolve<CreateProjectUseCase>(ServiceTokens.CREATE_PROJECT_USE_CASE);
      
      const result = await useCase.execute({
        projectName, // Agora é o nome do dimensionamento
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
      console.error('Create dimensioning error:', error);
      return this.internalServerError(res, 'Erro ao criar dimensionamento');
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
      console.error('List dimensionings error:', error);
      return this.internalServerError(res, 'Erro ao listar dimensionamentos');
    }
  }

  async listByDate(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { projectType, searchTerm } = req.query;

      const useCase = this.container.resolve<GetProjectListUseCase>(ServiceTokens.GET_PROJECT_LIST_USE_CASE);
      
      // Buscar todos os dimensionamentos sem paginação para agrupar por data
      const result = await useCase.execute({
        userId,
        projectType: projectType as 'pv' | 'bess',
        searchTerm: searchTerm as string,
        page: 1,
        pageSize: 1000, // Limite alto para pegar todos
      });

      if (result.isSuccess && result.value) {
        // Agrupar por ano → mês
        const dimensioningsByDate: Record<string, Record<string, any[]>> = {};
        
        result.value.projects.forEach(project => {
          const savedAt = new Date(project.savedAt);
          const year = savedAt.getFullYear().toString();
          const month = savedAt.toLocaleDateString('pt-BR', { month: 'long' });
          
          if (!dimensioningsByDate[year]) {
            dimensioningsByDate[year] = {};
          }
          
          if (!dimensioningsByDate[year][month]) {
            dimensioningsByDate[year][month] = [];
          }
          
          dimensioningsByDate[year][month].push(project);
        });

        // Ordenar por data (mais recente primeiro)
        const sortedYears = Object.keys(dimensioningsByDate).sort((a, b) => parseInt(b) - parseInt(a));
        const organized = sortedYears.reduce((acc, year) => {
          const months = dimensioningsByDate[year];
          const sortedMonths = Object.keys(months).sort((a, b) => {
            const monthA = new Date(`01 ${a} ${year}`).getMonth();
            const monthB = new Date(`01 ${b} ${year}`).getMonth();
            return monthB - monthA;
          });
          
          acc[year] = sortedMonths.reduce((monthAcc, month) => {
            monthAcc[month] = months[month].sort((a, b) => 
              new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
            );
            return monthAcc;
          }, {} as Record<string, any[]>);
          
          return acc;
        }, {} as Record<string, Record<string, any[]>>);

        return this.ok(res, {
          dimensioningsByDate: organized,
          totalCount: result.value.total
        });
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('List dimensionings by date error:', error);
      return this.internalServerError(res, 'Erro ao listar dimensionamentos por data');
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