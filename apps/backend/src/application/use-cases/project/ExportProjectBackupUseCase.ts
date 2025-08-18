import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { IAreaMontagemRepository } from '../../../domain/repositories/IAreaMontagemRepository';
import { IModel3DRepository } from '../../../domain/repositories/IModel3DRepository';
import { Result } from '../../common/Result';
import { ProjectId } from '../../../domain/value-objects/ProjectId';
import { UserId } from '../../../domain/value-objects/UserId';

export interface ExportProjectBackupRequest {
  projectId: string;
  userId: string;
}

export interface ProjectBackupData {
  project: any;
  areas: any[];
  models3d: any[];
  metadata: {
    version: string;
    exportedAt: Date;
    exportedBy: string;
  };
}

export class ExportProjectBackupUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private areaRepository: IAreaMontagemRepository,
    private model3dRepository: IModel3DRepository
  ) {}

  async execute(request: ExportProjectBackupRequest): Promise<Result<ProjectBackupData>> {
    try {
      const projectId = ProjectId.create(request.projectId);
      const userId = UserId.create(request.userId);

      // Get project
      const project = await this.projectRepository.findById(projectId.getValue());
      if (!project) {
        return Result.failure('Projeto não encontrado');
      }

      // Verify user owns the project
      if (!project.isOwnedBy(userId)) {
        return Result.failure('Usuário não tem permissão para exportar este projeto');
      }

      // Get related data
      const areas = await this.areaRepository.findByProjectId(projectId, userId);
      const models3d = await this.model3dRepository.findByProjectId(projectId, userId);

      const backupData: ProjectBackupData = {
        project: {
          id: project.getId(),
          projectName: project.getProjectName().getValue(),
          projectType: project.getProjectType(),
          address: project.getAddress(),
          leadId: project.getLeadId(),
          projectData: project.getProjectData(),
          savedAt: project.getSavedAt(),
          userId: project.getUserId().getValue(),
        },
        areas: areas.map(area => ({
          id: area.getId(),
          nome: area.getNome().getValue(),
          coordinates: area.getCoordinates(),
          moduleLayout: area.getModuleLayout(),
          projectId: area.getProjectId().getValue(),
          userId: area.getUserId().getValue(),
          createdAt: area.getCreatedAt(),
        })),
        models3d: models3d.map(model => ({
          id: model.getId(),
          name: model.getName().getValue(),
          description: model.getDescription(),
          modelPath: model.getModelPath(),
          userId: model.getUserId().getValue(),
          projectId: model.getProjectId().getValue(),
          createdAt: model.getCreatedAt(),
        })),
        metadata: {
          version: '1.0.0',
          exportedAt: new Date(),
          exportedBy: userId.getValue(),
        }
      };

      return Result.success(backupData);
    } catch (error) {
      console.error('ExportProjectBackupUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}