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

// Seletor para IRoofData completo já formatado
export const selectRoofDataComplete = (state: IProjectState) => {
  // Obter módulos solares disponíveis (precisará ser injetado externamente ou via contexto)
  // Por enquanto, vamos retornar undefined e o wizard continuará usando selectedModuleFull
  // TODO: Implementar busca de módulos no store ou passar via parâmetro
  
  return {
    aguasTelhado: state.roof?.aguasTelhado || [],
    selectedInverters: (state.system?.selectedInverters || []).map(inv => ({
      ...inv
      // Removido selectedAt: new Date() para evitar loop infinito
    })),
    location: {
      latitude: state.location?.location?.latitude,
      longitude: state.location?.location?.longitude,
      fonteDados: state.location?.fonteDados === 'manual' ? undefined : state.location?.fonteDados
    },
    system: {
      potenciaModulo: state.system?.potenciaModulo || 550,
      perdaSombreamento: state.system?.perdaSombreamento,
      perdaMismatch: state.system?.perdaMismatch,
      perdaCabeamento: state.system?.perdaCabeamento,
      perdaSujeira: state.system?.perdaSujeira,
      perdaInversor: state.system?.perdaInversor,
      perdaOutras: state.system?.perdaOutras
    },
    energy: {
      consumoAnualTotal: state.energy?.energyBills?.reduce((acc: number, bill: any) => {
        return acc + bill.consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
      }, 0) || 0
    },
    selectedModule: undefined // O selectedModuleFull será injetado no wizard
  };
};

// Seletor que aceita módulos externos para selectedModule
export const selectRoofDataCompleteWithModule = (solarModules: any[]) => (state: IProjectState) => {
  const moduleId = state.system?.selectedModuleId;
  const selectedModule = moduleId && solarModules.length > 0
    ? solarModules.find((m: any) => m.id === moduleId)
    : undefined;

  return {
    aguasTelhado: state.roof?.aguasTelhado || [],
    selectedInverters: (state.system?.selectedInverters || []).map(inv => ({
      ...inv
      // Removido selectedAt: new Date() para evitar loop infinito
    })),
    location: {
      latitude: state.location?.location?.latitude,
      longitude: state.location?.location?.longitude,
      fonteDados: state.location?.fonteDados === 'manual' ? undefined : state.location?.fonteDados
    },
    system: {
      potenciaModulo: state.system?.potenciaModulo || 550,
      perdaSombreamento: state.system?.perdaSombreamento,
      perdaMismatch: state.system?.perdaMismatch,
      perdaCabeamento: state.system?.perdaCabeamento,
      perdaSujeira: state.system?.perdaSujeira,
      perdaInversor: state.system?.perdaInversor,
      perdaOutras: state.system?.perdaOutras
    },
    energy: {
      consumoAnualTotal: state.energy?.energyBills?.reduce((acc: number, bill: any) => {
        return acc + bill.consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
      }, 0) || 0
    },
    selectedModule
  };
};

