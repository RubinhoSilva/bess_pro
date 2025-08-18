import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanApi } from '../api/kanban';
import { CreateKanbanColumnRequest, UpdateKanbanColumnRequest, ReorderColumnsRequest } from '../types/kanban';
import toast from 'react-hot-toast';

export const useKanbanColumns = () => {
  return useQuery({
    queryKey: ['kanban', 'columns'],
    queryFn: () => kanbanApi.getColumns(),
  });
};

export const useCreateKanbanColumn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateKanbanColumnRequest) => kanbanApi.createColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'columns'] });
      toast.success('Coluna criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating column:', error);
      toast.error('Erro ao criar coluna');
    },
  });
};

export const useUpdateKanbanColumn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKanbanColumnRequest }) => 
      kanbanApi.updateColumn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'columns'] });
      toast.success('Coluna atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating column:', error);
      toast.error('Erro ao atualizar coluna');
    },
  });
};

export const useDeleteKanbanColumn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => kanbanApi.deleteColumn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'columns'] });
      toast.success('Coluna removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting column:', error);
      toast.error('Erro ao remover coluna');
    },
  });
};

export const useReorderKanbanColumns = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ReorderColumnsRequest) => kanbanApi.reorderColumns(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'columns'] });
      toast.success('Colunas reordenadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error reordering columns:', error);
      toast.error('Erro ao reordenar colunas');
    },
  });
};