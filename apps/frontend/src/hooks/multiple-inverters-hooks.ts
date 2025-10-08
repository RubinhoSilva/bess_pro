import { useCallback } from 'react';
import { SelectedInverter } from '@/contexts/DimensioningContext';
import { Inverter } from './equipment-hooks';

export interface UseMultipleInvertersReturn {
  addInverter: (inverter: Inverter, quantity?: number) => SelectedInverter;
  removeInverter: (id: string) => void;
  updateInverterQuantity: (id: string, quantity: number) => void;
  calculateTotalPower: (selectedInverters: SelectedInverter[]) => number;
  calculateTotalMpptChannels: (selectedInverters: SelectedInverter[]) => number;
  getAvailableMpptChannels: (selectedInverters: SelectedInverter[]) => Array<{
    inversorId: string;
    inversorNome: string;
    mpptNumero: number;
    available: boolean;
  }>;
  validateInverterSelection: (selectedInverters: SelectedInverter[]) => {
    isValid: boolean;
    errors: string[];
  };
}

export const useMultipleInverters = (): UseMultipleInvertersReturn => {

  const addInverter = useCallback((inverter: Inverter, quantity: number = 1): SelectedInverter => {
    const selectedInverter: SelectedInverter = {
      id: crypto.randomUUID(),
      inverterId: inverter.id,
      fabricante: inverter.fabricante,
      modelo: inverter.modelo,
      potenciaSaidaCA: inverter.potenciaSaidaCA,
      potenciaFvMax: inverter.potenciaFvMax,
      numeroMppt: inverter.numeroMppt || 2,
      stringsPorMppt: inverter.stringsPorMppt || 2,
      tensaoCcMax: inverter.tensaoCcMax || 1000,
      quantity
    };
    
    return selectedInverter;
  }, []);

  const removeInverter = useCallback((id: string) => {
    // Esta função será usada pelo componente pai
    console.log('Removing inverter:', id);
  }, []);

  const updateInverterQuantity = useCallback((id: string, quantity: number) => {
    // Esta função será usada pelo componente pai
    console.log('Updating inverter quantity:', id, quantity);
  }, []);

  const calculateTotalPower = useCallback((selectedInverters: SelectedInverter[]): number => {
    return selectedInverters.reduce((total, inv) => {
      return total + (inv.potenciaSaidaCA * inv.quantity);
    }, 0);
  }, []);

  const calculateTotalMpptChannels = useCallback((selectedInverters: SelectedInverter[]): number => {
    return selectedInverters.reduce((total, inv) => {
      // Calcular total de strings que podem ser conectadas
      // = número de MPPTs × strings por MPPT × quantidade de inversores
      const numeroMppt = inv.numeroMppt || 2;
      const stringsPorMppt = inv.stringsPorMppt || 2;
      const stringsPerInverter = numeroMppt * stringsPorMppt;
      return total + (stringsPerInverter * inv.quantity);
    }, 0);
  }, []);

  const getAvailableMpptChannels = useCallback((selectedInverters: SelectedInverter[]) => {
    const channels: Array<{
      inversorId: string;
      inversorNome: string;
      mpptNumero: number;
      available: boolean;
    }> = [];

    selectedInverters.forEach(inverter => {
      for (let unit = 1; unit <= inverter.quantity; unit++) {
        for (let mppt = 1; mppt <= inverter.numeroMppt; mppt++) {
          const uniqueInversorId = `${inverter.id}_unit${unit}`;
          channels.push({
            inversorId: uniqueInversorId,
            inversorNome: `${inverter.fabricante} ${inverter.modelo} #${unit}`,
            mpptNumero: mppt,
            available: true // Por padrão todos estão disponíveis
          });
        }
      }
    });

    return channels;
  }, []);

  const validateInverterSelection = useCallback((selectedInverters: SelectedInverter[]) => {
    const errors: string[] = [];
    
    if (selectedInverters.length === 0) {
      errors.push('Pelo menos um inversor deve ser selecionado');
    }

    // Validar se há quantidade válida
    selectedInverters.forEach(inv => {
      if (inv.quantity <= 0) {
        errors.push(`Quantidade inválida para ${inv.fabricante} ${inv.modelo}`);
      }
    });

    // Validação de potência mínima removida

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [calculateTotalPower]);

  return {
    addInverter,
    removeInverter,
    updateInverterQuantity,
    calculateTotalPower,
    calculateTotalMpptChannels,
    getAvailableMpptChannels,
    validateInverterSelection
  };
};