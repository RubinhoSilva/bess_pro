import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { CloneProjectCommand } from '../../dtos/input/project/CloneProjectCommand';
import { ProjectResponseDto } from '../../dtos/output/ProjectResponseDto';
import { ProjectMapper } from '../../mappers/ProjectMapper';
import { UserId } from '../../../domain/value-objects/UserId';
import { ProjectId } from '../../../domain/value-objects/ProjectId';
import { Project } from '../../../domain/entities/Project';

export class CloneProjectUseCase implements IUseCase<CloneProjectCommand, Result<ProjectResponseDto>> {
  
  constructor(
    private projectRepository: IProjectRepository
  ) {}

  async execute(command: CloneProjectCommand): Promise<Result<ProjectResponseDto>> {
    try {
      const { userId, sourceProjectId, newProjectName } = command;

      // Buscar o projeto original
      const sourceProject = await this.projectRepository.findById(sourceProjectId);
      
      if (!sourceProject) {
        return Result.failure('Projeto original não encontrado');
      }

      // Verificar se o usuário tem acesso ao projeto original
      if (sourceProject.getUserId().getValue() !== userId) {
        return Result.failure('Você não tem permissão para clonar este projeto');
      }

      // Verificar se já existe um projeto com o novo nome
      const userIdObj = UserId.create(userId);
      const projectNameExists = await this.projectRepository.projectNameExists(newProjectName, userIdObj);
      if (projectNameExists) {
        return Result.failure('Já existe um projeto com este nome');
      }

      // Criar uma cópia do projeto usando o método de domínio
      const clonedProject = Project.create({
        projectName: newProjectName,
        userId,
        projectType: sourceProject.getProjectType(),
        address: sourceProject.getAddress(),
        leadId: sourceProject.getLeadId(),
        projectData: sourceProject.getProjectData(),
      });

      // Salvar o projeto clonado
      const savedProject = await this.projectRepository.save(clonedProject);
      
      const responseDto = ProjectMapper.toResponseDto(savedProject);
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao clonar projeto');
    }
  }
}