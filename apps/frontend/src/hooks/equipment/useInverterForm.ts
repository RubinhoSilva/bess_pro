import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useInverterStore } from '@/store/inverter-store';
import { useManufacturerStore } from '@/store/manufacturer-store';
import { Inverter } from '@bess-pro/shared';
import { 
  inverterFormSchema, 
  inverterSimpleSchema, 
  InverterFormData, 
  InverterSimpleFormData,
  defaultInverterValues,
  validateInverterPower,
  validateMpptConfiguration,
  validateVoltageRange
} from '@/validations/equipment/inverter-validation';
import { 
  createInverterFromFormData, 
  createInverterUpdateFromFormData,
  validateInverterFormData
} from '@/mappers/inverter-mapper';

export interface UseInverterFormOptions {
  mode?: 'create' | 'edit' | 'simple';
  onSuccess?: (data: InverterFormData | InverterSimpleFormData) => void;
  onError?: (error: Error) => void;
}

export interface UseInverterFormReturn {
  // Form state
  form: ReturnType<typeof useForm<InverterFormData | InverterSimpleFormData>>;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Actions
  onSubmit: (data: InverterFormData | InverterSimpleFormData) => Promise<void>;
  onReset: () => void;
  onValidate: () => Promise<boolean>;
  
  // Utilities
  getManufacturers: () => Array<{ id: string; name: string }>;
  validateCustomField: (field: string, value: any) => string | null;
  
  // Mode helpers
  isSimpleMode: boolean;
  isEditMode: boolean;
}

/**
 * Hook reutilizável para formulários de inversores
 * Suporta três modos: create, edit, simple (para dimensionamento)
 */
export const useInverterForm = (options: UseInverterFormOptions = {}): UseInverterFormReturn => {
  const { mode = 'create', onSuccess, onError } = options;
  const { handleError } = useErrorHandler();
  const { addInverter, updateInverter } = useInverterStore();
  const { manufacturers } = useManufacturerStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determina o schema e valores padrão baseado no modo
  const isSimpleMode = mode === 'simple';
  const isEditMode = mode === 'edit';
  const currentSchema = isSimpleMode ? inverterSimpleSchema : inverterFormSchema;
  
  // Configuração do formulário
  const form = useForm<InverterFormData | InverterSimpleFormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: defaultInverterValues,
    mode: 'onChange'
  });
  
  const { reset, formState: { isDirty } } = form;
  
  // Obtém fabricantes para select
  const getManufacturers = useCallback(() => {
    return manufacturers.map(m => ({
      id: m.id,
      name: m.name
    }));
  }, [manufacturers]);
  
  // Validações customizadas
  const validateCustomField = useCallback((field: string, value: any): string | null => {
    switch (field) {
      case 'ratedACPower':
        return validateInverterPower(value);
        
      case 'numberOfMppts':
      case 'stringsPerMppt':
        const numberOfMppts = form.getValues('numberOfMppts');
        const stringsPerMppt = form.getValues('stringsPerMppt');
        if (field === 'stringsPerMppt' && numberOfMppts) {
          return validateMpptConfiguration(numberOfMppts, value);
        }
        if (field === 'numberOfMppts' && stringsPerMppt) {
          return validateMpptConfiguration(value, stringsPerMppt);
        }
        return null;
        
      case 'shortCircuitVoltageMax':
        const potencia = form.getValues('ratedACPower');
        return validateVoltageRange(value, potencia);
        

        
      default:
        return null;
    }
  }, [form]);
  
  // Submissão do formulário
  const onSubmit = useCallback(async (data: InverterFormData | InverterSimpleFormData) => {
    // Extrair ID antes do try para uso no catch
    const inverterId = (data as any).id;
    
    try {
      setIsSubmitting(true);
      
      // Validações customizadas adicionais
      const customErrors: string[] = [];
      
      if (!isSimpleMode) {
        const fullData = data as InverterFormData;
        
        const powerError = validateInverterPower(fullData.ratedACPower);
        if (powerError) customErrors.push(powerError);
        
        const mpptError = validateMpptConfiguration(fullData.numberOfMppts, fullData.stringsPerMppt);
        if (mpptError) customErrors.push(mpptError);
        
        const voltageError = validateVoltageRange(fullData.shortCircuitVoltageMax, fullData.ratedACPower);
        if (voltageError) customErrors.push(voltageError);
        

      }
      
      if (customErrors.length > 0) {
        throw new Error(customErrors.join('; '));
      }
      
      // Validar dados obrigatórios
      if (!isSimpleMode) {
        const validationErrors = validateInverterFormData(data as InverterFormData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join('; '));
        }
      }

      // Executa ação baseada no modo
      if (isEditMode && inverterId) {
        const updateData = createInverterUpdateFromFormData(data as Partial<InverterFormData>);
        await updateInverter(inverterId, updateData);
      } else {
        // Para modo create, converter FormData para Inverter
        const inverterData = data as InverterFormData;
        const manufacturer = manufacturers.find(m => m.id === inverterData.manufacturerId);
        if (!manufacturer) {
          throw new Error('Fabricante não encontrado');
        }
        
        const completeInverter = createInverterFromFormData(inverterData, manufacturer);
        addInverter(completeInverter as Inverter);
      }
      
      onSuccess?.(data);
      
      // Reset em modo create
      if (!isEditMode) {
        reset(defaultInverterValues);
      }
      
    } catch (error) {
      const handledError = handleError(error, {
        context: 'inverter-form',
        action: isEditMode ? 'update' : 'create',
        data: { mode, hasId: !!inverterId }
      });
      
      onError?.(handledError);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSimpleMode, isEditMode, addInverter, updateInverter, handleError, onSuccess, onError, reset]);
  
  // Reset do formulário
  const onReset = useCallback(() => {
    reset(defaultInverterValues);
  }, [reset]);
  
  // Validação manual
  const onValidate = useCallback(async (): Promise<boolean> => {
    try {
      await currentSchema.parseAsync(form.getValues());
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          form.setError(err.path.join('.') as any, {
            type: 'manual',
            message: err.message
          });
        });
      }
      return false;
    }
  }, [form, currentSchema]);
  
  return {
    form,
    isSubmitting,
    isDirty,
    onSubmit,
    onReset,
    onValidate,
    getManufacturers,
    validateCustomField,
    isSimpleMode,
    isEditMode
  };
};

export default useInverterForm;