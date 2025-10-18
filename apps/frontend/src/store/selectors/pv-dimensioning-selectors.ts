import { shallow } from 'zustand/shallow';
import { IProjectState } from '../pv-dimensioning-store';

// Seletores para dados específicos (evita re-renders desnecessários)
export const selectCustomerData = (state: IProjectState) => state.customer;
export const selectEnergyData = (state: IProjectState) => state.energy;
export const selectLocationData = (state: IProjectState) => state.location;
export const selectSystemData = (state: IProjectState) => state.system;
export const selectRoofData = (state: IProjectState) => state.roof;
export const selectBudgetData = (state: IProjectState) => state.budget;
export const selectResultsData = (state: IProjectState) => state.results;

// Seletores para estado de navegação
export const selectNavigationState = (state: IProjectState) => ({
  currentStep: state.currentStep,
  completedSteps: state.completedSteps,
  canAdvance: state.canAdvance,
  canGoBack: state.canGoBack
});

// Seletores para estado de validação
export const selectValidationState = (state: IProjectState) => ({
  validationErrors: state.validationErrors,
  isValid: state.isValid
});

// Seletores para estado de carregamento
export const selectLoadingState = (state: IProjectState) => ({
  isLoading: state.isLoading,
  isCalculating: state.isCalculating
});

// Seletores para metadados
export const selectMetadataState = (state: IProjectState) => ({
  lastSavedAt: state.lastSavedAt,
  isDirty: state.isDirty,
  autoSaveEnabled: state.autoSaveEnabled,
  dimensioningId: state.dimensioningId
});

// Seletores compostos para uso comum
export const selectStepData = (step: number) => (state: IProjectState) => {
  const stepData = {
    customer: state.customer,
    energy: state.energy,
    location: state.location,
    system: state.system,
    roof: state.roof,
    budget: state.budget,
    results: state.results
  };
  
  switch (step) {
    case 1: return { customer: stepData.customer };
    case 2: return { customer: stepData.customer, energy: stepData.energy };
    case 3: return { customer: stepData.customer, energy: stepData.energy, location: stepData.location };
    case 4: return { customer: stepData.customer, energy: stepData.energy, location: stepData.location, system: stepData.system };
    case 5: return { customer: stepData.customer, energy: stepData.energy, location: stepData.location, system: stepData.system, roof: stepData.roof };
    case 6: return { customer: stepData.customer, energy: stepData.energy, location: stepData.location, system: stepData.system, roof: stepData.roof, budget: stepData.budget };
    case 7: return { customer: stepData.customer, energy: stepData.energy, location: stepData.location, system: stepData.system, roof: stepData.roof, budget: stepData.budget, results: stepData.results };
    default: return {};
  }
};

// Seletores para estado completo (para casos específicos que precisam de tudo)
export const selectFullState = (state: IProjectState) => state;

// Seletores para dados de persistência (otimizado para o middleware persist)
export const selectPersistState = (state: IProjectState) => ({
  customer: state.customer,
  energy: state.energy,
  location: state.location,
  system: state.system,
  roof: state.roof,
  budget: state.budget,
  results: state.results,
  currentStep: state.currentStep,
  completedSteps: Array.from(state.completedSteps),
  dimensioningId: state.dimensioningId,
  lastSavedAt: state.lastSavedAt,
  autoSaveEnabled: state.autoSaveEnabled
});

// Seletores otimizados com shallow comparison para uso em componentes
// Estes seletores devem ser usados com o middleware shallow do Zustand
export const selectCustomerDataShallow = (state: IProjectState) => state.customer;
export const selectEnergyDataShallow = (state: IProjectState) => state.energy;
export const selectLocationDataShallow = (state: IProjectState) => state.location;
export const selectSystemDataShallow = (state: IProjectState) => state.system;
export const selectRoofDataShallow = (state: IProjectState) => state.roof;
export const selectBudgetDataShallow = (state: IProjectState) => state.budget;
export const selectResultsDataShallow = (state: IProjectState) => state.results;

// Seletores compostos com shallow comparison
export const selectNavigationStateShallow = (state: IProjectState) => ({
  currentStep: state.currentStep,
  completedSteps: state.completedSteps,
  canAdvance: state.canAdvance,
  canGoBack: state.canGoBack
});

export const selectValidationStateShallow = (state: IProjectState) => ({
  validationErrors: state.validationErrors,
  isValid: state.isValid
});

export const selectLoadingStateShallow = (state: IProjectState) => ({
  isLoading: state.isLoading,
  isCalculating: state.isCalculating
});

// Função auxiliar para criar seletores com shallow comparison
export const createShallowSelector = <T>(selector: (state: IProjectState) => T) =>
  (state: IProjectState) => selector(state);

// Seletores combinados com shallow para performance
export const selectCustomerAndNavigation = createShallowSelector((state: IProjectState) => ({
  customer: state.customer,
  currentStep: state.currentStep,
  canAdvance: state.canAdvance,
  canGoBack: state.canGoBack
}));

export const selectSystemAndBudget = createShallowSelector((state: IProjectState) => ({
  system: state.system,
  budget: state.budget,
  isCalculating: state.isCalculating
}));

export const selectLocationAndSystem = createShallowSelector((state: IProjectState) => ({
  location: state.location,
  system: state.system,
  isValid: state.isValid
}));