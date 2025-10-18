import { useCallback } from 'react';
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';
import { 
  selectCustomerData,
  selectEnergyData,
  selectLocationData,
  selectSystemData,
  selectBudgetData,
  selectValidationState
} from '@/store/selectors/pv-dimensioning-selectors';

export const usePVDimensioningValidation = () => {
  // Usar seletores para evitar re-renders desnecessários
  const customer = usePVDimensioningStore(selectCustomerData);
  const energy = usePVDimensioningStore(selectEnergyData);
  const location = usePVDimensioningStore(selectLocationData);
  const system = usePVDimensioningStore(selectSystemData);
  const budget = usePVDimensioningStore(selectBudgetData);
  const validation = usePVDimensioningStore(selectValidationState);
  
  // Ações da store
  const {
    validateCurrentStep,
    validateAllSteps,
    clearValidationErrors
  } = usePVDimensioningStore();
  
  // Validar dados do cliente
  const validateCustomerData = useCallback(() => {
    const errors: string[] = [];
    
    if (!customer?.dimensioningName?.trim()) {
      errors.push('Nome do dimensionamento é obrigatório');
    }
    
    if (!customer?.customer?.name?.trim()) {
      errors.push('Nome do cliente é obrigatório');
    }
    
    if (!customer?.customer?.email?.trim()) {
      errors.push('Email do cliente é obrigatório');
    }
    
    if (customer?.customer?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customer.email)) {
      errors.push('Email inválido');
    }
    
    return errors;
  }, [customer]);
  
  // Validar dados de energia
  const validateEnergyData = useCallback(() => {
    const errors: string[] = [];
    
    if (!energy?.energyBills?.length) {
      errors.push('É necessário adicionar pelo menos uma conta de energia');
    }
    
    if (energy?.energyBills?.every(bill => 
      !bill.consumoMensal.some(c => c > 0)
    )) {
      errors.push('Pelo menos uma conta deve ter consumo > 0');
    }
    
    energy?.energyBills?.forEach((bill, index) => {
      if (!bill.consumoMensal || bill.consumoMensal.length !== 12) {
        errors.push(`Conta ${index + 1}: Dados mensais incompletos`);
      }
    });
    
    return errors;
  }, [energy]);
  
  // Validar dados de localização
  const validateLocationData = useCallback(() => {
    const errors: string[] = [];
    
    if (!location?.location?.latitude || location.location.latitude < -90 || location.location.latitude > 90) {
      errors.push('Latitude inválida (deve estar entre -90 e 90)');
    }
    
    if (!location?.location?.longitude || location.location.longitude < -180 || location.location.longitude > 180) {
      errors.push('Longitude inválida (deve estar entre -180 e 180)');
    }
    
    if (!location?.irradiacaoMensal || location.irradiacaoMensal.length !== 12) {
      errors.push('Dados de irradiação mensal incompletos');
    }
    
    if (location?.irradiacaoMensal?.some(v => v <= 0)) {
      errors.push('Todos os meses devem ter irradiação > 0');
    }
    
    return errors;
  }, [location]);
  
  // Validar dados do sistema
  const validateSystemData = useCallback(() => {
    const errors: string[] = [];
    
    if (!system?.selectedModuleId) {
      errors.push('Seleção de módulo é obrigatória');
    }
    
    if (!system?.selectedInverters?.length) {
      errors.push('Seleção de inversor é obrigatória');
    }
    
    if (!system?.potenciaModulo || system.potenciaModulo <= 0) {
      errors.push('Potência do módulo deve ser > 0');
    }
    
    if (system?.potenciaModulo && system.potenciaModulo > 1000) {
      errors.push('Potência do módulo parece muito alta (verifique a unidade)');
    }
    
    if (!system?.eficienciaSistema || system.eficienciaSistema <= 0 || system.eficienciaSistema > 100) {
      errors.push('Eficiência do sistema deve estar entre 0 e 100%');
    }
    
    return errors;
  }, [system]);
  
  // Validar dados do orçamento
  const validateBudgetData = useCallback(() => {
    const errors: string[] = [];
    
    const subtotal = (budget?.custoEquipamento || 0) +
                   (budget?.custoMateriais || 0) +
                   (budget?.custoMaoDeObra || 0);
    const total = subtotal * (1 + (budget?.bdi || 0) / 100);
    
    if (total <= 0) {
      errors.push('Investimento total deve ser > 0');
    }
    
    if (budget?.paymentMethod && !['vista', 'cartao', 'financiamento'].includes(budget.paymentMethod)) {
      errors.push('Método de pagamento inválido');
    }
    
    if (budget?.cardInstallments && (budget.cardInstallments < 1 || budget.cardInstallments > 12)) {
      errors.push('Parcelas do cartão devem estar entre 1 e 12');
    }
    
    if (budget?.cardInterest && (budget.cardInterest < 0 || budget.cardInterest > 20)) {
      errors.push('Juros do cartão devem estar entre 0 e 20%');
    }
    
    return errors;
  }, [budget]);
  
  // Validar etapa específica
  const validateStep = useCallback((step: number) => {
    switch (step) {
      case 1:
        return validateCustomerData();
      case 2:
        return validateEnergyData();
      case 3:
        return validateLocationData();
      case 4:
        return validateSystemData();
      case 5:
        return []; // Águas de telhado é opcional
      case 6:
        return validateBudgetData();
      case 7:
        return []; // Resultados são calculados
      default:
        return [];
    }
  }, [validateCustomerData, validateEnergyData, validateLocationData, validateSystemData, validateBudgetData]);
  
  // Validar todas as etapas
  const validateAllStepsCustom = useCallback(() => {
    const allErrors: Record<number, string[]> = {};
    
    allErrors[1] = validateCustomerData();
    allErrors[2] = validateEnergyData();
    allErrors[3] = validateLocationData();
    allErrors[4] = validateSystemData();
    allErrors[5] = []; // Águas de telhado é opcional
    allErrors[6] = validateBudgetData();
    allErrors[7] = []; // Resultados são calculados
    
    return allErrors;
  }, [validateCustomerData, validateEnergyData, validateLocationData, validateSystemData, validateBudgetData]);
  
  // Verificar se uma etapa específica tem erros
  const hasStepErrors = useCallback((step: number) => {
    const errors = validation.validationErrors[step] || [];
    return errors.length > 0;
  }, [validation.validationErrors]);
  
  // Obter erros de uma etapa específica
  const getStepErrors = useCallback((step: number) => {
    return validation.validationErrors[step] || [];
  }, [validation.validationErrors]);
  
  // Verificar se o formulário atual é válido
  const isCurrentFormValid = useCallback(() => {
    const currentStep = usePVDimensioningStore.getState().currentStep;
    return !hasStepErrors(currentStep);
  }, [hasStepErrors]);
  
  // Verificar se todas as etapas obrigatórias estão válidas
  const areAllRequiredStepsValid = useCallback(() => {
    const allErrors = validateAllStepsCustom();
    const requiredSteps = [1, 2, 3, 4, 6]; // Etapas 5 e 7 são opcionais
    
    return requiredSteps.every(step => {
      const errors = allErrors[step] || [];
      return errors.length === 0;
    });
  }, [validateAllStepsCustom]);
  
  // Validar e retornar resumo do estado atual
  const getValidationSummary = useCallback(() => {
    const allErrors = validateAllStepsCustom();
    const totalErrors = Object.values(allErrors).reduce((sum, errors) => sum + errors.length, 0);
    const stepsWithErrors = Object.entries(allErrors)
      .filter(([_, errors]) => errors.length > 0)
      .map(([step, _]) => parseInt(step));
    
    return {
      totalErrors,
      stepsWithErrors,
      isValid: totalErrors === 0,
      allErrors
    };
  }, [validateAllStepsCustom]);
  
  return {
    // Estado de validação
    isValid: validation.isValid,
    validationErrors: validation.validationErrors,
    
    // Validadores por etapa
    customer: customer ? validateCustomerData() : [],
    energy: energy ? validateEnergyData() : [],
    location: location ? validateLocationData() : [],
    system: system ? validateSystemData() : [],
    roof: [], // Águas de telhado é opcional
    budget: budget ? validateBudgetData() : [],
    results: [], // Resultados são calculados
    
    // Métodos de validação
    validateStep,
    validateAllSteps: validateAllStepsCustom,
    validateCurrentStep,
    clearValidationErrors,
    
    // Utilitários
    hasStepErrors,
    getStepErrors,
    isCurrentFormValid,
    areAllRequiredStepsValid,
    getValidationSummary
  };
};