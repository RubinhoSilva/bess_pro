import { useCallback } from 'react';
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';
import { 
  selectNavigationState, 
  selectValidationState,
  selectLoadingState 
} from '@/store/selectors/pv-dimensioning-selectors';

export const usePVDimensioningNavigation = () => {
  // Usar seletores para evitar re-renders desnecessários
  const navigation = usePVDimensioningStore(selectNavigationState);
  const validation = usePVDimensioningStore(selectValidationState);
  const loading = usePVDimensioningStore(selectLoadingState);
  
  // Ações da store
  const {
    goToStep,
    nextStep,
    previousStep,
    resetWizard,
    validateCurrentStep
  } = usePVDimensioningStore();
  
  // Verificar se a etapa está completa
  const isStepCompleted = useCallback((step: number) => {
    return navigation.completedSteps.has(step);
  }, [navigation.completedSteps]);
  
  // Verificar se a etapa é válida
  const isStepValid = useCallback((step: number) => {
    const errors = validation.validationErrors[step] || [];
    return errors.length === 0;
  }, [validation.validationErrors]);
  
  // Ir para a próxima etapa válida
  const goToNextValidStep = useCallback(() => {
    for (let step = navigation.currentStep + 1; step <= 7; step++) {
      if (isStepCompleted(step) || isStepValid(step)) {
        goToStep(step);
        break;
      }
    }
  }, [navigation.currentStep, isStepCompleted, isStepValid, goToStep]);
  
  // Verificar se pode avançar para a próxima etapa
  const canGoToNext = useCallback(() => {
    return navigation.canAdvance && navigation.currentStep < 7;
  }, [navigation.canAdvance, navigation.currentStep]);
  
  // Verificar se pode voltar para a etapa anterior
  const canGoToPrevious = useCallback(() => {
    return navigation.canGoBack && navigation.currentStep > 1;
  }, [navigation.canGoBack, navigation.currentStep]);
  
  // Obter progresso
  const getProgress = useCallback(() => {
    return {
      current: navigation.currentStep,
      completed: navigation.completedSteps.size,
      total: 7,
      percentage: (navigation.completedSteps.size / 7) * 100
    };
  }, [navigation.currentStep, navigation.completedSteps]);
  
  // Navegação segura com validação
  const safeGoToStep = useCallback((step: number) => {
    // Validar se pode ir para o passo
    if (step < 1 || step > 7) {
      return false;
    }
    
    // Validar dependências
    if (!navigation.canGoBack && step < navigation.currentStep) {
      return false;
    }
    
    // Validar passos anteriores
    for (let i = 1; i < step; i++) {
      if (!navigation.completedSteps.has(i)) {
        return false;
      }
    }
    
    goToStep(step);
    return true;
  }, [navigation.canGoBack, navigation.currentStep, navigation.completedSteps, goToStep]);
  
  // Avançar para próxima etapa com validação
  const safeNextStep = useCallback(() => {
    if (canGoToNext()) {
      return safeGoToStep(navigation.currentStep + 1);
    }
    return false;
  }, [canGoToNext, navigation.currentStep, safeGoToStep]);
  
  // Voltar para etapa anterior com validação
  const safePreviousStep = useCallback(() => {
    if (canGoToPrevious()) {
      return safeGoToStep(navigation.currentStep - 1);
    }
    return false;
  }, [canGoToPrevious, navigation.currentStep, safeGoToStep]);
  
  // Pular para etapa específica com validação de todas as anteriores
  const jumpToStep = useCallback((step: number) => {
    // Validar se todas as etapas anteriores estão completas
    for (let i = 1; i < step; i++) {
      if (!isStepCompleted(i) && !isStepValid(i)) {
        return false;
      }
    }
    
    return safeGoToStep(step);
  }, [isStepCompleted, isStepValid, safeGoToStep]);
  
  return {
    // Estado de navegação
    currentStep: navigation.currentStep,
    completedSteps: navigation.completedSteps,
    canAdvance: navigation.canAdvance,
    canGoBack: navigation.canGoBack,
    isLoading: loading.isLoading,
    isCalculating: loading.isCalculating,
    
    // Estado de validação
    isValid: validation.isValid,
    validationErrors: validation.validationErrors,
    
    // Ações de navegação básicas
    goToStep: safeGoToStep,
    nextStep: safeNextStep,
    previousStep: safePreviousStep,
    resetWizard,
    
    // Ações de navegação avançadas
    goToNextValidStep,
    jumpToStep,
    
    // Utilitários
    isStepCompleted,
    isStepValid,
    canGoToNext,
    canGoToPrevious,
    getProgress,
    validateCurrentStep
  };
};