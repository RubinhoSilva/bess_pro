import api from '../api';
import { Lead, CreateLeadRequest, UpdateLeadRequest, GetLeadsQuery, LeadStage } from '../../types/lead';

export const leadsApi = {
  // Get all leads with optional filters
  getLeads: async (query?: GetLeadsQuery): Promise<Lead[]> => {
    const params = new URLSearchParams();
    if (query?.stage) params.append('stage', query.stage);
    if (query?.source) params.append('source', query.source);
    if (query?.searchTerm) params.append('searchTerm', query.searchTerm);
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/leads?${queryString}` : '/leads';
    
    const response = await api.get(url);
    return response.data.data;
  },

  // Get lead by ID
  getLead: async (id: string): Promise<Lead> => {
    const response = await api.get(`/leads/${id}`);
    return response.data.data;
  },

  // Create new lead
  createLead: async (data: CreateLeadRequest): Promise<Lead> => {
    const response = await api.post('/leads', data);
    return response.data.data;
  },

  // Update lead
  updateLead: async (id: string, data: UpdateLeadRequest): Promise<Lead> => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data.data;
  },

  // Update lead stage (for Kanban)
  updateLeadStage: async (id: string, stage: LeadStage): Promise<Lead> => {
    const response = await api.patch(`/leads/${id}/stage`, { stage });
    return response.data.data;
  },

  // Delete lead
  deleteLead: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },

  // Convert lead to project
  convertToProject: async (id: string, data: { projectName: string; projectType: string }): Promise<any> => {
    const response = await api.post(`/leads/${id}/convert`, data);
    return response.data.data;
  },
};