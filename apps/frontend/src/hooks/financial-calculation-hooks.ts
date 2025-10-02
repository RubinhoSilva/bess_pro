import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';
import {
  FinancialCalculationInput,
  FinancialCalculationResult,
  CalculateFinancialsResponse,
  GetFinancialResultsResponse,
} from '../types/financial';

/**
 * Hook para calcular an�lise financeira avan�ada de um projeto
 * Envia dados para Node.js -> Python Service -> retorna resultados
 *
 * @param projectId - ID do projeto
 * @param options - Op��es do hook
 * @returns Mutation hook com fun��o de c�lculo e estado
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
      const response = await apiClient.calculations.calculateProjectFinancials(
        projectId,
        input,
        saveToProject
      );
      return response.data as CalculateFinancialsResponse;
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'An�lise financeira calculada com sucesso!');

        // Invalida cache dos resultados salvos
        queryClient.invalidateQueries({ queryKey: ['financial-results', projectId] });

        // Chama callback de sucesso
        onSuccess?.(response.data);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ||
                      error?.message ||
                      'Erro ao calcular an�lise financeira';
      toast.error(message);

      // Chama callback de erro
      onError?.(error);
    },
  });
}

/**
 * Hook para recuperar �ltimos resultados financeiros salvos no projeto
 *
 * @param projectId - ID do projeto
 * @param options - Op��es do hook
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
      const response = await apiClient.calculations.getLastFinancialResults(projectId);
      return response.data as GetFinancialResultsResponse;
    },
    enabled: enabled && !!projectId,
    refetchOnMount,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    select: (response) => response.data, // Retorna apenas os dados, n�o a resposta completa
  });
}

/**
 * Hook combinado que fornece tanto c�lculo quanto resultados salvos
 * �til para componentes que precisam calcular E visualizar resultados
 *
 * @param projectId - ID do projeto
 * @param options - Op��es do hook
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

  // Hook de c�lculo
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
    // Fun��o de c�lculo
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
 * Hook para valida��o de entrada antes de enviar para c�lculo
 * �til para valida��o no frontend antes de chamar a API
 *
 * @param input - Dados de entrada
 * @returns Objeto com status de valida��o e mensagens de erro
 */
export function useValidateFinancialInput(input: Partial<FinancialCalculationInput>) {
  const errors: string[] = [];

  // Validar investimento
  if (input.investimentoInicial !== undefined && input.investimentoInicial <= 0) {
    errors.push('Investimento inicial deve ser maior que zero');
  }

  // Validar geração mensal
  if (input.geracaoMensal) {
    if (input.geracaoMensal.length !== 12) {
      errors.push('Geração mensal deve ter 12 valores');
    } else if (input.geracaoMensal.some((v: number) => v < 0)) {
      errors.push('Valores de geração mensal não podem ser negativos');
    }
  }

  // Validar consumo mensal
  if (input.consumoMensal) {
    if (input.consumoMensal.length !== 12) {
      errors.push('Consumo mensal deve ter 12 valores');
    } else if (input.consumoMensal.some((v: number) => v < 0)) {
      errors.push('Valores de consumo mensal não podem ser negativos');
    }
  }

  // Validar tarifa
  if (input.tarifaEnergia !== undefined && input.tarifaEnergia <= 0) {
    errors.push('Tarifa de energia deve ser maior que zero');
  }

  // Validar vida útil
  if (input.vidaUtil !== undefined && (input.vidaUtil <= 0 || input.vidaUtil > 50)) {
    errors.push('Vida útil deve estar entre 1 e 50 anos');
  }

  // Validar taxa de desconto
  if (input.taxaDesconto !== undefined && input.taxaDesconto < 0) {
    errors.push('Taxa de desconto deve ser maior ou igual a zero');
  }

  // Validar percentuais de créditos remotos
  if (input.autoconsumoRemotoB || input.autoconsumoRemotoAVerde || input.autoconsumoRemotoAAzul) {
    const percB = input.percCreditosB || 0;
    const percVerde = input.percCreditosAVerde || 0;
    const percAzul = input.percCreditosAAzul || 0;
    const total = percB + percVerde + percAzul;

    if (Math.abs(total - 1.0) > 0.01) {
      errors.push(`Percentuais de cr�ditos devem somar 100% (atual: ${(total * 100).toFixed(1)}%)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    hasErrors: errors.length > 0,
  };
}