import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Types
export enum AlertType {
  FOLLOW_UP = 'follow-up',
  REMINDER = 'reminder',
  DEADLINE = 'deadline',
  CALLBACK = 'callback'
}

export enum AlertStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Alert {
  id: string;
  leadId: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  alertTime: string;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AlertInput {
  leadId: string;
  type: AlertType;
  title: string;
  message: string;
  alertTime: string; // ISO 8601 date string
}

export interface UserAlertsFilters {
  status?: AlertStatus;
  includeOverdue?: boolean;
  includeUpcoming?: boolean;
  minutesAhead?: number;
}

// API Functions
const alertApi = {
  async createAlert(data: AlertInput) {
    const response = await api.post('/alerts', data);
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async getUserAlerts(filters: UserAlertsFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/alerts?${params.toString()}`);
    return response.data.data; // API returns { success: true, data: [...] }
  },

  async updateAlertStatus(alertId: string, status: AlertStatus) {
    const response = await api.patch(`/alerts/${alertId}/status`, { status });
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async getLeadAlerts(leadId: string) {
    const response = await api.get(`/alerts/lead/${leadId}`);
    return response.data.data; // API returns { success: true, data: [...] }
  }
};

// Alert Hooks
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AlertInput) => alertApi.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['lead-alerts'] });
      toast.success('Alerta criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar alerta: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useUserAlerts(filters: UserAlertsFilters = {}) {
  return useQuery({
    queryKey: ['user-alerts', filters],
    queryFn: () => alertApi.getUserAlerts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, status }: { alertId: string; status: AlertStatus }) =>
      alertApi.updateAlertStatus(alertId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['lead-alerts'] });
      toast.success('Status do alerta atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar alerta: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useLeadAlerts(leadId: string) {
  return useQuery({
    queryKey: ['lead-alerts', leadId],
    queryFn: () => alertApi.getLeadAlerts(leadId),
    enabled: !!leadId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCompleteAlert() {
  return useUpdateAlertStatus();
}

export function useCancelAlert() {
  return useUpdateAlertStatus();
}