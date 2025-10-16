import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Project, ProjectSummary, PVDimensioning, CreateProjectData, UpdateProjectData } from '@/types/project';
import { apiClient } from '../lib/api';

interface UseProjectsWithAnalysesReturn {
  projects: ProjectSummary[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations for projects
  createProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  duplicateProject: (id: string) => Promise<Project | null>;
  getProject: (id: string) => Promise<Project | null>;
  
  // Operations for PV dimensionings
  createPVDimensioning: (projectId: string, data: Partial<PVDimensioning>) => Promise<PVDimensioning | null>;
  updatePVDimensioning: (projectId: string, dimensioningId: string, data: Partial<PVDimensioning>) => Promise<PVDimensioning | null>;
  deletePVDimensioning: (projectId: string, dimensioningId: string) => Promise<boolean>;
  duplicatePVDimensioning: (projectId: string, dimensioningId: string) => Promise<PVDimensioning | null>;

  
  // Utility functions
  refreshProjects: () => Promise<void>;
  getProjectStats: () => {
    totalProjects: number;
    totalPVDimensionings: number;
    totalBESSAnalyses: number;
    avgAnalysesPerProject: number;
  };
}

// Hook para gerenciar projetos com análises PV e BESS

export const useProjectsWithAnalyses = (): UseProjectsWithAnalysesReturn => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Cache para projetos completos
  const [projectCache, setProjectCache] = useState<Map<string, Project>>(new Map());

  const handleError = (error: any, defaultMessage: string) => {
    const message = error?.message || defaultMessage;
    setError(message);
    toast({
      variant: "destructive",
      title: "Erro",
      description: message
    });
  };

  const clearError = () => setError(null);

  // Carregar lista de projetos
  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    clearError();
    
    try {
      const response = await apiClient.projects.list();
      const data = response.data.data || response.data;
      setProjects(data.projects || data || []);
    } catch (err) {
      handleError(err, 'Erro ao carregar projetos');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar projeto completo
  const getProject = useCallback(async (id: string): Promise<Project | null> => {
    // Verificar cache primeiro
    if (projectCache.has(id)) {
      return projectCache.get(id)!;
    }

    setIsLoading(true);
    clearError();
    
    try {
      const response = await apiClient.projects.get(id);
      const project = response.data.data || response.data;
      
      // Atualizar cache
      setProjectCache(prev => new Map(prev).set(id, project));
      
      return project;
    } catch (err) {
      handleError(err, 'Erro ao carregar projeto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectCache, toast]);

  // CRUD Operations - Projects
  const createProject = useCallback(async (data: CreateProjectData): Promise<Project | null> => {
    setIsLoading(true);
    clearError();
    
    try {
      const response = await apiClient.projects.create(data);
      const project = response.data.data || response.data;
      
      toast({
        title: "Projeto criado!",
        description: `${project.projectName} foi criado com sucesso.`
      });
      
      // Atualizar lista de projetos após o toast
      setTimeout(() => {
        refreshProjects();
      }, 100);
      
      return project;
    } catch (err) {
      handleError(err, 'Erro ao criar projeto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [refreshProjects, toast]);

  const updateProject = useCallback(async (id: string, data: UpdateProjectData): Promise<Project | null> => {
    setIsLoading(true);
    clearError();
    
    try {
      const response = await apiClient.projects.update(id, data);
      const project = response.data.data || response.data;
      
      // Atualizar cache
      setProjectCache(prev => new Map(prev).set(id, project));
      
      // Atualizar lista
      await refreshProjects();
      
      toast({
        title: "Projeto atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
      
      return project;
    } catch (err) {
      handleError(err, 'Erro ao atualizar projeto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [refreshProjects, toast]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    clearError();
    
    try {
      await apiClient.projects.delete(id);
      
      // Remover do cache
      setProjectCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(id);
        return newCache;
      });
      
      // Atualizar lista
      await refreshProjects();
      
      toast({
        title: "Projeto excluído",
        description: "O projeto foi removido permanentemente."
      });
      
      return true;
    } catch (err) {
      handleError(err, 'Erro ao excluir projeto');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshProjects, toast]);

  const duplicateProject = useCallback(async (id: string): Promise<Project | null> => {
    setIsLoading(true);
    clearError();
    
    try {
      const originalProject = await getProject(id);
      if (!originalProject) {
        throw new Error('Projeto não encontrado');
      }
      
      const newProjectName = `${originalProject.projectName} (Cópia)`;
      const response = await apiClient.projects.clone(id, newProjectName);
      const project = response.data.data || response.data;
      
      // Atualizar lista
      await refreshProjects();
      
      toast({
        title: "Projeto duplicado!",
        description: `${project.projectName} foi criado com sucesso.`
      });
      
      return project;
    } catch (err) {
      handleError(err, 'Erro ao duplicar projeto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getProject, refreshProjects, toast]);

  // PV Dimensioning Operations (stubs - implementar quando API estiver disponível)
  const createPVDimensioning = useCallback(async (
    projectId: string,
    data: Partial<PVDimensioning>
  ): Promise<PVDimensioning | null> => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Dimensionamentos PV serão implementados em breve."
    });
    return null;
  }, [toast]);

  const deletePVDimensioning = useCallback(async (
    projectId: string,
    dimensioningId: string
  ): Promise<boolean> => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Exclusão de dimensionamentos PV será implementada em breve."
    });
    return false;
  }, [toast]);

  // Utility functions
  const getProjectStats = useCallback(() => {
    const totalProjects = projects.length;
    const totalPVDimensionings = projects.reduce((sum,p) => sum + (p.totalPVDimensionings || 0), 0);
    const avgAnalysesPerProject = totalProjects > 0 ? (totalPVDimensionings / totalProjects) : 0;
    
    return {
      totalProjects,
      totalPVDimensionings,
      totalBESSAnalyses: 0, // Placeholder, implementar quando análises BESS estiverem disponíveis
      avgAnalysesPerProject
    };
  }, [projects]);

  // Implementações simplificadas para outras operações
  const updatePVDimensioning = useCallback(async () => null, []);
  const duplicatePVDimensioning = useCallback(async () => null, []);

  // Carregar dados iniciais
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    getProject,
    createPVDimensioning,
    updatePVDimensioning,
    deletePVDimensioning,
    duplicatePVDimensioning,
    refreshProjects,
    getProjectStats
  };
};