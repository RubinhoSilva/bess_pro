import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import {
  AdvancedProposalTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  GenerateProposalRequest,
  TemplatesListResponse,
  GeneratedProposal,
  PageSection,
  TemplateVariable
} from '../types/advanced-templates';

// Chaves das queries
export const ADVANCED_TEMPLATES_KEYS = {
  all: ['advanced-templates'] as const,
  lists: () => [...ADVANCED_TEMPLATES_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...ADVANCED_TEMPLATES_KEYS.lists(), filters] as const,
  details: () => [...ADVANCED_TEMPLATES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ADVANCED_TEMPLATES_KEYS.details(), id] as const,
};

// Serviços da API
const advancedTemplatesService = {
  getTemplates: async (params: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
    isDefault?: boolean;
    createdBy?: string;
    search?: string;
  } = {}): Promise<TemplatesListResponse> => {
    const response = await api.get('/advanced-templates', { params });
    return response.data.data;
  },

  getTemplate: async (id: string): Promise<AdvancedProposalTemplate> => {
    const response = await api.get(`/advanced-templates/${id}`);
    return response.data.data;
  },

  createTemplate: async (data: CreateTemplateRequest): Promise<AdvancedProposalTemplate> => {
    const response = await api.post('/advanced-templates', data);
    return response.data.data;
  },

  updateTemplate: async (id: string, data: UpdateTemplateRequest): Promise<AdvancedProposalTemplate> => {
    const response = await api.put(`/advanced-templates/${id}`, data);
    return response.data.data;
  },

  deleteTemplate: async (id: string, force?: boolean): Promise<void> => {
    await api.delete(`/advanced-templates/${id}`, {
      params: { force }
    });
  },

  cloneTemplate: async (id: string, name: string): Promise<AdvancedProposalTemplate> => {
    const response = await api.post(`/advanced-templates/${id}/clone`, { name });
    return response.data.data;
  },

  generateProposal: async (id: string, data: GenerateProposalRequest): Promise<GeneratedProposal | Blob> => {
    const response = await api.post(`/advanced-templates/${id}/generate`, data, {
      responseType: data.outputFormat === 'pdf' ? 'blob' : 'json'
    });
    
    if (data.outputFormat === 'pdf') {
      return response.data;
    }
    
    return response.data.data;
  }
};

// Hook para listar templates
export function useAdvancedTemplates(params: {
  page?: number;
  limit?: number;
  category?: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdBy?: string;
  search?: string;
} = {}) {
  return useQuery({
    queryKey: ADVANCED_TEMPLATES_KEYS.list(params),
    queryFn: () => advancedTemplatesService.getTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar um template específico
export function useAdvancedTemplate(id: string) {
  return useQuery({
    queryKey: ADVANCED_TEMPLATES_KEYS.detail(id),
    queryFn: () => advancedTemplatesService.getTemplate(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para criar template
export function useCreateAdvancedTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: advancedTemplatesService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADVANCED_TEMPLATES_KEYS.lists() });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao criar template';
      toast.error(message);
    },
  });
}

// Hook para atualizar template
export function useUpdateAdvancedTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateRequest }) =>
      advancedTemplatesService.updateTemplate(id, data),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ADVANCED_TEMPLATES_KEYS.lists() });
      queryClient.setQueryData(
        ADVANCED_TEMPLATES_KEYS.detail(updatedTemplate.id),
        updatedTemplate
      );
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar template';
      toast.error(message);
    },
  });
}

// Hook para deletar template
export function useDeleteAdvancedTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      advancedTemplatesService.deleteTemplate(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADVANCED_TEMPLATES_KEYS.lists() });
      toast.success('Template deletado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao deletar template';
      toast.error(message);
    },
  });
}

// Hook para clonar template
export function useCloneAdvancedTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      advancedTemplatesService.cloneTemplate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADVANCED_TEMPLATES_KEYS.lists() });
      toast.success('Template clonado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao clonar template';
      toast.error(message);
    },
  });
}

// Hook para gerar proposta
export function useGenerateProposal() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GenerateProposalRequest }) =>
      advancedTemplatesService.generateProposal(id, data),
    onSuccess: (result, variables) => {
      if (variables.data.outputFormat === 'pdf' && result instanceof Blob) {
        // Download do PDF
        const url = window.URL.createObjectURL(result);
        const link = document.createElement('a');
        link.href = url;
        link.download = `proposta-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF gerado e baixado com sucesso!');
      } else {
        toast.success('Proposta gerada com sucesso!');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao gerar proposta';
      toast.error(message);
    },
  });
}

// Hook para gerenciar estado local do editor
export function useTemplateEditor(initialTemplate?: AdvancedProposalTemplate) {
  const [template, setTemplate] = useState<Partial<AdvancedProposalTemplate>>(
    initialTemplate || {
      name: '',
      description: '',
      category: 'CUSTOM',
      sections: [],
      variables: [],
      style: {
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        accentColor: '#F59E0B',
        fontFamily: 'Inter',
        fontSize: {
          title: 32,
          heading: 24,
          body: 16,
          small: 14,
        },
        margins: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        },
      },
      pdfSettings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        headerFooter: { showHeader: true, showFooter: true, showPageNumbers: true },
      },
      features: {
        dynamicCharts: true,
        calculatedFields: true,
        conditionalSections: true,
        multilanguage: false,
      },
    }
  );

  const [isDirty, setIsDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const updateTemplate = useCallback((updates: Partial<AdvancedProposalTemplate>) => {
    setTemplate(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<PageSection>) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ) || [],
    }));
    setIsDirty(true);
  }, []);

  const addSection = useCallback((section: Omit<PageSection, 'id' | 'order'>) => {
    const newSection: PageSection = {
      ...section,
      id: `section-${Date.now()}`,
      order: (template.sections?.length || 0) + 1,
    };
    
    setTemplate(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
    setIsDirty(true);
  }, [template.sections]);

  const removeSection = useCallback((sectionId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections?.filter(section => section.id !== sectionId) || [],
    }));
    setIsDirty(true);
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setTemplate(prev => {
      const sections = [...(prev.sections || [])];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      
      // Reordenar os índices
      const reorderedSections = sections.map((section, index) => ({
        ...section,
        order: index + 1,
      }));

      return {
        ...prev,
        sections: reorderedSections,
      };
    });
    setIsDirty(true);
  }, []);

  const updateVariable = useCallback((variableKey: string, updates: Partial<TemplateVariable>) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables?.map(variable =>
        variable.key === variableKey ? { ...variable, ...updates } : variable
      ) || [],
    }));
    setIsDirty(true);
  }, []);

  const addVariable = useCallback((variable: TemplateVariable) => {
    setTemplate(prev => ({
      ...prev,
      variables: [...(prev.variables || []), variable],
    }));
    setIsDirty(true);
  }, []);

  const removeVariable = useCallback((variableKey: string) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables?.filter(variable => variable.key !== variableKey) || [],
    }));
    setIsDirty(true);
  }, []);

  const resetTemplate = useCallback(() => {
    setTemplate(initialTemplate || {});
    setIsDirty(false);
  }, [initialTemplate]);

  const markAsSaved = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    template,
    isDirty,
    previewMode,
    setPreviewMode,
    updateTemplate,
    updateSection,
    addSection,
    removeSection,
    reorderSections,
    updateVariable,
    addVariable,
    removeVariable,
    resetTemplate,
    markAsSaved,
  };
}