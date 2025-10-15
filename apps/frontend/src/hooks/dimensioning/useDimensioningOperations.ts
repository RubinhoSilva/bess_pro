import { useLoadDimensioning } from './useLoadDimensioning';
import { useSaveDimensioning } from './useSaveDimensioning';
import { useDeleteDimensioning } from './useDeleteDimensioning';
import type { DimensioningData } from './useSaveDimensioning';

export function useDimensioningOperations(dimensioningId?: string) {
  const loadQuery = useLoadDimensioning(dimensioningId);
  const saveMutation = useSaveDimensioning(dimensioningId);
  const deleteMutation = useDeleteDimensioning();

  return {
    // Data
    data: loadQuery.data,

    // Loading states
    isLoading: loadQuery.isLoading,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Operations
    save: saveMutation.mutate,
    saveAsync: saveMutation.mutateAsync,
    deleteItem: deleteMutation.mutate,

    // States
    error: loadQuery.error || saveMutation.error || deleteMutation.error,
    isError: loadQuery.isError || saveMutation.isError || deleteMutation.isError,

    // Additional states
    isSuccess: loadQuery.isSuccess || saveMutation.isSuccess,
    isIdle: loadQuery.isIdle && !saveMutation.isPending && !deleteMutation.isPending,

    // Refetch
    refetch: loadQuery.refetch,
  };
}

export type { DimensioningData };