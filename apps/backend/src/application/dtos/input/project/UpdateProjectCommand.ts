export interface UpdateProjectCommand {
  projectId: string;
  userId: string;
  projectName?: string;
  address?: string;
  projectData?: Record<string, any>;
}
