import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { IAreaMontagemRepository } from '../../../domain/repositories/IAreaMontagemRepository';
import { IModel3DRepository } from '../../../domain/repositories/IModel3DRepository';
import { Result } from '../../common/Result';
import { Project } from '../../../domain/entities/Project';
import { AreaMontagem } from '../../../domain/entities/AreaMontagem';
import { Model3D } from '../../../domain/entities/Model3D';
import { UserId } from '../../../domain/value-objects/UserId';
import { ProjectId } from '../../../domain/value-objects/ProjectId';
import { ProjectBackupData } from './ExportProjectBackupUseCase';

export interface ImportProjectBackupRequest {
  backupData: ProjectBackupData;
  userId: string;
  newProjectName?: string;
}

export class ImportProjectBackupUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private areaRepository: IAreaMontagemRepository,
    private model3dRepository: IModel3DRepository
  ) {}

  async execute(request: ImportProjectBackupRequest): Promise<Result<Project>> {
    try {
      const userId = UserId.create(request.userId);
      const { backupData } = request;

      // Validate backup version
      if (backupData.metadata.version !== '1.0.0') {
        return Result.failure('Versão do backup não suportada');
      }

      // Create new project from backup data
      const projectName = request.newProjectName || `${backupData.project.projectName} (Importado)`;
      
      const project = Project.create({
        projectName: projectName,
        projectType: backupData.project.projectType,
        address: backupData.project.address,
        userId: userId.getValue(),
        leadId: backupData.project.leadId,
      });

      // Save project
      const savedProject = await this.projectRepository.save(project);
      const newProjectId = ProjectId.create(savedProject.getId());

      // Import areas
      for (const areaData of backupData.areas) {
        const area = AreaMontagem.create({
          nome: areaData.nome,
          coordinates: areaData.coordinates,
          moduleLayout: areaData.moduleLayout,
          projectId: newProjectId.getValue(),
          userId: userId.getValue(),
        });

        await this.areaRepository.save(area);
      }

      // Import 3D models (metadata only, files need to be handled separately)
      for (const modelData of backupData.models3d) {
        const model3d = Model3D.create({
          name: modelData.name,
          description: modelData.description,
          modelPath: modelData.modelPath, // This might need adjustment for new location
          userId: userId.getValue(),
          projectId: newProjectId.getValue(),
        });

        await this.model3dRepository.save(model3d);
      }

      return Result.success(savedProject);
    } catch (error) {
      console.error('ImportProjectBackupUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}