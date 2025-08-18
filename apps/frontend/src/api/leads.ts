import api from '../lib/api';
import { Lead, CreateLeadRequest, UpdateLeadRequest, LeadStage } from '../types/lead';

export const leadsApi = {
  // Get all leads
  getLeads: async (): Promise<Lead[]> => {
    const response = await api.get('/leads');
    return response.data.data;
  },

  // Get lead by ID
  getLeadById: async (id: string): Promise<Lead> => {
    const response = await api.get(`/leads/${id}`);
    return response.data.data;
  },

  // Create a new lead
  createLead: async (data: CreateLeadRequest): Promise<Lead> => {
    const response = await api.post('/leads', data);
    return response.data.data;
  },

  // Update a lead
  updateLead: async (id: string, data: UpdateLeadRequest): Promise<Lead> => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data.data;
  },

  // Update lead stage
  updateLeadStage: async (id: string, stage: LeadStage): Promise<Lead> => {
    const response = await api.patch(`/leads/${id}/stage`, { stage });
    return response.data.data;
  },

  // Delete a lead
  deleteLead: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },

  // Convert lead to project
  convertToProject: async (id: string): Promise<void> => {
    await api.post(`/leads/${id}/convert`);
  }
};