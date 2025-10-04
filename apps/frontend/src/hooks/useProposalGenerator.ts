import { useState } from 'react';
import axios from 'axios';

const getApiBaseUrl = () => {
  const isProduction = import.meta.env.PROD || 
                      import.meta.env.MODE === 'production' || 
                      window.location.hostname !== 'localhost';
  
  if (isProduction) {
    return 'https://api.besspro.vizad.com.br/api/v1';
  }
  
  return 'http://localhost:8010/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth-token');
      sessionStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface CreateProposalRequest {
  dimensioningId: string;
  customer: {
    name: string;
    document: string;
    address: string;
    phone?: string;
    email?: string;
    company?: string;
  };
  technical: {
    potenciaSistema: number;
    numeroModulos: number;
    numeroInversores: number;
    latitude: number;
    longitude: number;
    performanceRatio: number;
    yield: number;
    geracaoAnual: number;
    consumoAbatido: number;
    autoconsumo: number;
  };
  financial: {
    capex: number;
    vpl: number;
    tir: number;
    payback: number;
    roi: number;
    lcoe?: number;
    economiaProjetada: number;
    vidaUtil: number;
  };
  services: Array<{
    servico: string;
    descricao: string;
    valor: number;
  }>;
}

interface PreviewResponse {
  id: string;
  customer: CreateProposalRequest['customer'];
  technical: CreateProposalRequest['technical'];
  financial: CreateProposalRequest['financial'];
  services: CreateProposalRequest['services'];
  totalServices: number;
  status: string;
  createdAt: string;
}

export const useProposalGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);

  const generateProposal = async (data: CreateProposalRequest): Promise<Blob> => {
    setIsLoading(true);
    setError(null);

    try {
      // Tenta o backend primeiro
      const response = await api.post('/proposal-templates/proposals/pdf', data, {
        responseType: 'blob'
      });

      return response.data;
    } catch (err: any) {
      console.warn('Backend PDF generation failed, trying frontend fallback:', err);
      
      // Tenta fallback no frontend
      try {
        const { generatePDFProposal } = await import('../lib/pdf-generator-frontend');
        const fallbackBlob = await generatePDFProposal(data);
        
        // Notifica que usou fallback (opcional)
        console.log('PDF gerado usando fallback do frontend');
        
        return fallbackBlob;
      } catch (fallbackErr: any) {
        console.error('Fallback PDF generation also failed:', fallbackErr);
        
        // Reporta erro original do backend
        if (err.response?.data instanceof Blob) {
          try {
            const errorText = await err.response.data.text();
            const errorData = JSON.parse(errorText);
            setError(errorData.message || 'Erro ao gerar proposta');
          } catch {
            setError('Erro ao gerar proposta');
          }
        } else {
          setError(err.response?.data?.message || 'Erro ao gerar proposta');
        }
        
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const previewProposal = async (data: CreateProposalRequest): Promise<PreviewResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/proposal-templates/proposals/preview', data);
      setPreviewData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      console.error('Erro ao gerar preview:', err);
      setError(err.response?.data?.message || 'Erro ao gerar preview');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProposal = async (proposalId: string): Promise<Blob> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/proposal-templates/proposals/${proposalId}/pdf`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (err: any) {
      console.error('Erro ao buscar proposta:', err);
      setError(err.response?.data?.message || 'Erro ao buscar proposta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProposal = async (proposalId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/proposal-templates/proposals/${proposalId}`);
    } catch (err: any) {
      console.error('Erro ao excluir proposta:', err);
      setError(err.response?.data?.message || 'Erro ao excluir proposta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearPreview = () => {
    setPreviewData(null);
  };

  return {
    generateProposal,
    previewProposal,
    getProposal,
    deleteProposal,
    isLoading,
    error,
    previewData,
    clearError,
    clearPreview
  };
};