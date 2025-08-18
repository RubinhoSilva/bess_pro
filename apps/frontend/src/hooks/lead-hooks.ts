import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Lead } from '@/types/lead';

interface LeadListResponse {
  leads: Lead[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: string;
  source?: string;
}

interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  id: string;
}

interface UseLeadsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export const useLeads = (params: UseLeadsParams = {}) => {
  return useQuery({
    queryKey: ['leads', 'list', params] as const,
    queryFn: async (): Promise<LeadListResponse> => {
      const searchParams = new URLSearchParams();
      
      if (params.page) {
        searchParams.append('page', params.page.toString());
      }
      if (params.pageSize) {
        searchParams.append('pageSize', params.pageSize.toString());
      }
      if (params.searchTerm) {
        searchParams.append('searchTerm', params.searchTerm);
      }
      
      const { data } = await api.get(`/leads?${searchParams.toString()}`);
      return data.data || data;
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lead: CreateLeadRequest): Promise<Lead> => {
      const { data } = await api.post('/leads', lead);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...lead }: UpdateLeadRequest): Promise<Lead> => {
      const { data } = await api.put(`/leads/${id}`, lead);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};