// Seletor que aceita módulo externo para dimensioningData
export const selectDimensioningDataWithModule = (selectedModule: any) => (state: IProjectState) => {
  // Preparar dados do inversor para incluir em cada água
  const selectedInverters = state.system?.selectedInverters || [];
  const inverterData = selectedInverters.length > 0 ? {
    fabricante: selectedInverters[0].inverter.manufacturer.name || 'Desconhecido',
    modelo: selectedInverters[0].inverter.model || 'Modelo',
    potencia_saida_ca_w: selectedInverters[0].inverter.power.ratedACPower || 0,
    tipo_rede: selectedInverters[0].inverter.electrical.gridType || 'Desconhecido',
    potencia_fv_max_w: selectedInverters[0].inverter.power.maxPVPower || 0,
    tensao_cc_max_v: selectedInverters[0].inverter.power.maxDCVoltage || 0,
    numero_mppt: selectedInverters[0].inverter.mppt.numberOfMppts || 1,
    strings_por_mppt: selectedInverters[0].inverter.mppt.stringsPerMppt || 1,
    eficiencia_max: selectedInverters[0].inverter.electrical.maxEfficiency || 0,
    efficiency_dc_ac: ((selectedInverters[0].inverter.electrical.maxEfficiency || 0) / 100),
    corrente_entrada_max_a: selectedInverters[0].inverter.power.maxInputCurrent || 0,
    potencia_aparente_max_va: selectedInverters[0].inverter.power.maxApparentPower || 0,
    // Parâmetros Sandia (se disponíveis no tipo compartilhado)
    vdco: undefined, // Não disponível no tipo compartilhado atualmente
    pso: undefined,
    c0: undefined,
    c1: undefined,
    c2: undefined,
    c3: undefined,
    pnt: undefined
  } : undefined;

  const aguasTelhado = state.roof?.aguasTelhado || [];

  return {
    latitude: state.location?.location?.latitude,
    longitude: state.location?.location?.longitude,
    fonteDados: state.location?.fonteDados,
    aguasTelhado: aguasTelhado.map((a: any) => ({
      id: a.id,
      nome: a.nome,
      orientacao: a.orientacao,
      inclinacao: a.inclinacao,
      numeroModulos: a.numeroModulos || 0,
      sombreamentoParcial: a.sombreamentoParcial || 0,
      inversorId: a.inversorId,
      mpptNumero: a.mpptNumero,
      inversor: inverterData
    })),
    potenciaModulo: selectedModule ? selectedModule.nominalPower : state.system?.potenciaModulo,
    energyBills: state.energy?.energyBills || [{
      consumoMensal: [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500] // 6000 kWh/ano padrão
    }],
    selectedModules: selectedModule ? [({
      fabricante: selectedModule.manufacturer.name,
      modelo: selectedModule.model,
      potencia_nominal_w: selectedModule.nominalPower,
      largura_mm: selectedModule.dimensions.widthMm,
      altura_mm: selectedModule.dimensions.heightMm,
      peso_kg: selectedModule.dimensions.weightKg,
      vmpp: selectedModule.specifications.vmpp,
      impp: selectedModule.specifications.impp,
      voc_stc: selectedModule.specifications.voc,
      isc_stc: selectedModule.specifications.isc,
      eficiencia: selectedModule.specifications.efficiency,
      temp_coef_pmax: selectedModule.parameters.temperature.tempCoeffPmax,
      alpha_sc: selectedModule.parameters.temperature.tempCoeffIsc / 100,
      beta_oc: selectedModule.parameters.temperature.tempCoeffVoc / 100,
      gamma_r: selectedModule.parameters.temperature.tempCoeffPmax / 100,
      cells_in_series: selectedModule.specifications.numberOfCells,
      a_ref: selectedModule.parameters.diode.aRef,
      il_ref: selectedModule.parameters.diode.iLRef,
      io_ref: selectedModule.parameters.diode.iORef,
      rs: selectedModule.parameters.diode.rS,
      rsh_ref: selectedModule.parameters.diode.rShRef,
      material: selectedModule.parameters.spectral.material,
      technology: selectedModule.specifications.technology
    })] : [],
    modelo_decomposicao: 'louche',
    modelo_transposicao: 'perez',
    perdas_sistema: ((state.system?.perdaSombreamento || 3) + (state.system?.perdaMismatch || 2) + (state.system?.perdaCabeamento || 2) + (state.system?.perdaSujeira || 5) + (state.system?.perdaInversor || 3) + (state.system?.perdaOutras || 0)),
    fator_seguranca: 1.1,
    perdaSombreamento: state.system?.perdaSombreamento,
    perdaMismatch: state.system?.perdaMismatch,
    perdaCabeamento: state.system?.perdaCabeamento,
    perdaSujeira: state.system?.perdaSujeira,
    perdaInversor: state.system?.perdaInversor,
    perdaOutras: state.system?.perdaOutras
  };
};

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

