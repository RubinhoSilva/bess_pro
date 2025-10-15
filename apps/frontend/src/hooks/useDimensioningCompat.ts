import { useDimensioningStore } from '@/stores/dimensioning-store';

/**
 * Hook de compatibilidade para migrar do Context para Zustand
 * Mantém API exata do useDimensioning original para não quebrar componentes
 * Uso temporário durante migração
 */
export const useDimensioning = () => {
  const store = useDimensioningStore();
  
  return {
    // API exata do contexto original
    currentDimensioning: store.currentDimensioning,
    dimensioningId: store.dimensioningId,
    isInitialized: store.isInitialized,
    isSaving: store.isSaving,
    
    // Ações básicas
    updateDimensioning: store.updateDimensioning,
    loadDimensioning: store.loadDimensioning,
    saveDimensioning: store.saveDimensioning,
    resetDimensioning: store.resetDimensioning,
    
    // Compatibilidade com nomes antigos
    createNewDimensioning: store.createNewDimensioning,
    forceCleanStart: store.forceCleanStart
  };
};