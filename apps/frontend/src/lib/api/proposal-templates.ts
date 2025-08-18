import api from '../api';
import { 
  ProposalTemplate, 
  ProposalData, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  GenerateProposalRequest,
  TemplateListFilter
} from '../../types/proposal';

export const proposalTemplateApi = {
  // Template management
  async getTemplates(filter?: TemplateListFilter): Promise<ProposalTemplate[]> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.includeDefaults) params.append('includeDefaults', 'true');
    
    const response = await api.get(`/proposal-templates/templates?${params}`);
    return response.data;
  },

  async getTemplate(id: string): Promise<ProposalTemplate> {
    const response = await api.get(`/proposal-templates/templates/${id}`);
    return response.data;
  },

  async createTemplate(template: CreateTemplateRequest): Promise<ProposalTemplate> {
    const response = await api.post('/proposal-templates/templates', template);
    return response.data;
  },

  async updateTemplate(template: UpdateTemplateRequest): Promise<ProposalTemplate> {
    const { id, ...updates } = template;
    const response = await api.put(`/proposal-templates/templates/${id}`, updates);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/proposal-templates/templates/${id}`);
  },

  async cloneTemplate(id: string, newName: string): Promise<ProposalTemplate> {
    const response = await api.post(`/proposal-templates/templates/${id}/clone`, { name: newName });
    return response.data;
  },

  // Proposal generation
  async generateProposal(request: GenerateProposalRequest): Promise<ProposalData> {
    const response = await api.post('/proposal-templates/proposals/generate', request);
    return response.data;
  },

  async getProposalsByProject(projectId: string): Promise<ProposalData[]> {
    const response = await api.get(`/proposal-templates/proposals/project/${projectId}`);
    return response.data;
  }
};