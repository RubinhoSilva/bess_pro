import { IUseCase } from '@/application/common/IUseCase';
import { Result } from '@/application/common/Result';
import { CreateProjectCommand } from '@/application/dtos/input/project/CreateProjectCommand';
import { ProjectResponseDto } from '@/application/dtos/output/ProjectResponseDto';
import { ProjectMapper } from '@/application/mappers/ProjectMapper';
import { ProjectType, Project } from '@/domain/entities/Project';
import { IProjectRepository, IUserRepository, ILeadRepository } from '@/domain/repositories';
import { UserId } from '@/domain/value-objects/UserId';
import { ProjectDomainService } from '../../../domain/services/ProjectDomainService';

export class CreateProjectUseCase implements IUseCase<CreateProjectCommand, Result<ProjectResponseDto>> {
  constructor(
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository,
    private leadRepository: ILeadRepository
  ) {}

  async execute(command: CreateProjectCommand): Promise<Result<ProjectResponseDto>> {
    try {
      // Buscar usuário
      const userId = UserId.create(command.userId);
      const user = await this.userRepository.findById(userId.getValue());

      if (!user) {
        return Result.failure('Usuário não encontrado');
      }

      // Verificar permissões
      let projectType: ProjectType;
      switch (command.projectType.toLowerCase()) {
        case 'pv':
          projectType = ProjectType.PV;
          break;
        case 'bess':
          projectType = ProjectType.BESS;
          break;
        case 'hybrid':
          projectType = ProjectType.HYBRID;
          break;
        default:
          return Result.failure('Tipo de projeto inválido');
      }
      if (!ProjectDomainService.canUserCreateProject(user, projectType)) {
        return Result.failure('Usuário não tem permissão para criar este tipo de projeto');
      }

      // Verificar se nome de dimensionamento já existe
      const nameExists = await this.projectRepository.projectNameExists(
        command.projectName,
        userId
      );

      if (nameExists) {
        return Result.failure('Já existe um dimensionamento com este nome');
      }

      // Validar lead obrigatório
      const lead = await this.leadRepository.findById(command.leadId);
      if (!lead || !lead.isOwnedBy(userId)) {
        return Result.failure('Lead não encontrado ou não pertence ao usuário');
      }

      // Criar projeto
      const project = Project.create({
        projectName: command.projectName,
        userId: command.userId,
        projectType,
        address: command.address,
        leadId: command.leadId,
        projectData: command.projectData,
      });

      // Salvar
      const savedProject = await this.projectRepository.save(project);

      return Result.success(ProjectMapper.toResponseDto(savedProject));
    } catch (error: any) {
      return Result.failure(`Erro ao criar projeto: ${error.message}`);
    }
  }
}