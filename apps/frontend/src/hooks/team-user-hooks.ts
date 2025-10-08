import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

export interface TeamUser {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string;
  status: 'active' | 'pending' | 'inactive' | 'removed';
  createdAt: string;
}

export interface InviteUserRequest {
  email: string;
  role: string;
  name?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

// Hook para listar usuários de um team
export const useTeamUsers = (teamId: string) => {
  return useQuery({
    queryKey: ['team-users', teamId],
    queryFn: async () => {
      const response = await api.get(`/teams/${teamId}/users`);
      return response.data.data as TeamUser[];
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para convidar usuário para team
export const useInviteUserToTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, userData }: { teamId: string; userData: InviteUserRequest }) => {
      const response = await api.post(`/teams/${teamId}/users/invite`, userData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-users', variables.teamId] });
      toast.success('Convite enviado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao convidar usuário:', error);
      const errorMessage = error.response?.data?.error?.message || 'Erro ao enviar convite';
      toast.error(errorMessage);
    },
  });
};

// Hook para alterar role de usuário
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      userId, 
      roleData 
    }: { 
      teamId: string; 
      userId: string; 
      roleData: UpdateUserRoleRequest;
    }) => {
      const response = await api.put(`/teams/${teamId}/users/${userId}/role`, roleData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-users', variables.teamId] });
      toast.success('Role do usuário alterada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao alterar role do usuário:', error);
      const errorMessage = error.response?.data?.error?.message || 'Erro ao alterar role';
      toast.error(errorMessage);
    },
  });
};

// Hook para remover usuário do team
export const useRemoveUserFromTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const response = await api.delete(`/teams/${teamId}/users/${userId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-users', variables.teamId] });
      toast.success('Usuário removido do team com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover usuário:', error);
      const errorMessage = error.response?.data?.error?.message || 'Erro ao remover usuário';
      toast.error(errorMessage);
    },
  });
};
