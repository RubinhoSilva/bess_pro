import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export function useDeleteDimensioning() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dimensioningId: string) => {
      return api.delete(`/projects/${dimensioningId}`);
    },
    onSuccess: (_, dimensioningId) => {
      queryClient.invalidateQueries({ queryKey: ['dimensionings'] });
      queryClient.removeQueries({ queryKey: ['dimensioning', dimensioningId] });

      toast({
        title: 'Removido',
        description: 'Dimensionamento removido com sucesso',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Erro ao remover dimensionamento';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      });
    }
  });
}