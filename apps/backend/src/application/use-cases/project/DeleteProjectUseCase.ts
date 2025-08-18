import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { DeleteProjectCommand } from "@/application/dtos/input/project/DeleteProjectCommand";
import { IProjectRepository } from "@/domain/repositories";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export class DeleteProjectUseCase implements IUseCase<DeleteProjectCommand, Result<void>> {
  constructor(
    private projectRepository: IProjectRepository
  ) {}

  async execute(command: DeleteProjectCommand): Promise<Result<void>> {
    try {
      // Buscar projeto
      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId.getValue());

      if (!project) {
        return Result.failure('Projeto não encontrado');
      }

      // Verificar se o usuário é o proprietário do projeto
      const userId = UserId.create(command.userId);
      
      if (!project.isOwnedBy(userId)) {
        return Result.failure('Sem permissão para deletar este projeto');
      }

      // Deletar projeto diretamente
      // TODO: Implementar limpeza de dependências quando repositórios estiverem disponíveis
      await this.projectRepository.delete(projectId.getValue());

      return Result.success(undefined);
    } catch (error: any) {
      return Result.failure(`Erro ao deletar projeto: ${error.message}`);
    }
  }
}