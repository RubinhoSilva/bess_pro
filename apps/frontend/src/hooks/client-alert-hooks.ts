import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  ClientAlert, 
  CreateClientAlertInput, 
  UpdateClientAlertInput, 
  ClientAlertFilters, 
  DashboardAlerts,
  PaginatedClientAlerts,
  OffsetPaginatedClientAlerts,
  PaginatedDashboardAlerts,
  AlertStatus
} from '../types/client-alert';
import { 
  PaginationRequest, 
  OffsetPaginationRequest, 
  PaginationUtils 
} from '../types/pagination';

// API functions
const createClientAlert = async (input: CreateClientAlertInput): Promise<ClientAlert> => {
  const response = await api.post('/client-alerts', input);
  return response.data;
};

const getClientAlerts = async (filters?: ClientAlertFilters): Promise<ClientAlert[]> => {
  const params = new URLSearchParams();
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.alertType) params.append('alertType', filters.alertType);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.isOverdue) params.append('isOverdue', 'true');

  const response = await api.get(`/client-alerts?${params.toString()}`);
  return response.data;
};

const getClientAlertsByClientId = async (clientId: string): Promise<ClientAlert[]> => {
  const response = await api.get(`/client-alerts/client/${clientId}`);
  return response.data;
};

const updateClientAlert = async (id: string, input: UpdateClientAlertInput): Promise<ClientAlert> => {
  const response = await api.patch(`/client-alerts/${id}`, input);
  return response.data;
};

const getDashboardAlerts = async (): Promise<DashboardAlerts> => {
  const response = await api.get('/client-alerts/dashboard/legacy');
  return response.data;
};

// Novas funções API com paginação
const getClientAlertsPaginated = async (
  pagination: PaginationRequest, 
  filters?: ClientAlertFilters
): Promise<PaginatedClientAlerts> => {
  const queryParams = PaginationUtils.buildQueryString({ ...pagination, ...filters });
  const response = await api.get(`/client-alerts?${queryParams}`);
  return response.data;
};

const getClientAlertsOffsetPaginated = async (
  pagination: OffsetPaginationRequest, 
  filters?: ClientAlertFilters
): Promise<OffsetPaginatedClientAlerts> => {
  const queryParams = PaginationUtils.buildOffsetQueryString({ ...pagination, ...filters });
  const response = await api.get(`/client-alerts/pages?${queryParams}`);
  return response.data;
};

const getClientAlertsByClientIdPaginated = async (
  clientId: string,
  pagination: PaginationRequest
): Promise<PaginatedClientAlerts> => {
  const queryParams = PaginationUtils.buildQueryString({ ...pagination, clientId });
  const response = await api.get(`/client-alerts/client/${clientId}?${queryParams}`);
  return response.data;
};

const getDashboardAlertsPaginated = async (
  pagination: PaginationRequest
): Promise<PaginatedDashboardAlerts> => {
  const queryParams = PaginationUtils.buildQueryString({ ...pagination });
  const response = await api.get(`/client-alerts/dashboard?${queryParams}`);
  return response.data.data; // API retorna { success: true, data: {...} }
};

// Hooks legados (sem paginação)
export const useCreateClientAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClientAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['client-alerts-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    },
  });
};

export const useClientAlerts = (filters?: ClientAlertFilters) => {
  return useQuery({
    queryKey: ['client-alerts', filters],
    queryFn: () => getClientAlerts(filters),
  });
};

export const useClientAlertsByClientId = (clientId: string) => {
  return useQuery({
    queryKey: ['client-alerts', 'client', clientId],
    queryFn: () => getClientAlertsByClientId(clientId),
    enabled: !!clientId,
  });
};

export const useUpdateClientAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientAlertInput }) => 
      updateClientAlert(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['client-alerts-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    },
  });
};

export const useDashboardAlerts = () => {
  return useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: getDashboardAlerts,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

// Novos hooks com paginação cursor-based
export const useClientAlertsPaginated = (
  pagination: PaginationRequest = { limit: 20 },
  filters?: ClientAlertFilters
) => {
  return useQuery({
    queryKey: ['client-alerts-paginated', pagination, filters],
    queryFn: () => getClientAlertsPaginated(pagination, filters),
  });
};

// Hook com paginação offset-based
export const useClientAlertsOffsetPaginated = (
  pagination: OffsetPaginationRequest = { page: 1, limit: 20 },
  filters?: ClientAlertFilters
) => {
  return useQuery({
    queryKey: ['client-alerts-offset-paginated', pagination, filters],
    queryFn: () => getClientAlertsOffsetPaginated(pagination, filters),
  });
};

// Hook para alertas por cliente com paginação
export const useClientAlertsByClientIdPaginated = (
  clientId: string,
  pagination: PaginationRequest = { limit: 20 }
) => {
  return useQuery({
    queryKey: ['client-alerts-paginated', 'client', clientId, pagination],
    queryFn: () => getClientAlertsByClientIdPaginated(clientId, pagination),
    enabled: !!clientId,
  });
};

// Hook para dashboard com paginação
export const useDashboardAlertsPaginated = (
  pagination: PaginationRequest = { limit: 10 }
) => {
  return useQuery({
    queryKey: ['dashboard-alerts-paginated', pagination],
    queryFn: () => getDashboardAlertsPaginated(pagination),
    refetchInterval: 5 * 60 * 1000,
  });
};

// Hook avançado com infinite query para scroll infinito
export const useClientAlertsInfinite = (
  filters?: ClientAlertFilters,
  initialLimit: number = 20
) => {
  return useInfiniteQuery({
    queryKey: ['client-alerts-infinite', filters],
    queryFn: ({ pageParam }) => 
      getClientAlertsPaginated({ 
        limit: initialLimit, 
        cursor: pageParam 
      }, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
    getPreviousPageParam: (firstPage) => 
      firstPage.pagination.hasPreviousPage ? firstPage.pagination.previousCursor : undefined,
  });
};

// Convenience mutations for status updates
export const useCompleteClientAlert = () => {
  const updateMutation = useUpdateClientAlert();
  
  return useMutation({
    mutationFn: (id: string) => updateMutation.mutateAsync({ id, input: { status: AlertStatus.COMPLETED } }),
  });
};

export const useCancelClientAlert = () => {
  const updateMutation = useUpdateClientAlert();
  
  return useMutation({
    mutationFn: (id: string) => updateMutation.mutateAsync({ id, input: { status: AlertStatus.CANCELLED } }),
  });
};