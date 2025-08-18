import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../lib/api/teams';
import { Team, CreateTeamRequest, TeamFilters } from '../types/team';
import { toast } from 'react-hot-toast';

export const useTeams = (filters?: TeamFilters) => {
  return useQuery({
    queryKey: ['teams', filters],
    queryFn: () => teamsApi.getTeams(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamsApi.getTeamById(id),
    enabled: !!id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTeamRequest) => teamsApi.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar team:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar team');
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTeamRequest> }) => 
      teamsApi.updateTeam(id, data),
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams', updatedTeam.id] });
      toast.success('Team atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar team:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar team');
    },
  });
};

export const useInactivateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => teamsApi.inactivateTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team inativado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao inativar team:', error);
      toast.error(error.response?.data?.message || 'Erro ao inativar team');
    },
  });
};