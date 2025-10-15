import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DimensioningListFilters {
  search?: string;
  projectType?: 'pv' | 'bess';
  page?: number;
  pageSize?: number;
}

export interface DimensioningListItem {
  id: string;
  projectName: string;
  projectType: 'pv' | 'bess';
  address: string;
  savedAt: string;
  hasLocation: boolean;
  hasLead: boolean;
  totalPVDimensionings: number;
  totalBESSAnalyses: number;
  lastPVStatus?: 'draft' | 'calculated' | 'approved';
  lastBESSStatus?: 'draft' | 'simulated' | 'approved';
}

export interface DimensioningListResponse {
  projects: DimensioningListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useDimensioningList(filters?: DimensioningListFilters) {
  return useQuery({
    queryKey: ['dimensionings', filters],
    queryFn: async () => {
      const response = await api.get('/projects', { params: filters });
      return response.data.data as DimensioningListResponse;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2
  });
}