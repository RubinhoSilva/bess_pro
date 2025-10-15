import { useCallback } from 'react';
import { useDimensioning } from '../contexts/DimensioningContext';
import { useDimensioningActions } from './useDimensioningActions';
import { LegacyDimensioningData } from '../mappers/dimensioning-mapper';

/**
 * Hook de exemplo mostrando como usar a nova arquitetura
 * Combina Context (estado) com Actions (negócio) de forma limpa
 * 
 * Este é um exemplo de como os componentes devem usar os novos hooks
 */
export const useDimensioningExample = () => {
  // Context para estado puro
  const { 
    currentDimensioning, 
    isInitialized, 
    updateDimensioning, 
    resetDimensioning, 
    loadDimensioning 
  } = useDimensioning();

  // Actions para API e negócio
  const { 
    saveDimensioning, 
    loadDimensioning: loadFromAPI, 
    isSaving, 
    isLoading 
  } = useDimensioningActions({
    onSuccess: (action, data) => {
      // Callback de sucesso genérico
      switch (action) {
        case 'save':
          console.log('✅ Dimensionamento salvo com sucesso!');
          break;
        case 'load':
          console.log('✅ Dimensionamento carregado com sucesso!');
          break;
        default:
          console.log('✅ Ação concluída:', action, data);
      }
    },
    onError: (action, error) => {
      // Callback de erro genérico
      console.error(`❌ Erro na ação ${action}:`, error);
    }
  });

  /**
   * Exemplo: Salvar dimensionamento atual
   * Usa estado do context + API do actions
   */
  const handleSave = useCallback(async () => {
    try {
      // Pega ID do dimensionamento se existir
      const dimensioningId = currentDimensioning.id;
      
      // Converte para LegacyDimensioningData para o service
      const legacyData: LegacyDimensioningData = currentDimensioning as LegacyDimensioningData;
      
      // Salva usando o service (via actions hook)
      const result = await saveDimensioning(legacyData, dimensioningId);
      
      // Atualiza estado local com dados retornados da API
      if (result) {
        updateDimensioning({
          id: result.id,
          updatedAt: result.updatedAt
        });
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      throw error;
    }
  }, [currentDimensioning, saveDimensioning, updateDimensioning]);

  /**
   * Exemplo: Carregar dimensionamento por ID
   * Busca da API e carrega no context
   */
  const handleLoad = useCallback(async (id: string) => {
    try {
      // Carrega da API (via actions hook)
      const data = await loadFromAPI(id);
      
      // Carrega no context (estado local)
      loadDimensioning(data);
      
      return data;
    } catch (error) {
      console.error('Erro ao carregar:', error);
      throw error;
    }
  }, [loadFromAPI, loadDimensioning]);

  /**
   * Exemplo: Atualizar campo específico
   * Usa apenas o context (sem API)
   */
  const updateField = useCallback((field: string, value: any) => {
    updateDimensioning({ [field]: value });
  }, [updateDimensioning]);

  /**
   * Exemplo: Reset completo
   * Limpa estado e storage
   */
  const handleReset = useCallback(() => {
    resetDimensioning();
    console.log('✅ Dimensionamento resetado com sucesso!');
  }, [resetDimensioning]);

  /**
   * Exemplo: Validação antes de salvar
   * Usa validação do service
   */
  const validateBeforeSave = useCallback(() => {
    const { validateDimensioningData } = require('../mappers/dimensioning-mapper');
    const errors = validateDimensioningData(currentDimensioning);
    
    if (errors.length > 0) {
      console.error(`Erros de validação: ${errors.join(', ')}`);
      return false;
    }
    
    return true;
  }, [currentDimensioning]);

  return {
    // Estado do context
    currentDimensioning,
    isInitialized,
    
    // Estado das actions
    isSaving,
    isLoading,
    
    // Ações combinadas
    save: handleSave,
    load: handleLoad,
    updateField,
    reset: handleReset,
    validateBeforeSave
  };
};

export default useDimensioningExample;