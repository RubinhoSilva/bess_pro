import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ProjectType, ProjectData, CreateProjectData } from '@/types/project';
import { EnergyBillA, EnergyBillB } from '@/types/energy-bill-types';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

// Interfaces baseadas no documento de arquitetura
export interface ICustomerData {
  customer?: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    id?: string;
  };
  dimensioningName: string;
  // Campos de tarifação e instalação
  grupoTarifario: string;
  subgrupoTarifario: string;
  concessionaria: string;
  tipoRede: string;
  tensaoRede: string;
  tipoTelhado: string;
  fatorSimultaneidade: number;
  // Campos de tarifas Grupo B
  tarifaEnergiaB: number;
  custoFioB: number;
  // Campos de tarifas Grupo A
  tarifaEnergiaPontaA: number;
  tarifaEnergiaForaPontaA: number;
  tePontaA: number;
  teForaPontaA: number;
  // Campos de TUSD Grupo A
  tusdPontaA: number;
  tusdForaPontaA: number;
}

export interface IEnergyData {
  energyBills?: EnergyBillB[];
  energyBillsA?: EnergyBillA[];
  consumoRemotoB?: number[];
  hasRemotoB?: boolean;
}

export interface ILocationData {
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    estado?: string;
    cidade?: string;
  };
  irradiacaoMensal?: number[];
  fonteDados?: 'pvgis' | 'nasa' | 'manual';
  inclinacao?: number;
  azimute?: number;
  considerarSombreamento?: boolean;
  sombreamento?: number[];
}

import { SelectedInverter as SharedSelectedInverter } from '@bess-pro/shared';

export interface ISystemData {
  selectedModuleId?: string;
  selectedInverters?: SharedSelectedInverter[];
  potenciaModulo?: number;
  numeroModulos?: number;
  eficienciaSistema?: number;
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaOutras?: number;
  // Campos do SystemParametersForm
  fabricanteModulo?: string;
  moduloSelecionado?: string;
  vidaUtil: number;
  degradacaoAnual: number;
  // Campos adicionais necessários para compatibilidade
  eficienciaModulo?: number;
  tensaoModulo?: number;
  correnteModulo?: number;
  fabricanteModuloNome?: string;
  modeloModulo?: string;
  potenciaInversorTotal?: number;
  totalMpptChannels?: number;
}

export interface IBudgetData {
  custoEquipamento?: number;
  custoMateriais?: number;
  custoMaoDeObra?: number;
  bdi?: number;
  paymentMethod?: 'vista' | 'cartao' | 'financiamento';
  cardInstallments?: number;
  cardInterest?: number;
  financingInstallments?: number;
  financingInterest?: number;
  // Campos do FinancialForm
  inflacaoEnergia: number;
  taxaDesconto: number;
  custoOperacao: number;
  valorResidual: number;
  percentualFinanciado: number;
  taxaJuros: number;
  prazoFinanciamento: number;
}

export interface IResultsData {
  calculationResults?: {
    potenciaPico?: number;
    numeroModulos?: number;
    areaEstimada?: number;
    geracaoEstimadaAnual?: number;
    geracaoEstimadaMensal?: number[];
    totalInvestment?: number;
    financialResults?: any;
  };
}



// Estado principal da store
export interface IProjectState {
  // Estado de navegação
  currentStep: number;
  completedSteps: Set<number>;
  canAdvance: boolean;
  canGoBack: boolean;
  
  // Estado de carregamento
  isLoading: boolean;
  isCalculating: boolean;
  dimensioningId: string | null;
  
  // Estado de validação
  validationErrors: Record<number, string[]>;
  isValid: boolean;
  
  // Metadados
  lastSavedAt: Date | null;
  isDirty: boolean;
  autoSaveEnabled: boolean;
  
  // Estado do projeto (otimizado para nova arquitetura)
  isProjectLoaded: boolean;
  projectId: string | null;
  projectName: string;
  projectType: ProjectType;
  leadId: string | null;
  address: string;
  projectStateSource: string | null;
  isSaving: boolean;
  
  // Dados por etapa (baseado no documento de arquitetura)
  customer: ICustomerData | null;
  energy: IEnergyData | null;
  location: ILocationData | null;
  system: ISystemData;
  roof: any;
  budget: IBudgetData | null;
  results: IResultsData | null;
  
  // Propriedades internas para controle de concorrência (não persistidas)
  _autoSaveTimeout: NodeJS.Timeout | null;
  _isSaving: boolean;
  _lastSaveAttempt: Date | null;
}

// Interface para ações da store
interface IProjectActions {
  // Ações de navegação
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetWizard: () => void;
  
  // Ações de dados
  updateCustomerData: (data: Partial<ICustomerData>) => void;
  updateEnergyData: (data: Partial<IEnergyData>) => void;
  updateLocationData: (data: Partial<ILocationData>) => void;
  updateSystemData: (data: Partial<ISystemData>) => void;
  updateRoofData: (data: any) => void;
  updateBudgetData: (data: Partial<IBudgetData>) => void;
  updateResultsData: (data: Partial<IResultsData>) => void;
  
