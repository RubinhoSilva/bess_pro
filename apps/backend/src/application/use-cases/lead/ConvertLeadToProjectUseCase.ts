import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { ConvertLeadToProjectCommand } from "@/application/dtos/input/lead/ConvertLeadToProjectCommand";
import { ProjectResponseDto } from "@/application/dtos/output/ProjectResponseDto";
import { ProjectMapper } from "@/application/mappers/ProjectMapper";
import { Project, ProjectType } from "@/domain/entities/Project";
import { ILeadRepository, IProjectRepository, IUserRepository } from "@/domain/repositories";
import { ProjectDomainService } from "@/domain/services";
import { UserId } from "@/domain/value-objects/UserId";

export class ConvertLeadToProjectUseCase implements IUseCase<ConvertLeadToProjectCommand, Result<ProjectResponseDto>> {
  constructor(
    private leadRepository: ILeadRepository,
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: ConvertLeadToProjectCommand): Promise<Result<ProjectResponseDto>> {
    try {
      // Buscar lead
      const lead = await this.leadRepository.findById(command.leadId);
      if (!lead) {
        return Result.failure('Lead não encontrado');
      }

      // Verificar permissões
      const userId = UserId.create(command.userId);
      const user = await this.userRepository.findById(userId.getValue());
      
      if (!user || !lead.isOwnedBy(userId)) {
        return Result.failure('Sem permissão para converter este lead');
      }

      // Verificar se usuário pode criar projeto
      const projectType = command.projectType === 'pv' ? ProjectType.PV : ProjectType.BESS;
      if (!ProjectDomainService.canUserCreateProject(user, projectType)) {
        return Result.failure('Usuário não pode criar este tipo de projeto');
      }

      // Criar projeto
      const project = Project.create({
        projectName: command.projectName,
        userId: lead.getUserId().getValue(),
        projectType,
        address: lead.getAddress(),
        leadId: lead.getId(),
        projectData: {}
      });

      // Salvar projeto
      const savedProject = await this.projectRepository.save(project);

      return Result.success(ProjectMapper.toResponseDto(savedProject));
    } catch (error: any) {
      return Result.failure(`Erro ao converter lead: ${error.message}`);
    }
  }
}