// Seletor para formatar inversores para cálculos MPPT
export const selectInvertersForMPPT = (state: IProjectState) => {
  const selectedInverters = state.system?.selectedInverters || [];
  
  return selectedInverters.map(inv => ({
    id: inv.inverter.id,
    fabricante: inv.inverter.manufacturer.name || 'Desconhecido',
    modelo: inv.inverter.model || 'Modelo',
    potenciaSaidaCA: inv.inverter.power.ratedACPower || 0,
    potenciaFvMax: inv.inverter.power.maxPVPower || 0,
    tensaoCcMax: inv.inverter.power.maxDCVoltage || 0,
    numeroMppt: inv.inverter.mppt.numberOfMppts || 1,
    stringsPorMppt: inv.inverter.mppt.stringsPerMppt || 1,
    correnteEntradaMax: inv.inverter.power.maxInputCurrent || 0,
    faixaMpptMin: inv.inverter.mppt.mpptRange ? parseInt(inv.inverter.mppt.mpptRange.split('-')[0]) : 0,
    faixaMpptMax: inv.inverter.mppt.mpptRange ? parseInt(inv.inverter.mppt.mpptRange.split('-')[1]) : 0,
    tipoRede: inv.inverter.electrical.gridType || 'Desconhecido'
  }));
};

// Seletores para dados agregados das águas do telhado
export const selectAggregatedRoofData = (state: IProjectState) => {
  const aguasTelhado = state.roof?.aguasTelhado || [];
  const potenciaModulo = state.system?.potenciaModulo || 550;
  
  // Calcular totais das águas do telhado
  const totalModulos = aguasTelhado.reduce((total: number, agua: any) => total + (agua.numeroModulos || 0), 0);
  const totalGeracao = aguasTelhado.reduce((total: number, agua: any) => total + (agua.geracaoAnual || 0), 0);
  const totalArea = aguasTelhado.reduce((total: number, agua: any) => total + (agua.areaCalculada || 0), 0);
  const potenciaPico = (totalModulos * potenciaModulo) / 1000; // kWp
  
  // Calcular consumo total anual
  const consumoTotalAnual = state.energy?.energyBills?.reduce((acc: number, bill: any) => {
    return acc + bill.consumoMensal.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0);
  }, 0) || 0;
  
  // Calcular cobertura percentual
  const cobertura = consumoTotalAnual > 0 ? (totalGeracao / consumoTotalAnual) * 100 : 0;
  
  return {
    totalModulos,
    totalGeracao,
    totalArea,
    potenciaPico,
    consumoTotalAnual,
    cobertura,
    geracaoMensal: Array(12).fill(totalGeracao / 12), // Distribuição igual (pode ser melhorada depois)
    aguasTelhado, // Manter array original para referência
    calculado: aguasTelhado.some((agua: any) => agua.geracaoAnual > 0) // Verificar se já foi calculado
  };
};

// Seletor específico para o SystemSummary
export const selectSystemSummaryData = (state: IProjectState) => {
  const aggregatedData = selectAggregatedRoofData(state);
  
  return {
    potenciaPico: aggregatedData.potenciaPico,
    numeroModulos: aggregatedData.totalModulos,
    areaEstimada: aggregatedData.totalArea,
    geracaoEstimadaAnual: aggregatedData.totalGeracao,
    selectedInverters: state.system?.selectedInverters || [],
    selectedModule: state.system?.selectedModuleId, // Apenas o ID, o componente buscará o objeto completo
    consumoTotalAnual: aggregatedData.consumoTotalAnual,
    cobertura: aggregatedData.cobertura
  };
};

// Seletor para dados do cálculo (handleCalculate pode salvar apenas o flag)
export const selectCalculationFlag = (state: IProjectState) => ({
  calculado: !!state.results?.calculationResults?.potenciaPico,
  calculadoEm: state.results?.calculationResults // Para possíveis metadados futuros
});