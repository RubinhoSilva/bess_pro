import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Project } from '../types/project';

export interface ProjectBackupData {
  project: any;
  areas: any[];
  models3d: any[];
  metadata: {
    version: string;
    exportedAt: string;
    exportedBy: string;
  };
}

interface ExportBackupResponse {
  success: boolean;
  data: ProjectBackupData;
}

interface ImportBackupRequest {
  backupData: ProjectBackupData;
  newProjectName?: string;
}

interface ImportBackupResponse {
  success: boolean;
  data: Project;
}

export const useExportProjectBackup = () => {
  return useMutation({
    mutationFn: async (projectId: string): Promise<ProjectBackupData> => {
      const response = await api.get<ExportBackupResponse>(`/project-backups/${projectId}/export`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erro ao exportar backup do projeto');
    },
    onSuccess: (backupData, projectId) => {
      // Download the backup as JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-backup-${projectId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
};

export const useImportProjectBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ImportBackupRequest): Promise<Project> => {
      const response = await api.post<ImportBackupResponse>('/project-backups/import', request);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erro ao importar backup do projeto');
    },
    onSuccess: () => {
      // Invalidate projects queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const downloadBackupFromFile = (file: File): Promise<ProjectBackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        
        // Validate backup structure
        if (!backupData.metadata || !backupData.project || !Array.isArray(backupData.areas)) {
          throw new Error('Formato de backup inválido');
        }
        
        if (backupData.metadata.version !== '1.0.0') {
          throw new Error('Versão do backup não suportada');
        }
        
        resolve(backupData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo de backup: ' + (error as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};