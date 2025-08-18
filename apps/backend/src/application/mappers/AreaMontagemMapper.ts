import { AreaMontagem } from '../../domain/entities/AreaMontagem';
import { AreaMontagemResponseDto } from '../dtos/output/AreaMontagemResponseDto';

export class AreaMontagemMapper {
  static toResponseDto(area: AreaMontagem): AreaMontagemResponseDto {
    return {
      id: area.getId(),
      projectId: area.getProjectId().getValue(),
      userId: area.getUserId().getValue(),
      nome: area.getNome().getValue(),
      coordinates: area.getCoordinates(),
      moduleLayout: area.getModuleLayout(),
      moduleCount: area.getModuleCount(),
      hasModules: area.hasModules(),
      createdAt: area.getCreatedAt().toISOString(),
    };
  }

  static toResponseDtoList(areas: AreaMontagem[]): AreaMontagemResponseDto[] {
    return areas.map(area => this.toResponseDto(area));
  }
}