import { Model3D } from '../../domain/entities/Model3D';
import { Model3DResponseDto } from '../dtos/output/Model3DResponseDto';

export class Model3DMapper {
  static toResponseDto(model: Model3D): Model3DResponseDto {
    return {
      id: model.getId(),
      userId: model.getUserId().getValue(),
      projectId: model.getProjectId().getValue(),
      name: model.getName().getValue(),
      description: model.getDescription(),
      modelPath: model.getModelPath(),
      fileExtension: model.getFileExtension(),
      createdAt: model.getCreatedAt().toISOString(),
    };
  }

  static toResponseDtoList(models: Model3D[]): Model3DResponseDto[] {
    return models.map(model => this.toResponseDto(model));
  }
}