  // Ações de validação
  validateCurrentStep: () => boolean;
  validateAllSteps: () => Record<number, string[]>;
  clearValidationErrors: () => void;
  
  // Ações de persistência (otimizadas para nova arquitetura)
  clearProject: () => void;
  isProjectSaved: () => boolean;
  
  // Ações adicionais da nova arquitetura
  saveDimensioning: () => Promise<void>;
  loadDimensioning: (id: string) => Promise<void>;
  autoSave: () => void;
  
  // Ações de cálculo
  calcularConsumoMensal: () => number[];
  calculateSystem: () => Promise<void>;
  calculateFinancials: () => Promise<void>;
  
  // Ações de recuperação
  recoverFromBackup: () => void;
  createBackup: () => void;
}

// Estado inicial
const initialState: IProjectState = {
  // Estado de navegação
  currentStep: 1,
  completedSteps: new Set(),
  canAdvance: false,
  canGoBack: false,
  
  // Estado de carregamento
  isLoading: false,
  isCalculating: false,
  dimensioningId: null,
  
  // Estado de validação
  validationErrors: {},
  isValid: false,
  
  // Metadados
  lastSavedAt: null,
  isDirty: false,
  autoSaveEnabled: true,
  
  // Estado do projeto (otimizado para nova arquitetura)
  isProjectLoaded: false,
  projectId: null,
  projectName: '',
  projectType: ProjectType.PV,
  leadId: null,
  address: '',
  projectStateSource: null,
  isSaving: false,
  
  // Dados por etapa
  customer: {
    dimensioningName: '',
    grupoTarifario: 'B',
    subgrupoTarifario: '',
    concessionaria: '',
    tipoRede: '',
    tensaoRede: '',
    tipoTelhado: '',
    fatorSimultaneidade: 100,
    tarifaEnergiaB: 0,
    custoFioB: 0,
    tarifaEnergiaPontaA: 0,
    tarifaEnergiaForaPontaA: 0,
    tePontaA: 0,
    teForaPontaA: 0,
    tusdPontaA: 0.60,  // Valor padrão para TUSD Ponta
    tusdForaPontaA: 0.40  // Valor padrão para TUSD Fora Ponta
  },
  energy: {
    energyBills: [],
    energyBillsA: [],
    consumoRemotoB: [],
    hasRemotoB: false
  },
  location: null,
  system: {
    selectedModuleId: '',
    selectedInverters: [],
    potenciaModulo: 550,
    numeroModulos: 0,
    eficienciaSistema: 85,
    perdaSombreamento: 3,
    perdaMismatch: 2,
    perdaCabeamento: 2,
    perdaSujeira: 5,
    perdaInversor: 3,
    perdaOutras: 0,
    // Campos do SystemParametersForm
    fabricanteModulo: '',
    moduloSelecionado: '',
    vidaUtil: 25,
    degradacaoAnual: 0.5,
    // Campos adicionais necessários para compatibilidade
    eficienciaModulo: 0,
    tensaoModulo: 0,
    correnteModulo: 0,
    fabricanteModuloNome: '',
    modeloModulo: '',
    potenciaInversorTotal: 0,
    totalMpptChannels: 0
  },
  roof: null,
  budget: {
    custoEquipamento: 0,
    custoMateriais: 0,
    custoMaoDeObra: 0,
    bdi: 0,
    paymentMethod: 'vista' as const,
    cardInstallments: 12,
    cardInterest: 1.99,
    financingInstallments: 60,
    financingInterest: 1.49,
    inflacaoEnergia: 5.0,
    taxaDesconto: 8.0,
    custoOperacao: 1.0,
    valorResidual: 10.0,
    percentualFinanciado: 0,
    taxaJuros: 12.0,
    prazoFinanciamento: 5
  },
  results: null,
  
  // Propriedades internas para controle de concorrência (não persistidas)
  _autoSaveTimeout: null,
  _isSaving: false,
  _lastSaveAttempt: null,
};

// Tipo combinado da store
type IProjectStore = IProjectState & IProjectActions;

