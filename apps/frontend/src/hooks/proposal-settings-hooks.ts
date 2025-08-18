import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Types
export interface ProposalSettings {
  id: string;
  userId: string;
  showIntroduction: boolean;
  showTechnicalAnalysis: boolean;
  showFinancialAnalysis: boolean;
  showCoverPage: boolean;
  showSolarAdvantages: boolean;
  showTechnicalSummary: boolean;
  showEquipmentDetails: boolean;
  showGenerationProjection: boolean;
  showInvestmentDetails: boolean;
  showFinancialIndicators: boolean;
  showPaymentConditions: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalSettingsInput {
  showIntroduction?: boolean;
  showTechnicalAnalysis?: boolean;
  showFinancialAnalysis?: boolean;
  showCoverPage?: boolean;
  showSolarAdvantages?: boolean;
  showTechnicalSummary?: boolean;
  showEquipmentDetails?: boolean;
  showGenerationProjection?: boolean;
  showInvestmentDetails?: boolean;
  showFinancialIndicators?: boolean;
  showPaymentConditions?: boolean;
}

// API Functions
const proposalSettingsApi = {
  async getSettings() {
    const response = await api.get('/proposal-settings');
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async createSettings(data: ProposalSettingsInput) {
    const response = await api.post('/proposal-settings', data);
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async updateSettings(data: ProposalSettingsInput) {
    const response = await api.put('/proposal-settings', data);
    return response.data.data; // API returns { success: true, data: {...} }
  }
};

// Hooks
export function useProposalSettings() {
  return useQuery({
    queryKey: ['proposal-settings'],
    queryFn: () => proposalSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProposalSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProposalSettingsInput) => proposalSettingsApi.createSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-settings'] });
      toast.success('Configurações de proposta criadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar configurações: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useUpdateProposalSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProposalSettingsInput) => proposalSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-settings'] });
      toast.success('Configurações de proposta atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar configurações: ${error.response?.data?.message || error.message}`);
    }
  });
}