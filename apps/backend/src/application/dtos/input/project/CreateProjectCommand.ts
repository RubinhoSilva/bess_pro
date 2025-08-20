export interface CreateProjectCommand {
  projectName: string; // Agora representa o nome do dimensionamento
  projectType: 'pv' | 'bess';
  userId: string;
  address?: string;
  leadId: string; // Obrigatório - dimensionamentos sempre precisam de um lead
  projectData?: Record<string, any>;
}