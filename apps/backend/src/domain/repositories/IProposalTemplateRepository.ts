import { ProposalTemplate, ProposalData } from '../entities/ProposalTemplate';

export interface IProposalTemplateRepository {
  // Template CRUD operations
  create(template: Omit<ProposalTemplate, 'id'>): Promise<ProposalTemplate>;
  findById(id: string): Promise<ProposalTemplate | null>;
  findByTeamId(teamId: string): Promise<ProposalTemplate[]>;
  findByCategory(category: string, teamId?: string): Promise<ProposalTemplate[]>;
  findDefaultTemplates(): Promise<ProposalTemplate[]>;
  update(id: string, updates: Partial<ProposalTemplate>): Promise<ProposalTemplate>;
  delete(id: string): Promise<void>;
  
  // Template management
  cloneTemplate(id: string, newName: string, userId: string): Promise<ProposalTemplate>;
  setAsDefault(id: string, teamId?: string): Promise<void>;
  
  // Proposal data management
  saveProposalData(data: Omit<ProposalData, 'generatedAt'>): Promise<ProposalData>;
  findProposalsByProject(projectId: string): Promise<ProposalData[]>;
  deleteProposalData(templateId: string, projectId: string): Promise<void>;
}