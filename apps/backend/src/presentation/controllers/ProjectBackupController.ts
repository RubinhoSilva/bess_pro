import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ExportProjectBackupUseCase } from '../../application/use-cases/project/ExportProjectBackupUseCase';
import { ImportProjectBackupUseCase } from '../../application/use-cases/project/ImportProjectBackupUseCase';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class ProjectBackupController extends BaseController {
  private exportProjectBackupUseCase: ExportProjectBackupUseCase;
  private importProjectBackupUseCase: ImportProjectBackupUseCase;

  constructor(container: Container) {
    super();
    this.exportProjectBackupUseCase = container.resolve<ExportProjectBackupUseCase>(ServiceTokens.ExportProjectBackupUseCase);
    this.importProjectBackupUseCase = container.resolve<ImportProjectBackupUseCase>(ServiceTokens.ImportProjectBackupUseCase);
  }

  public async exportProjectBackup(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = this.extractUserId(req);

      const result = await this.exportProjectBackupUseCase.execute({
        projectId,
        userId,
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error || 'Erro ao exportar backup do projeto');
        return;
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="project-backup-${projectId}-${Date.now()}.json"`);
      
      this.ok(res, result.value);
    } catch (error) {
      console.error('ProjectBackupController.exportProjectBackup error:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  public async importProjectBackup(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const { backupData, newProjectName } = req.body;

      if (!backupData) {
        this.badRequest(res, 'Dados de backup são obrigatórios');
        return;
      }

      const result = await this.importProjectBackupUseCase.execute({
        backupData,
        userId,
        newProjectName,
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error || 'Erro ao importar backup do projeto');
        return;
      }

      this.created(res, result.value);
    } catch (error) {
      console.error('ProjectBackupController.importProjectBackup error:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }
}