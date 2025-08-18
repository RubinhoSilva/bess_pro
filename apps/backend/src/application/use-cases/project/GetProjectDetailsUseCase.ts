import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { ProjectResponseDto } from "@/application/dtos/output/ProjectResponseDto";
import { ProjectMapper } from "@/application/mappers/ProjectMapper";
import { IProjectRepository, IUserRepository } from "@/domain/repositories";
import { UserPermissionService } from "@/domain/services";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export class GetProjectDetailsUseCase implements IUseCase<{ projectId: string; userId: string }, Result<ProjectResponseDto>> {
  constructor(
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<Result<ProjectResponseDto>> {
    try {
      // Buscar projeto
      const projectId = ProjectId.create(input.projectId);
      const project = await this.projectRepository.findById(projectId.getValue());

      if (!project) {
        return Result.failure('Projeto não encontrado');
      }

      // Verificar permissões
      const userId = UserId.create(input.userId);
      const user = await this.userRepository.findById(userId.getValue());
      
      if (!user || !UserPermissionService.canAccessProject(user, project)) {
        return Result.failure('Sem permissão para acessar este projeto');
      }

      return Result.success(ProjectMapper.toResponseDto(project));
    } catch (error: any) {
      return Result.failure(`Erro ao buscar detalhes do projeto: ${error.message}`);
    }
  }
}