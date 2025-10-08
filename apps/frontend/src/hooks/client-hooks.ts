import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Client, CreateClientData, UpdateClientData, ClientListResponse } from '../types/client';
import toast from 'react-hot-toast';

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params?: { page?: number; pageSize?: number; searchTerm?: string }) => 
    [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

// Hooks
export function useClients(params?: { 
  page?: number; 
  pageSize?: number; 
  searchTerm?: string; 
}) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => {
      return apiClient.clients.list(params).then((response) => {
        return response.data.data as ClientListResponse;
      });
    },
    staleTime: 0, // Forçar refetch sempre que necessário
    gcTime: 0, // Não manter cache por muito tempo
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => apiClient.clients.get(id).then((response) => response.data.data as Client),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateClientData) => apiClient.clients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erro ao criar cliente';
      toast.error(typeof message === 'string' ? message : 'Erro ao criar cliente');
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) => 
      apiClient.clients.update(id, data),
    onSuccess: (response, { id }) => {
      
      // Invalidar todas as queries relacionadas a clientes para garantir atualização
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      
      // Forçar refetch das listas para garantir atualização imediata
      queryClient.refetchQueries({ queryKey: clientKeys.lists() });
      
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erro ao atualizar cliente';
      toast.error(typeof message === 'string' ? message : 'Erro ao atualizar cliente');
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => {
      return apiClient.clients.delete(id);
    },
    onSuccess: (_, id) => {
      // Remove optimistic da lista em vez de invalidar tudo
      queryClient.setQueriesData(
        { queryKey: clientKeys.lists() },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            clients: old.clients.filter((client: any) => client.id !== id),
            total: Math.max(0, old.total - 1)
          };
        }
      );
      
      queryClient.removeQueries({ queryKey: clientKeys.detail(id) });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: any, id) => {
      console.error('Erro ao deletar cliente:', error, 'ID:', id);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erro ao excluir cliente';
      toast.error(typeof message === 'string' ? message : 'Erro ao excluir cliente');
    },
  });
}

export function useRevertClientToLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clientId: string) => 
      apiClient.clients.revertToLead(clientId),
    onSuccess: () => {
      // Invalidar tanto clientes quanto leads para atualizar as listas
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Cliente convertido para lead com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erro ao reverter cliente para lead';
      toast.error(typeof message === 'string' ? message : 'Erro ao reverter cliente para lead');
    },
  });
}

export function useConvertLeadToClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (leadId: string) => apiClient.clients.convertLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      // Also invalidate leads cache to update the lead status
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead convertido em cliente com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erro ao converter lead em cliente';
      toast.error(typeof message === 'string' ? message : 'Erro ao converter lead em cliente');
    },
  });
}
