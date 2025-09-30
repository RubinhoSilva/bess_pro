import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import {
  FinancialCalculationInput,
  FinancialCalculationResult,
  CalculateFinancialsResponse,
  GetFinancialResultsResponse,
} from '../types/financial';

/**
 * Hook para calcular análise financeira avançada de um projeto
 * Envia dados para Node.js -> Python Service -> retorna resultados
 *
 * @param projectId - ID do projeto
 * @param options - Opções do hook
 * @returns Mutation hook com função de cálculo e estado
 */
export function useCalculateFinancials(projectId: string, options?: {
  saveToProject?: boolean;
  onSuccess?: (data: FinancialCalculationResult) => void;
  onError?: (error: any) => void;
}) {
  const queryClient = useQueryClient();
  const { saveToProject = true, onSuccess, onError } = options || {};

  return useMutation({
    mutationFn: async (input: FinancialCalculationInput) => {
      const response = await api.calculations.calculateProjectFinancials(
        projectId,
        input,
        saveToProject
      );
      return response.data as CalculateFinancialsResponse;
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Análise financeira calculada com sucesso!');

        // Invalida cache dos resultados salvos
        queryClient.invalidateQueries({ queryKey: ['financial-results', projectId] });

        // Chama callback de sucesso
        onSuccess?.(response.data);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ||
                      error?.message ||
                      'Erro ao calcular análise financeira';
      toast.error(message);

      // Chama callback de erro
      onError?.(error);
    },
  });
}

/**
 * Hook para recuperar últimos resultados financeiros salvos no projeto
 *
 * @param projectId - ID do projeto
 * @param options - Opções do hook
 * @returns Query hook com resultados salvos
 */
export function useFinancialResults(projectId: string, options?: {
  enabled?: boolean;
  refetchOnMount?: boolean;
}) {
  const { enabled = true, refetchOnMount = false } = options || {};

  return useQuery({
    queryKey: ['financial-results', projectId],
    queryFn: async () => {
      const response = await api.calculations.getLastFinancialResults(projectId);
      return response.data as GetFinancialResultsResponse;
    },
    enabled: enabled && !!projectId,
    refetchOnMount,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    select: (response) => response.data, // Retorna apenas os dados, não a resposta completa
  });
}

/**
 * Hook combinado que fornece tanto cálculo quanto resultados salvos
 * Útil para componentes que precisam calcular E visualizar resultados
 *
 * @param projectId - ID do projeto
 * @param options - Opções do hook
 * @returns Objeto com mutation e query combinados
 */
export function useProjectFinancials(projectId: string, options?: {
  saveToProject?: boolean;
  autoLoadResults?: boolean;
  onCalculateSuccess?: (data: FinancialCalculationResult) => void;
  onCalculateError?: (error: any) => void;
}) {
  const {
    saveToProject = true,
    autoLoadResults = true,
    onCalculateSuccess,
    onCalculateError,
  } = options || {};

  // Hook de cálculo
  const calculateMutation = useCalculateFinancials(projectId, {
    saveToProject,
    onSuccess: onCalculateSuccess,
    onError: onCalculateError,
  });

  // Hook de resultados salvos
  const resultsQuery = useFinancialResults(projectId, {
    enabled: autoLoadResults,
    refetchOnMount: false,
  });

  return {
    // Função de cálculo
    calculate: calculateMutation.mutate,
    calculateAsync: calculateMutation.mutateAsync,
    isCalculating: calculateMutation.isPending,
    calculationError: calculateMutation.error,
    calculationResult: calculateMutation.data?.data,

    // Resultados salvos
    savedResults: resultsQuery.data,
    isLoadingResults: resultsQuery.isLoading,
    resultsError: resultsQuery.error,
    refetchResults: resultsQuery.refetch,

    // Estado geral
    hasResults: !!resultsQuery.data || !!calculateMutation.data,
    currentResults: calculateMutation.data?.data || resultsQuery.data,
  };
}

/**
 * Hook para validação de entrada antes de enviar para cálculo
 * Útil para validação no frontend antes de chamar a API
 *
 * @param input - Dados de entrada
 * @returns Objeto com status de validação e mensagens de erro
 */
export function useValidateFinancialInput(input: Partial<FinancialCalculationInput>) {
  const errors: string[] = [];

  // Validar investimento
  if (input.investimento_inicial !== undefined && input.investimento_inicial <= 0) {
    errors.push('Investimento inicial deve ser maior que zero');
  }

  // Validar geração mensal
  if (input.geracao_mensal) {
    if (input.geracao_mensal.length !== 12) {
      errors.push('Geração mensal deve ter 12 valores');
    } else if (input.geracao_mensal.some(v => v < 0)) {
      errors.push('Valores de geração mensal não podem ser negativos');
    }
  }

  // Validar consumo mensal
  if (input.consumo_mensal) {
    if (input.consumo_mensal.length !== 12) {
      errors.push('Consumo mensal deve ter 12 valores');
    } else if (input.consumo_mensal.some(v => v < 0)) {
      errors.push('Valores de consumo mensal não podem ser negativos');
    }
  }

  // Validar tarifa
  if (input.tarifa_energia !== undefined && input.tarifa_energia <= 0) {
    errors.push('Tarifa de energia deve ser maior que zero');
  }

  // Validar vida útil
  if (input.vida_util !== undefined && (input.vida_util <= 0 || input.vida_util > 50)) {
    errors.push('Vida útil deve estar entre 1 e 50 anos');
  }

  // Validar taxa de desconto
  if (input.taxa_desconto !== undefined && input.taxa_desconto < 0) {
    errors.push('Taxa de desconto deve ser maior ou igual a zero');
  }

  // Validar percentuais de créditos remotos
  if (input.autoconsumo_remoto_b || input.autoconsumo_remoto_a_verde || input.autoconsumo_remoto_a_azul) {
    const percB = input.perc_creditos_b || 0;
    const percVerde = input.perc_creditos_a_verde || 0;
    const percAzul = input.perc_creditos_a_azul || 0;
    const total = percB + percVerde + percAzul;

    if (Math.abs(total - 1.0) > 0.01) {
      errors.push(`Percentuais de créditos devem somar 100% (atual: ${(total * 100).toFixed(1)}%)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    hasErrors: errors.length > 0,
  };
}