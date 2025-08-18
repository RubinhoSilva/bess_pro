export interface CreateProjectCommand {
  projectName: string;
  projectType: 'pv' | 'bess';
  userId: string;
  address?: string;
  leadId?: string;
  projectData?: Record<string, any>;
}