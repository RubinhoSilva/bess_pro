import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { 
  Project, 
  ProjectSummary, 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectsResponse, 
  ProjectListFilters 
} from '@/types/project';

// API functions
const projectApi = {
  getProjects: async (filters: ProjectListFilters = {}): Promise<ProjectsResponse> => {
    const params = {
      page: filters.page,
      pageSize: filters.pageSize,
      projectType: filters.projectType,
      hasLocation: filters.hasLocation,
      hasLead: filters.hasLead,
      searchTerm: filters.searchTerm,
    };

    const response = await apiClient.projects.list(params);
    return response.data.data || response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await apiClient.projects.get(id);
    return response.data.data || response.data;
  },

  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.projects.create(data);
    return response.data.data || response.data;
  },

  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.projects.update(id, data);
    return response.data.data || response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.projects.delete(id);
  },

  cloneProject: async (id: string, newProjectName: string): Promise<Project> => {
    const response = await apiClient.projects.clone(id, newProjectName);
    return response.data.data || response.data;
  }
};

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectListFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Hooks
export function useProjects(filters: ProjectListFilters = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectApi.getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectApi.getProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectApi.updateProject(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.id),
        updatedProject
      );
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useCloneProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newProjectName }: { id: string; newProjectName: string }) =>
      projectApi.cloneProject(id, newProjectName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}