export const usePVDimensioningStore = create<IProjectStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Estado inicial
        ...initialState,
        
        // Ações de navegação
        goToStep: (step) => {
          const state = get();
          
          // Validar se pode ir para o passo
          if (step < 1 || step > 7) {
            return;
          }
          
          // Validar dependências
          if (!state.canGoBack && step < state.currentStep) {
            return;
          }
          
          // Validar passos anteriores
          for (let i = 1; i < step; i++) {
            if (!state.completedSteps.has(i)) {
              return;
            }
          }
          
          set((state) => {
            state.currentStep = step;
            state.canAdvance = false;
            state.canGoBack = step > 1;
          });
          
          // Auto-salvar se habilitado
          if (state.autoSaveEnabled && state.isDirty) {
            get().saveDimensioning();
          }
        },
        
        nextStep: () => {
          const state = get();
          
          if (state.canAdvance) {
            get().goToStep(state.currentStep + 1);
          }
        },
        
        previousStep: () => {
          const state = get();
          if (state.canGoBack) {
            get().goToStep(state.currentStep - 1);
          }
        },
        
        resetWizard: () => {
          set(() => ({ ...initialState }));
        },
        
        // Ações de dados
        updateCustomerData: (data) => {
          set((state) => {
            state.customer = { ...state.customer, ...data } as ICustomerData;
            state.isDirty = true;
          });
          
          // Validar passo atual
          get().validateCurrentStep();
          
          // Auto-salvar se habilitado
          if (get().autoSaveEnabled && get().dimensioningId) {
            get().autoSave();
          }
        },
        
        updateEnergyData: (data) => {
          set((state) => {
            state.energy = { ...state.energy, ...data } as IEnergyData;
            state.isDirty = true;
          });
          
          // Validar passo atual
          get().validateCurrentStep();
          
          // Auto-salvar se habilitado
          if (get().autoSaveEnabled && get().dimensioningId) {
            get().autoSave();
          }
        },
        
        updateLocationData: (data) => {          
          set((state) => {
            // Se data contém um objeto location, precisamos mesclar corretamente
            if (data.location) {
              // Mesclar o objeto location aninhado
              state.location = {
                ...state.location,
                location: {
                  ...state.location?.location,
                  ...data.location
                }
              } as ILocationData;
            } else {
              // Para outros campos (irradiacaoMensal, fonteDados, etc.)
              state.location = { ...state.location, ...data } as ILocationData;
            }
            state.isDirty = true;
          });
          
          // Validar passo atual
          get().validateCurrentStep();
          
          // Auto-salvar se habilitado
          if (get().autoSaveEnabled && get().dimensioningId) {
            get().autoSave();
          }
        },
        
        updateSystemData: (data) => {
          set((state) => {
            //  Isso garante que duas atualizações com os mesmos valores resultem em objetos idênticos, evitando re-renders desnecessários e loops infinitos!
            // Manter valores padrão para campos não especificados. Por algum motivo sem eles ali, da erro de deep
            const defaultSystemData = {
              selectedModuleId: '',
              selectedInverters: [],
              potenciaModulo: 550,
              numeroModulos: 0,
              eficienciaSistema: 85,
              perdaSombreamento: 3,
              perdaMismatch: 2,
              perdaCabeamento: 2,
              perdaSujeira: 5,
              perdaInversor: 3,
              perdaOutras: 0,
              fabricanteModulo: '',
              moduloSelecionado: '',
              vidaUtil: 25,
              degradacaoAnual: 0.5,
              eficienciaModulo: 0,
              tensaoModulo: 0,
              correnteModulo: 0,
              fabricanteModuloNome: '',
              modeloModulo: '',
              potenciaInversorTotal: 0,
              totalMpptChannels: 0
            };
            
            const newSystemData = { ...defaultSystemData, ...state.system, ...data } as ISystemData;
            
            state.system = newSystemData;
            state.isDirty = true;
          });
          
          // Validar passo atual
          get().validateCurrentStep();
          
          // Auto-salvar se habilitado
          if (get().autoSaveEnabled && get().dimensioningId) {
            get().autoSave();
          }
        },
        
        updateRoofData: (data) => {
          set((state) => {
            state.roof = { ...state.roof, ...data };
            state.isDirty = true;
          });
          
          // Validar passo atual
          get().validateCurrentStep();
          
          // Auto-salvar se habilitado
          if (get().autoSaveEnabled && get().dimensioningId) {
            get().autoSave();
          }
        },
        
        updateBudgetData: (data) => {
          set((state) => {
            state.budget = { ...state.budget, ...data } as IBudgetData;
            state.isDirty = true;
          });
          
          // Validar passo atual
          get().validateCurrentStep();
          
          // Auto-salvar se habilitado
          if (get().autoSaveEnabled && get().dimensioningId) {
            get().autoSave();
          }
        },
        
        updateResultsData: (data) => {
          set((state) => {
            // Verificar se há mudanças reais para evitar loops infinitos
            let hasChanges = false;
            
            // Verificar mudanças em campos de nível superior
            Object.keys(data).forEach(key => {
              if (key !== 'calculationResults') {
                const typedKey = key as keyof IResultsData;
                if (JSON.stringify(state.results?.[typedKey]) !== JSON.stringify(data[typedKey])) {
                  hasChanges = true;
                }
              }
            });
            
            // Verificar mudanças em calculationResults
            if (data.calculationResults) {
              const currentCalcResults = state.results?.calculationResults || {};
              const newCalcResults = { ...currentCalcResults, ...data.calculationResults };
              
              if (JSON.stringify(currentCalcResults) !== JSON.stringify(newCalcResults)) {
                hasChanges = true;
              }
            }
            
            // Se não houver mudanças, não atualizar
            if (!hasChanges) {
              return;
            }
            
            // Atualizar apenas se houver mudanças
            state.results = {
              ...state.results,
              ...data,
              calculationResults: data.calculationResults ? {
                ...state.results?.calculationResults,
                ...data.calculationResults
              } : state.results?.calculationResults
            } as IResultsData;
          });
        },
        
        // Ações de validação
        validateCurrentStep: () => {
          const state = get();
          const step = state.currentStep;
          const errors: string[] = [];
          
          
          switch (step) {
            case 1:
              if (!state.customer?.dimensioningName?.trim()) {
                errors.push('Nome do dimensionamento é obrigatório');
              }
              if (!state.customer?.customer?.name?.trim()) {
                errors.push('Nome do cliente é obrigatório');
              }
              if (!state.customer?.customer?.email?.trim()) {
                errors.push('Email do cliente é obrigatório');
              }
              break;
              
            case 2:
              // Verificar contas do Grupo B
              const hasGrupoB = (state.energy?.energyBills?.length || 0) > 0 &&
                state.energy?.energyBills?.some(bill =>
                  bill.consumoMensal.some(c => c > 0)
                );
              
              // Verificar contas do Grupo A
              const hasGrupoA = (state.energy?.energyBillsA?.length || 0) > 0 &&
                state.energy?.energyBillsA?.some(bill =>
                  bill.consumoMensalPonta.some(c => c > 0) ||
                  bill.consumoMensalForaPonta.some(c => c > 0)
                );
              
              
              if (!hasGrupoB && !hasGrupoA) {
                errors.push('É necessário adicionar pelo menos uma conta de energia (Grupo A ou B) com consumo > 0');
              }
              break;
              
            case 3:
              if (!state.location?.location?.latitude || !state.location?.location?.longitude) {
                errors.push('Coordenadas de localização são obrigatórias');
              }
              if (!state.location?.irradiacaoMensal || state.location.irradiacaoMensal.length !== 12 ||
                  !state.location.irradiacaoMensal.some(v => v > 0)) {
                errors.push('Dados de irradiação mensal são obrigatórios');
              }
              break;
              
            case 4:
              if (!state.system?.selectedModuleId) {
                errors.push('Seleção de módulo é obrigatória');
              }
              if (!state.system?.selectedInverters?.length) {
                errors.push('Seleção de inversor é obrigatória');
              }
              if (!state.system?.potenciaModulo || state.system.potenciaModulo <= 0) {
                errors.push('Potência do módulo deve ser > 0');
              }
              break;
              
            case 5:
              // Águas de telhado é opcional
              break;
              
            case 6:
              const subtotal = (state.budget?.custoEquipamento || 0) +
                             (state.budget?.custoMateriais || 0) +
                             (state.budget?.custoMaoDeObra || 0);
              const total = subtotal * (1 + (state.budget?.bdi || 0) / 100);
              if (total <= 0) {
                errors.push('Investimento total deve ser > 0');
              }
              break;
              
            case 7:
              // Resultados são calculados, não há validação
              break;
          }
          
          set((state) => {
            state.validationErrors[step] = errors;
            state.isValid = errors.length === 0;
            state.canAdvance = errors.length === 0 && step < 7;
            state.completedSteps = errors.length === 0
              ? new Set(Array.from(state.completedSteps).concat([step]))
              : state.completedSteps;
          });
          
          
          return errors.length === 0;
        },
        
        validateAllSteps: () => {
          const allErrors: Record<number, string[]> = {};
          
          // Salvar estado atual
          const currentStep = get().currentStep;
          
          // Validar todas as etapas
          for (let step = 1; step <= 7; step++) {
            // Temporariamente mudar para a etapa sendo validada
            get().goToStep(step);
            allErrors[step] = get().validationErrors[step] || [];
          }
          
          // Restaurar etapa original
          get().goToStep(currentStep);
          
          return allErrors;
        },
        
        clearValidationErrors: () => {
          set((state) => {
            state.validationErrors = {};
            state.isValid = false;
          });
        },
        
        clearProject: () => {
          set(() => ({ ...initialState }));
        },
        
        isProjectSaved: () => {
          return !!get().projectId;
        },
        
        // Ações adicionais da nova arquitetura
        saveDimensioning: async () => {
          const state = get();
          
          if (!state.customer?.dimensioningName?.trim()) {
            toast.error("Nome do dimensionamento é obrigatório");
            return;
          }
          
          if (!state.customer?.customer?.id) {
            toast.error("Cliente é obrigatório");
            return;
          }
          
          set((state) => ({ ...state, isLoading: true }));
          
          try {
            const payload = {
              projectName: state.customer.dimensioningName,
              projectType: 'pv',
              leadId: state.customer.customer.id || '',
              projectData: {
                // Dados do cliente
                customer: state.customer.customer,
                dimensioningName: state.customer.dimensioningName,
                
                // Dados de energia
                energyBills: state.energy?.energyBills,
                energyBillsA: state.energy?.energyBillsA,
                consumoRemotoB: state.energy?.consumoRemotoB,
                hasRemotoB: state.energy?.hasRemotoB,
                
                // Dados de localização
                endereco: state.location?.location?.address,
                cidade: state.location?.location?.cidade,
                estado: state.location?.location?.estado,
                latitude: state.location?.location?.latitude,
                longitude: state.location?.location?.longitude,
                irradiacaoMensal: state.location?.irradiacaoMensal,
                inclinacao: state.location?.inclinacao,
                azimute: state.location?.azimute,
                considerarSombreamento: state.location?.considerarSombreamento,
                sombreamento: state.location?.sombreamento,
                
                // Dados do sistema
                selectedModuleId: state.system?.selectedModuleId,
                selectedInverters: state.system?.selectedInverters,
                potenciaModulo: state.system?.potenciaModulo,
                numeroModulos: state.system?.numeroModulos,
                eficienciaSistema: state.system?.eficienciaSistema,
                perdaSombreamento: state.system?.perdaSombreamento,
                perdaMismatch: state.system?.perdaMismatch,
                perdaCabeamento: state.system?.perdaCabeamento,
                perdaSujeira: state.system?.perdaSujeira,
                perdaInversor: state.system?.perdaInversor,
                perdaOutras: state.system?.perdaOutras,
                
                // Dados do telhado
                aguasTelhado: state.roof?.aguasTelhado,
                
                // Dados do orçamento
                custoEquipamento: state.budget?.custoEquipamento,
                custoMateriais: state.budget?.custoMateriais,
                custoMaoDeObra: state.budget?.custoMaoDeObra,
                bdi: state.budget?.bdi,
                paymentMethod: state.budget?.paymentMethod,
                cardInstallments: state.budget?.cardInstallments,
                cardInterest: state.budget?.cardInterest,
                financingInstallments: state.budget?.financingInstallments,
                financingInterest: state.budget?.financingInterest,
                
                // Dados dos resultados
                calculationResults: state.results?.calculationResults,
              }
            };
            
            let response;
            if (state.dimensioningId) {
              response = await apiClient.projects.update(state.dimensioningId, payload);
            } else {
              response = await apiClient.projects.create(payload);
            }
            
            set((state) => ({
              ...state,
              dimensioningId: response.data.data.id,
              projectId: response.data.data.id,
              lastSavedAt: new Date(),
              isDirty: false,
              isLoading: false
            }));
            
          } catch (error: any) {
            set((state) => ({ ...state, isLoading: false }));
            
            toast.error(error.message || "Ocorreu um erro ao salvar o dimensionamento");
          }
        },
        
        loadDimensioning: async (id) => {
          set((state) => ({ ...state, isLoading: true }));
          
          try {
            const response = await apiClient.projects.get(id);
            const projectData = response.data.data.projectData;
            
            // Carregar dados em cada etapa
            set((state) => ({
              ...state,
              dimensioningId: id,
              projectId: id,
              
              // Etapa 1: Dados do cliente
              customer: {
                dimensioningName: response.data.data.projectName,
                customer: projectData.customer,
                grupoTarifario: projectData.grupoTarifario || 'B',
                subgrupoTarifario: projectData.subgrupoTarifario || '',
                concessionaria: projectData.concessionaria || '',
                tipoRede: projectData.tipoRede || '',
                tensaoRede: projectData.tensaoRede || '',
                tipoTelhado: projectData.tipoTelhado || '',
                fatorSimultaneidade: projectData.fatorSimultaneidade || 100,
                tarifaEnergiaB: projectData.tarifaEnergiaB || 0,
                custoFioB: projectData.custoFioB || 0,
                tarifaEnergiaPontaA: projectData.tarifaEnergiaPontaA || 0,
                tarifaEnergiaForaPontaA: projectData.tarifaEnergiaForaPontaA || 0,
                tePontaA: projectData.tePontaA || 0,
                teForaPontaA: projectData.teForaPontaA || 0,
                tusdPontaA: projectData.tusdPontaA || 0,
                tusdForaPontaA: projectData.tusdForaPontaA || 0
              },
              
              // Etapa 2: Dados de energia
              energy: {
                energyBills: projectData.energyBills,
                energyBillsA: projectData.energyBillsA,
                consumoRemotoB: projectData.consumoRemotoB || [],
                hasRemotoB: projectData.hasRemotoB || false
              },
              
              // Etapa 3: Dados de localização
              location: {
                address: projectData.endereco || projectData.address,
                cidade: projectData.cidade,
                estado: projectData.estado,
                latitude: projectData.latitude,
                longitude: projectData.longitude,
                irradiacaoMensal: projectData.irradiacaoMensal,
                fonteDados: projectData.fonteDados,
                inclinacao: projectData.inclinacao,
                azimute: projectData.azimute,
                considerarSombreamento: projectData.considerarSombreamento,
                sombreamento: projectData.sombreamento
              },
              
              // Etapa 4: Dados do sistema
              system: {
                // Valores padrão
                selectedModuleId: projectData.selectedModuleId || '',
                selectedInverters: projectData.selectedInverters || [],
                potenciaModulo: projectData.potenciaModulo || 550,
                numeroModulos: projectData.numeroModulos || 0,
                eficienciaSistema: projectData.eficienciaSistema || 85,
                perdaSombreamento: projectData.perdaSombreamento || 3,
                perdaMismatch: projectData.perdaMismatch || 2,
                perdaCabeamento: projectData.perdaCabeamento || 2,
                perdaSujeira: projectData.perdaSujeira || 5,
                perdaInversor: projectData.perdaInversor || 3,
                perdaOutras: projectData.perdaOutras || 0,
                fabricanteModulo: '',
                moduloSelecionado: '',
                vidaUtil: 25,
                degradacaoAnual: 0.5,
                eficienciaModulo: 0,
                tensaoModulo: 0,
                correnteModulo: 0,
                fabricanteModuloNome: '',
                modeloModulo: '',
                potenciaInversorTotal: 0,
                totalMpptChannels: 0
              },
              
              // Etapa 5: Dados do telhado
              roof: {
                aguasTelhado: projectData.aguasTelhado
              },
              
              // Etapa 6: Dados do orçamento
              budget: {
                custoEquipamento: projectData.custoEquipamento,
                custoMateriais: projectData.custoMateriais,
                custoMaoDeObra: projectData.custoMaoDeObra,
                bdi: projectData.bdi,
                paymentMethod: projectData.paymentMethod,
                cardInstallments: projectData.cardInstallments,
                cardInterest: projectData.cardInterest,
                financingInstallments: projectData.financingInstallments,
                financingInterest: projectData.financingInterest
              },
              
              // Etapa 7: Dados dos resultados
              results: {
                calculationResults: projectData.calculationResults
              },
              
              lastSavedAt: new Date(),
              isDirty: false,
              isLoading: false
            }));
            
            // Validar todas as etapas
            get().validateAllSteps();
            
            // Determinar última etapa concluída
            const completedSteps = new Set<number>();
            for (let step = 1; step <= 7; step++) {
              get().goToStep(step);
              if (get().isValid) {
                completedSteps.add(step);
              }
            }
            
            set((state) => ({
              ...state,
              completedSteps
            }));
            
            // Ir para a última etapa não concluída
            let nextStep = 1;
            for (let step = 1; step <= 7; step++) {
              if (!completedSteps.has(step)) {
                nextStep = step;
                break;
              }
            }
            get().goToStep(nextStep);
            
            toast.success("Dimensionamento carregado com sucesso");
            
          } catch (error: any) {
            set((state) => ({ ...state, isLoading: false }));
            
            toast.error(error.message || "Ocorreu um erro ao carregar o dimensionamento");
          }
        },
        
        autoSave: () => {
          const state = get();
          if (state.autoSaveEnabled && state.isDirty && state.dimensioningId) {
            // Cancelar timeout anterior se existir
            if ((state as any)._autoSaveTimeout) {
              clearTimeout((state as any)._autoSaveTimeout);
            }
            
            // Verificar se já há uma operação de salvamento em andamento
            if (!(state as any)._isSaving) {
              (state as any)._autoSaveTimeout = setTimeout(async () => {
                const currentState = get();
                // Verificar novamente se ainda precisa salvar e se não está salvando
                if (currentState.isDirty && currentState.dimensioningId && !(currentState as any)._isSaving) {
                  try {
                    // Marcar como salvando para evitar concorrência
                    set((state) => { (state as any)._isSaving = true; });
                    await get().saveDimensioning();
                  } catch (error) {
                    // Erro no auto-salvamento tratado silenciosamente
                  } finally {
                    // Limpar flag de salvamento
                    set((state) => { (state as any)._isSaving = false; });
                  }
                }
              }, 2000); // 2 segundos conforme especificado no documento
            }
          }
        },
        
        // Função utilitária para calcular consumo baseado no grupo tarifário
        calcularConsumoMensal: () => {
          const state = get();
          const grupoTarifario = state.customer?.grupoTarifario || 'B';
          
          
          if (grupoTarifario === 'A' && state.energy?.energyBillsA?.length) {
            // Grupo A: somar ponta + fora ponta para cada mês
            const consumoMensal = Array(12).fill(0);
            
            state.energy.energyBillsA.forEach(bill => {
              for (let i = 0; i < 12; i++) {
                consumoMensal[i] += (bill.consumoMensalPonta[i] || 0) + (bill.consumoMensalForaPonta[i] || 0);
              }
            });
            
            return consumoMensal;
          } else if (state.energy?.energyBills?.length) {
            // Grupo B: separar primeira conta (local) das demais (remotas)
            const primeiraConta = state.energy.energyBills[0];
            const contasRemotas = state.energy.energyBills.slice(1);
            
            // Usar apenas a primeira conta como consumo local
            const consumoLocal = Array(12).fill(0);
            if (primeiraConta) {
              for (let i = 0; i < 12; i++) {
                consumoLocal[i] = primeiraConta.consumoMensal[i] || 0;
              }
            }
            
            // Processar contas remotas se existirem
            if (contasRemotas.length > 0) {
              const consumoRemoto = Array(12).fill(0);
              contasRemotas.forEach(bill => {
                for (let i = 0; i < 12; i++) {
                  consumoRemoto[i] += bill.consumoMensal[i] || 0;
                }
              });
              
              
              // Armazenar dados remotos para uso no cálculo financeiro
              set((state) => ({
                ...state,
                energy: {
                  ...state.energy,
                  consumoRemotoB: consumoRemoto,
                  hasRemotoB: true
                }
              }));
            }
            
            return consumoLocal;
          }
          
          // Fallback: array zerado
          return Array(12).fill(0);
        },

        // Ações de cálculo
        calculateSystem: async () => {
          const state = get();
          
          if (!state.validateCurrentStep()) {
            toast.error("Complete todos os campos obrigatórios antes de calcular");
            return;
          }
          
          set((state) => ({ ...state, isCalculating: true }));
          
          try {
            // Calcular consumo mensal baseado no grupo tarifário
            const consumoMensal = get().calcularConsumoMensal();
            const consumoAnual = consumoMensal.reduce((sum: number, c: number) => sum + c, 0);
            
            
            // Preparar dados para API
            const requestData = {
              lat: state.location?.location?.latitude || -23.7621,
              lon: state.location?.location?.longitude || -53.3116,
              tilt: state.location?.inclinacao || 23,
              azimuth: state.location?.azimute || 180,
              modelo_decomposicao: "louche",
              modelo_transposicao: "perez",
              consumo_anual_kwh: consumoAnual || 6000,
              modulo: state.system?.selectedModuleId ? {
                // Obter dados completos do módulo
                fabricante: "Canadian Solar",
                modelo: "CS6P-550MS",
                potencia_nominal_w: state.system?.potenciaModulo || 550,
                // ... demais parâmetros
              } : null,
              // CORREÇÃO: Enviar todos os inversores selecionados em vez de apenas o primeiro
              inversores: state.system?.selectedInverters?.map(inv => ({
                fabricante: inv.inverter.manufacturer.name,
                modelo: inv.inverter.model,
                potencia_saida_ca_w: inv.inverter.power.ratedACPower,
                tipo_rede: inv.inverter.electrical.gridType,
                quantidade: inv.quantity || 1
              })) || [],
              perdas_sistema: (state.system?.perdaSombreamento || 3) +
                              (state.system?.perdaMismatch || 2) +
                              (state.system?.perdaCabeamento || 2) +
                              (state.system?.perdaSujeira || 5) +
                              (state.system?.perdaInversor || 3) +
                              (state.system?.perdaOutras || 0),
              fator_seguranca: 1.1
            };
            
            const response = await fetch('http://localhost:8010/api/v1/solar-analysis/calculate-advanced-modules', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')}`
              },
              body: JSON.stringify(requestData)
            });
            
            const apiResult = await response.json();
            
            if (apiResult.success && apiResult.data) {
              // Atualizar dados do sistema com resultados
              set((state) => ({
                ...state,
                system: {
                  ...state.system,
                  numeroModulosCalculado: apiResult.data.num_modulos,
                  potenciaPicoCalculado: apiResult.data.potencia_total_kw,
                  areaCalculada: apiResult.data.area_necessaria_m2,
                  geracaoAnualCalculada: apiResult.data.energia_total_anual_kwh
                }
              }));
              
              toast.success("Sistema dimensionado com sucesso");
            } else {
              throw new Error('API retornou erro');
            }
            
          } catch (error: any) {
            toast.error(error.message || "Ocorreu um erro ao calcular o sistema");
          } finally {
            set((state) => ({ ...state, isCalculating: false }));
          }
        },
        
        calculateFinancials: async () => {
          const state = get();
          
          if (!state.validateCurrentStep()) {
            toast.error("Complete todos os campos obrigatórios antes de calcular");
            return;
          }
          
          set((state) => ({ ...state, isCalculating: true }));
          
          try {
            // Calcular investimento total
            const subtotal = (state.budget?.custoEquipamento || 0) +
                           (state.budget?.custoMateriais || 0) +
                           (state.budget?.custoMaoDeObra || 0);
            const totalInvestment = subtotal * (1 + (state.budget?.bdi || 0) / 100);
            
            // Preparar dados para cálculo financeiro
            const consumoMensal = get().calcularConsumoMensal();
            const consumoRemotoB = state.energy?.consumoRemotoB || Array(12).fill(0);
            const hasRemotoB = state.energy?.hasRemotoB || false;
            
            const financialData = {
              financeiros: {
                capex: totalInvestment,
                anos: 25,
                taxa_desconto: 8.0,
                inflacao_energia: 4.5,
                degradacao: 0.5,
                salvage_pct: 0.1,
                oma_first_pct: 0.015,
                oma_inflacao: 4.0
              },
              geracao: {
                Jan: state.results?.calculationResults?.geracaoEstimadaMensal?.[0] || 0,
                Fev: state.results?.calculationResults?.geracaoEstimadaMensal?.[1] || 0,
                Mar: state.results?.calculationResults?.geracaoEstimadaMensal?.[2] || 0,
                Abr: state.results?.calculationResults?.geracaoEstimadaMensal?.[3] || 0,
                Mai: state.results?.calculationResults?.geracaoEstimadaMensal?.[4] || 0,
                Jun: state.results?.calculationResults?.geracaoEstimadaMensal?.[5] || 0,
                Jul: state.results?.calculationResults?.geracaoEstimadaMensal?.[6] || 0,
                Ago: state.results?.calculationResults?.geracaoEstimadaMensal?.[7] || 0,
                Set: state.results?.calculationResults?.geracaoEstimadaMensal?.[8] || 0,
                Out: state.results?.calculationResults?.geracaoEstimadaMensal?.[9] || 0,
                Nov: state.results?.calculationResults?.geracaoEstimadaMensal?.[10] || 0,
                Dez: state.results?.calculationResults?.geracaoEstimadaMensal?.[11] || 0
              },
              // Usar apenas a primeira conta como consumo local
              consumo_local: {
                Jan: consumoMensal[0] || 0,
                Fev: consumoMensal[1] || 0,
                Mar: consumoMensal[2] || 0,
                Abr: consumoMensal[3] || 0,
                Mai: consumoMensal[4] || 0,
                Jun: consumoMensal[5] || 0,
                Jul: consumoMensal[6] || 0,
                Ago: consumoMensal[7] || 0,
                Set: consumoMensal[8] || 0,
                Out: consumoMensal[9] || 0,
                Nov: consumoMensal[10] || 0,
                Dez: consumoMensal[11] || 0
              },
              tarifa_base: state.customer?.tarifaEnergiaB || 0.85,
              fio_b: {
                schedule: {
                  2025: 0.45,
                  2026: 0.60,
                  2027: 0.75,
                  2028: 0.90
                },
                base_year: 2025
              },
              tipo_conexao: "monofasico",
              fator_simultaneidade: 0.25,
              // Adicionar dados remotos B
              remoto_b: {
                enabled: hasRemotoB,
                percentage: hasRemotoB ? 0.40 : 0,
                data: {
                  Jan: consumoRemotoB[0] || 0,
                  Fev: consumoRemotoB[1] || 0,
                  Mar: consumoRemotoB[2] || 0,
                  Abr: consumoRemotoB[3] || 0,
                  Mai: consumoRemotoB[4] || 0,
                  Jun: consumoRemotoB[5] || 0,
                  Jul: consumoRemotoB[6] || 0,
                  Ago: consumoRemotoB[7] || 0,
                  Set: consumoRemotoB[8] || 0,
                  Out: consumoRemotoB[9] || 0,
                  Nov: consumoRemotoB[10] || 0,
                  Dez: consumoRemotoB[11] || 0
                },
                tarifa_total: state.customer?.tarifaEnergiaB || 0.90,
                fio_b_value: state.customer?.custoFioB || 0.30
              }
            };
            
            // Chamar API de cálculo financeiro
            const response = await fetch('http://localhost:8010/api/v1/financial/calculate-grupo-b', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')}`
              },
              body: JSON.stringify(financialData)
            });
            
            const financialResult = await response.json();
            
            if (financialResult.success) {
              // Atualizar dados dos resultados
              get().updateResultsData({
                calculationResults: {
                  financialResults: financialResult.data
                }
              });
              
              toast.success("Indicadores financeiros calculados com sucesso");
            } else {
              throw new Error('API retornou erro');
            }
            
          } catch (error: any) {
            toast.error(error.message || "Ocorreu um erro ao calcular os indicadores financeiros");
          } finally {
            set((state) => ({ ...state, isCalculating: false }));
          }
        },
        
        // Ações de recuperação
        recoverFromBackup: () => {
          const backup = localStorage.getItem('pv-dimensioning-backup');
          if (backup) {
            try {
              const backupData = JSON.parse(backup);
              set((state) => ({
                ...state,
                ...backupData,
                isDirty: true
              }));
              
              toast.success("Estado recuperado do backup automático");
            } catch (error) {
              // Erro ao recuperar do backup tratado silenciosamente
            }
          }
        },
        
        createBackup: () => {
          const state = get();
          const backupData = {
            customer: state.customer,
            energy: state.energy,
            location: state.location,
            system: state.system,
            roof: state.roof,
            budget: state.budget,
            results: state.results,
            currentStep: state.currentStep,
            completedSteps: Array.from(state.completedSteps),
            dimensioningId: state.dimensioningId
          };
          
          localStorage.setItem('pv-dimensioning-backup', JSON.stringify(backupData));
        }
      })),
      {
        name: 'pv-dimensioning-storage',
        partialize: (state) => ({
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
          // Propriedades internas não são incluídas na persistência
        }),
        onRehydrateStorage: () => (state) => {
          // Desserializar completedSteps de volta para Set
          if (state && state.completedSteps) {
            state.completedSteps = new Set(state.completedSteps);
          }
        }
      }
    ),
  )
);
