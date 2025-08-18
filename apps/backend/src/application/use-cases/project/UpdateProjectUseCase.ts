import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { UpdateProjectCommand } from "@/application/dtos/input/project/UpdateProjectCommand";
import { ProjectResponseDto } from "@/application/dtos/output/ProjectResponseDto";
import { ProjectMapper } from "@/application/mappers/ProjectMapper";
import { IProjectRepository } from "@/domain/repositories";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { UserPermissionService } from "@/domain/services";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export class UpdateProjectUseCase implements IUseCase<UpdateProjectCommand, Result<ProjectResponseDto>> {
  constructor(
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository,
    private userPermissionService: UserPermissionService
  ) {}

  async execute(command: UpdateProjectCommand): Promise<Result<ProjectResponseDto>> {
    try {
      // Buscar projeto
      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId.getValue());

      if (!project) {
        return Result.failure('Projeto não encontrado');
      }

      // Verificar permissões
      const userId = UserId.create(command.userId);
      const user = await this.userRepository.findById(userId.getValue());
      
      if (!user || !UserPermissionService.canEditProject(user, project)) {
        return Result.failure('Sem permissão para editar este projeto');
      }

      // Atualizar dados
      if (command.projectName) {
        // Verificar se novo nome já existe
        const nameExists = await this.projectRepository.projectNameExists(
          command.projectName,
          userId,
          projectId
        );

        if (nameExists) {
          return Result.failure('Já existe um projeto com este nome');
        }

        project.updateProjectName(command.projectName);
      }

      if (command.address) {
        project.updateAddress(command.address);
      }

      if (command.projectData) {
        project.updateProjectData(command.projectData);
      }

      // Salvar
      const updatedProject = await this.projectRepository.update(project);

      return Result.success(ProjectMapper.toResponseDto(updatedProject));
    } catch (error: any) {
      return Result.failure(`Erro ao atualizar projeto: ${error.message}`);
    }
  }
}