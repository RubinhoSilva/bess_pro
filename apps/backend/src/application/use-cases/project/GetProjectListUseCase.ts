import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { GetProjectListQuery } from "@/application/dtos/input/project/GetProjectListQuery";
import { ProjectListDto } from "@/application/dtos/output/ProjectListDto";
import { ProjectMapper } from "@/application/mappers/ProjectMapper";
import { ProjectType } from "@/domain/entities/Project";
import { IProjectRepository, ProjectSearchFilters } from "@/domain/repositories";
import { UserId } from "@/domain/value-objects/UserId";

export class GetProjectListUseCase implements IUseCase<GetProjectListQuery, Result<ProjectListDto>> {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(query: GetProjectListQuery): Promise<Result<ProjectListDto>> {
    try {
      const userId = UserId.create(query.userId);
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const offset = (page - 1) * pageSize;

      // Construir filtros
      const filters: ProjectSearchFilters = {
        projectType: query.projectType ? (query.projectType === 'pv' ? ProjectType.PV : ProjectType.BESS) : undefined,
        hasLocation: query.hasLocation,
        hasLead: query.hasLead,
        searchTerm: query.searchTerm,
      };

      // Buscar projetos
      const projects = await this.projectRepository.findWithFilters(userId, filters);
      
      console.log(`GetProjectListUseCase - Found ${projects.length} projects for filters:`, filters);
      console.log('GetProjectListUseCase - Projects:', projects.map(p => ({ id: p.getId(), name: p.getProjectName()?.getValue() })));
      
      // Paginação em memória (em produção, seria no banco)
      const paginatedProjects = projects.slice(offset, offset + pageSize);
      const total = projects.length;

      return Result.success({
        projects: ProjectMapper.toSummaryDtoList(paginatedProjects),
        total,
        page,
        pageSize,
        hasNextPage: offset + pageSize < total,
      });
    } catch (error: any) {
      return Result.failure(`Erro ao buscar projetos: ${error.message}`);
    }
  }
}
