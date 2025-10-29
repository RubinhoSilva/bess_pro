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
    mutationFn: (file: File) =>
      companyProfileService.uploadMyCompanyLogo(file),
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