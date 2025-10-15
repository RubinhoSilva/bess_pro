import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DimensioningData } from './useSaveDimensioning';

export function useLoadDimensioning(dimensioningId?: string) {
  return useQuery({
    queryKey: ['dimensioning', dimensioningId],
    queryFn: async () => {
      if (!dimensioningId) {
        throw new Error('ID do dimensionamento não fornecido');
      }

      const response = await api.get(`/projects/${dimensioningId}`);
      return response.data.data as DimensioningData;
    },
    enabled: Boolean(dimensioningId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos (antes era cacheTime)
    retry: 2
  });
}