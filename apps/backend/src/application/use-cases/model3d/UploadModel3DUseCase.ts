import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { UploadModel3DCommand } from "@/application/dtos/input/model3d/UploadModel3DCommand";
import { Model3DResponseDto } from "@/application/dtos/output/Model3DResponseDto";
import { Model3DMapper } from "@/application/mappers/Model3DMapper";
import { Model3D } from "@/domain/entities/Model3D";
import { IModel3DRepository, IProjectRepository } from "@/domain/repositories";
import { Model3DValidationService } from "@/domain/services";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";
import { IFileStorageService } from "../../services/IFileStorageService";

export class UploadModel3DUseCase implements IUseCase<UploadModel3DCommand, Result<Model3DResponseDto>> {
  constructor(
    private modelRepository: IModel3DRepository,
    private projectRepository: IProjectRepository,
    private fileStorageService: IFileStorageService
  ) {}

  async execute(command: UploadModel3DCommand): Promise<Result<Model3DResponseDto>> {
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

      // Validar arquivo
      if (!Model3DValidationService.isSupportedFormat(command.modelPath)) {
        return Result.failure('Formato de arquivo não suportado');
      }

      // Criar modelo 3D
      const model = Model3D.create({
        userId: command.userId,
        projectId: command.projectId,
        name: command.name,
        description: command.description,
        modelPath: command.modelPath,
      });

      // Validar modelo
      const validation = Model3DValidationService.validateModel(model, project);
      if (!validation.valid) {
        return Result.failure(validation.errors.join(', '));
      }

      // Salvar
      const savedModel = await this.modelRepository.save(model);

      return Result.success(Model3DMapper.toResponseDto(savedModel));
    } catch (error: any) {
      return Result.failure(`Erro ao fazer upload do modelo: ${error.message}`);
    }
  }
}
