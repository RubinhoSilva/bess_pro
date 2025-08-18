import api from '../lib/api';
import { LeadInteraction, CreateLeadInteractionRequest, UpdateLeadInteractionRequest } from '../types/interactions';

export const interactionsApi = {
  // Get all interactions for a lead
  getLeadInteractions: async (leadId: string): Promise<LeadInteraction[]> => {
    const response = await api.get(`/lead-interactions/lead/${leadId}`);
    return response.data.data;
  },

  // Create a new interaction
  createInteraction: async (data: CreateLeadInteractionRequest): Promise<LeadInteraction> => {
    const response = await api.post('/lead-interactions', data);
    return response.data.data;
  },

  // Update an interaction
  updateInteraction: async (id: string, data: UpdateLeadInteractionRequest): Promise<LeadInteraction> => {
    const response = await api.put(`/lead-interactions/${id}`, data);
    return response.data.data;
  },

  // Delete an interaction
  deleteInteraction: async (id: string): Promise<void> => {
    await api.delete(`/lead-interactions/${id}`);
  },

  // Mark interaction as completed
  markCompleted: async (id: string): Promise<LeadInteraction> => {
    const response = await api.put(`/lead-interactions/${id}`, {
      completedAt: new Date().toISOString()
    });
    return response.data.data;
  }
};