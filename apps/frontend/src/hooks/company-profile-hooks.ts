/**
 * Company Profile React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { companyProfileService } from '../services/CompanyProfileService';
import {
  CompanyProfile,
  CompanyProfileListResponse,
  CreateCompanyProfileRequest,
  UpdateCompanyProfileRequest,
  UploadCompanyLogoRequest,
  UploadCompanyLogoResponse
} from '@bess-pro/shared';

// Query keys
export const COMPANY_PROFILE_KEYS = {
  all: ['company-profiles'] as const,
  lists: () => [...COMPANY_PROFILE_KEYS.all, 'lists'] as const,
  me: () => [...COMPANY_PROFILE_KEYS.all, 'me'] as const,
};

// Hook para buscar o perfil de empresa do Team atual
export function useMyCompanyProfile() {
  return useQuery({
    queryKey: COMPANY_PROFILE_KEYS.me(),
    queryFn: () => companyProfileService.getMyCompanyProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para criar um perfil de empresa
export function useCreateCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyProfileRequest) =>
      companyProfileService.createCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_PROFILE_KEYS.me() });
    },
    onError: (error) => {
      toast.error('Erro ao criar perfil da empresa');
      console.error('Error creating company profile:', error);
    },
  });
}

// Hook para atualizar o perfil de empresa do Team atual
export function useUpdateMyCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyProfileRequest) =>
      companyProfileService.updateMyCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_PROFILE_KEYS.me() });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar perfil da empresa');
      console.error('Error updating company profile:', error);
    },
  });
}

// Hook para deletar o perfil de empresa do Team atual
export function useDeleteMyCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hardDelete?: boolean) =>
      companyProfileService.deleteMyCompanyProfile(hardDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_PROFILE_KEYS.me() });
    },
    onError: (error) => {
      toast.error('Erro ao deletar perfil da empresa');
      console.error('Error deleting company profile:', error);
    },
  });
}

// Hook para fazer upload do logo do Team atual
export function useUploadMyCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      companyProfileService.uploadMyCompanyLogo(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_PROFILE_KEYS.me() });
    },
    onError: (error) => {
      toast.error('Erro ao fazer upload do logo');
      console.error('Error uploading company logo:', error);
    },
  });
}

// Hook para deletar o logo do Team atual
export function useDeleteMyCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => companyProfileService.deleteMyCompanyLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_PROFILE_KEYS.me() });
    },
    onError: (error) => {
      toast.error('Erro ao deletar logo');
      console.error('Error deleting company logo:', error);
    },
  });
}


// Hook custom para gerenciar formulário de perfil de empresa
export function useCompanyProfileForm(initialData?: Partial<CompanyProfile>) {
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    companyName: '',
    tradingName: '',
    taxId: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    // Novos campos para proposta
    mission: '',
    foundedYear: '',
    completedProjectsCount: '',
    totalInstalledPower: '',
    satisfiedClientsCount: '',
    companyNotes: '',
    ...(initialData as any),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev: Partial<CompanyProfile>) => ({
      ...prev,
      [field]: value,
    }));
    
    // Limpar erro do campo quando ele for atualizado
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const updateNestedField = useCallback((parent: string, field: string, value: any) => {
    setFormData((prev: Partial<CompanyProfile>) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof CompanyProfile] as any),
        [field]: value,
      },
    }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Nome é obrigatório';
    }

    if (!formData.taxId?.trim()) {
      newErrors.taxId = 'CNPJ é obrigatório';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      companyName: '',
      tradingName: '',
      taxId: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil',
      // Novos campos para proposta
      mission: '',
      foundedYear: '',
      completedProjectsCount: '',
      totalInstalledPower: '',
      satisfiedClientsCount: '',
      companyNotes: '',
      ...(initialData as any),
    });
    setErrors({});
  }, [initialData]);

  return {
    formData,
    errors,
    updateField,
    updateNestedField,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

// Hook para gerenciar o estado de upload de logo com preview e progresso
export function useLogoUpload() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const uploadLogo = useUploadMyCompanyLogo();

  // Limpar preview quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File) => {
    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens JPG, PNG, GIF ou WebP são permitidas');
      return false;
    }
    
    // Validação do tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return false;
    }

    // Criar preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    return true;
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadLogo.mutateAsync({
        file: selectedFile,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      toast.success('Logo atualizado com sucesso!');
      clearPreview();
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, uploadLogo]);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadProgress(0);
  }, [previewUrl]);

  return {
    previewUrl,
    selectedFile,
    uploadProgress,
    isUploading,
    handleFileSelect,
    handleUpload,
    clearPreview,
    hasPreview: !!previewUrl,
  };
}