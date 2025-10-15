import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { dimensioningService } from '@/services/DimensioningService';
import { getInitialDimensioningState, DimensioningData } from '@/contexts/DimensioningContext';

/**
 * Store Zustand para gerenciamento de dimensionamento solar
 * Substitui o React Context + hooks personalizados
 * Reduz de 898 linhas para ~50 linhas
 */

interface DimensioningStore {
  // Estado principal
  currentDimensioning: DimensioningData;
  dimensioningId: string | null;
  isInitialized: boolean;
  isSaving: boolean;
  
  // Ações básicas (do Context original)
  updateDimensioning: (updates: Partial<DimensioningData>) => void;
  resetDimensioning: () => void;
  loadDimensioning: (data: DimensioningData) => void;
  setDimensioningId: (id: string | null) => void;
  
  // Ações de negócio (integrando services existentes)
  saveDimensioning: () => Promise<{id: string, createdAt: string, updatedAt: string}>;
  createNewDimensioning: () => void;
  forceCleanStart: () => void;
  
  // Utilitários
  validateDimensioning: () => string[];
}

export const useDimensioningStore = create<DimensioningStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Estado inicial
        currentDimensioning: getInitialDimensioningState(),
        dimensioningId: null,
        isInitialized: false,
        isSaving: false,
        
        // Ações básicas
        updateDimensioning: (updates: Partial<DimensioningData>) => {
          set((state) => ({
            currentDimensioning: { ...state.currentDimensioning, ...updates }
          }));
        },
        
        resetDimensioning: () => {
          set({
            currentDimensioning: getInitialDimensioningState(),
            dimensioningId: null,
            isInitialized: true
          });
        },
        
        loadDimensioning: (data: DimensioningData) => {
          const loadedData = {
            ...getInitialDimensioningState(),
            ...data,
            // Garante arrays inicializados
            irradiacaoMensal: data.irradiacaoMensal || [],
            selectedInverters: data.selectedInverters || [],
            totalInverterPower: data.totalInverterPower || 0,
            totalMpptChannels: data.totalMpptChannels || 0,
            energyBills: data.energyBills || [{
              id: crypto.randomUUID(),
              name: 'Conta Principal',
              consumoMensal: Array(12).fill(500)
            }],
            aguasTelhado: data.aguasTelhado || [{
              id: 'agua_principal',
              nome: 'Orientação #1',
              orientacao: 180,
              inclinacao: 23,
              numeroModulos: 20,
              sombreamentoParcial: 0,
              areaDisponivel: 50
            }]
          };
          
          set({
            currentDimensioning: loadedData,
            dimensioningId: data.id || null,
            isInitialized: true
          });
        },
        
        setDimensioningId: (id: string | null) => {
          set({ dimensioningId: id });
        },
        
        // Ações de negócio
        saveDimensioning: async () => {
          const { currentDimensioning, dimensioningId } = get();
          
          set({ isSaving: true });
          
          try {
            console.log('💾 Salvando dimensionamento via Zustand store...', { 
              dimensioningId, 
              hasData: !!currentDimensioning 
            });
            
            const result = await dimensioningService.saveDimensioning(
              currentDimensioning, 
              dimensioningId || undefined
            );
            
            // Atualizar ID se for novo dimensionamento
            if (!dimensioningId) {
              set({ dimensioningId: result.id });
            }
            
            console.log('✅ Dimensioning salvo com sucesso via Zustand:', result);
            return result;
            
          } catch (error) {
            console.error('❌ Erro ao salvar dimensioning via Zustand:', error);
            throw error;
          } finally {
            set({ isSaving: false });
          }
        },
        
        createNewDimensioning: () => {
          get().resetDimensioning();
        },
        
        forceCleanStart: () => {
          // Limpar storage e resetar estado
          localStorage.removeItem('dimensioning-draft');
          localStorage.removeItem('dimensioningId');
          sessionStorage.removeItem('continueDimensioning');
          
          get().resetDimensioning();
        },
        
        // Utilitários
        validateDimensioning: () => {
          const { currentDimensioning } = get();
          
          try {
            // Importar validação do mapper
            const { validateDimensioningData } = require('@/mappers/dimensioning-mapper');
            return validateDimensioningData(currentDimensioning);
          } catch (error) {
            console.error('❌ Erro na validação:', error);
            return ['Erro na validação dos dados'];
          }
        }
      }),
      {
        name: 'dimensioning-storage',
        partialize: (state) => ({
          currentDimensioning: state.currentDimensioning,
          dimensioningId: state.dimensioningId
        })
      }
    )
  )
);

// Auto-inicialização quando o store for criado
const initializeStore = () => {
  const state = useDimensioningStore.getState();
  
  if (!state.isInitialized) {
    // Verificar se deve continuar sessão existente
    const shouldContinue = sessionStorage.getItem('continueDimensioning') === 'true';
    
    if (shouldContinue) {
      // Carregar ID salvo se existir
      const savedId = localStorage.getItem('dimensioningId');
      if (savedId) {
        state.setDimensioningId(JSON.parse(savedId));
      }
    }
    
    useDimensioningStore.setState({ isInitialized: true });
    console.log('✅ DimensioningStore inicializado');
  }
};

// Inicializar store
initializeStore();