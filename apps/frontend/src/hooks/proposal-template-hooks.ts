import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proposalTemplateApi } from '../lib/api/proposal-templates';
import { 
  ProposalTemplate, 
  ProposalData,
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  GenerateProposalRequest,
  TemplateListFilter
} from '../types/proposal';
import toast from 'react-hot-toast';

// Template queries
export function useProposalTemplates(filter?: TemplateListFilter) {
  return useQuery({
    queryKey: ['proposal-templates', filter],
    queryFn: () => proposalTemplateApi.getTemplates(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProposalTemplate(id: string) {
  return useQuery({
    queryKey: ['proposal-template', id],
    queryFn: () => proposalTemplateApi.getTemplate(id),
    enabled: !!id,
  });
}

export function useProposalsByProject(projectId: string) {
  return useQuery({
    queryKey: ['project-proposals', projectId],
    queryFn: () => proposalTemplateApi.getProposalsByProject(projectId),
    enabled: !!projectId,
  });
}

// Template mutations
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: CreateTemplateRequest) => proposalTemplateApi.createTemplate(template),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar template: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: UpdateTemplateRequest) => proposalTemplateApi.updateTemplate(template),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      queryClient.setQueryData(['proposal-template', updatedTemplate.id], updatedTemplate);
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar template: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proposalTemplateApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      toast.success('Template excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir template: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useCloneTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      proposalTemplateApi.cloneTemplate(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      toast.success('Template clonado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao clonar template: ${error.response?.data?.message || error.message}`);
    }
  });
}

// Proposal generation
export function useGenerateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateProposalRequest) => proposalTemplateApi.generateProposal(request),
    onSuccess: (proposal, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-proposals', variables.projectId] });
      toast.success('Proposta gerada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao gerar proposta: ${error.response?.data?.message || error.message}`);
    }
  });
}