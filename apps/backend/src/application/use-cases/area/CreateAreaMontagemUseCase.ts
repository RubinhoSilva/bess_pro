import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { CreateAreaMontagemCommand } from "@/application/dtos/input/area/CreateAreaMontagemCommand";
import { AreaMontagemResponseDto } from "@/application/dtos/output/AreaMontagemResponseDto";
import { AreaMontagemMapper } from "@/application/mappers/AreaMontagemMapper";
import { AreaMontagem } from "@/domain/entities/AreaMontagem";
import { IAreaMontagemRepository, IProjectRepository } from "@/domain/repositories";
import { AreaCalculationService } from "@/domain/services";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export class CreateAreaMontagemUseCase implements IUseCase<CreateAreaMontagemCommand, Result<AreaMontagemResponseDto>> {
  constructor(
    private areaRepository: IAreaMontagemRepository,
    private projectRepository: IProjectRepository
  ) {}

  async execute(command: CreateAreaMontagemCommand): Promise<Result<AreaMontagemResponseDto>> {
    try {
      // Verificar se projeto existe e pertence ao usuário
      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId.getValue());

      if (!project) {
        return Result.failure('Projeto não encontrado');
      }

      const userId = UserId.create(command.userId);
      if (!project.isOwnedBy(userId)) {
        return Result.failure('Projeto não pertence ao usuário');
      }

      // Verificar se nome da área já existe
      const nameExists = await this.areaRepository.areaNameExists(
        command.nome,
        projectId
      );

      if (nameExists) {
        return Result.failure('Já existe uma área com este nome no projeto');
      }

      // Criar área
      const area = AreaMontagem.create({
        projectId: command.projectId,
        userId: command.userId,
        nome: command.nome,
        coordinates: command.coordinates,
      });

      // Validar se área é viável
      if (!AreaCalculationService.isViableArea(area)) {
        return Result.failure('Área muito pequena para instalação de módulos');
      }

      // Salvar
      const savedArea = await this.areaRepository.save(area);

      return Result.success(AreaMontagemMapper.toResponseDto(savedArea));
    } catch (error: any) {
      return Result.failure(`Erro ao criar área: ${error.message}`);
    }
  }
}