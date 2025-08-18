import api from '../api';
import { Team, CreateTeamRequest, TeamFilters } from '../../types/team';

export const teamsApi = {
  createTeam: async (data: CreateTeamRequest): Promise<Team> => {
    const response = await api.post('/teams', data);
    return response.data.data;
  },

  getTeams: async (filters?: TeamFilters): Promise<Team[]> => {
    const params = new URLSearchParams();
    
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.ownerId) {
      params.append('ownerId', filters.ownerId);
    }
    if (filters?.planType) {
      params.append('planType', filters.planType);
    }

    const response = await api.get(`/teams?${params.toString()}`);
    return response.data.data;
  },

  getTeamById: async (id: string): Promise<Team> => {
    const response = await api.get(`/teams/${id}`);
    return response.data.data;
  },

  updateTeam: async (id: string, data: Partial<CreateTeamRequest>): Promise<Team> => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data.data;
  },

  inactivateTeam: async (id: string): Promise<Team> => {
    const response = await api.patch(`/teams/${id}/inactivate`);
    return response.data.data;
  },

  deleteTeam: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  }
};