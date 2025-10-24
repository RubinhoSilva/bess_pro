import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useModuleStore } from '@/store/module-store';
import { useManufacturerStore } from '@/store/manufacturer-store';
import { SolarModule } from '@bess-pro/shared';
import { 
  moduleFormSchema, 
  moduleSimpleSchema, 
  ModuleFormData, 
  ModuleSimpleFormData,
  defaultModuleValues,
  validateModulePower,
  validateEfficiency,
  validateVoltageCurrent,
  validateVoltageCompatibility
} from '@/validations/equipment/module-validation';
import { 
  createModuleFromFormData, 
  createModuleUpdateFromFormData,
  validateModuleFormData
} from '@/mappers/module-mapper';

export interface UseModuleFormOptions {
  mode?: 'create' | 'edit' | 'simple';
  onSuccess?: (data: ModuleFormData | ModuleSimpleFormData) => void;
  onError?: (error: Error) => void;
}

export interface UseModuleFormReturn {
  // Form state
  form: ReturnType<typeof useForm<ModuleFormData | ModuleSimpleFormData>>;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Actions
  onSubmit: (data: ModuleFormData | ModuleSimpleFormData) => Promise<void>;
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
 * Hook reutilizável para formulários de módulos solares
 * Suporta três modos: create, edit, simple (para dimensionamento)
 */
export const useModuleForm = (options: UseModuleFormOptions = {}): UseModuleFormReturn => {
  const { mode = 'create', onSuccess, onError } = options;
  const { handleError } = useErrorHandler();
  const { addModule, updateModule } = useModuleStore();
  const { manufacturers } = useManufacturerStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determina o schema e valores padrão baseado no modo
  const isSimpleMode = mode === 'simple';
  const isEditMode = mode === 'edit';
  const currentSchema = isSimpleMode ? moduleSimpleSchema : moduleFormSchema;
  
  // Configuração do formulário
  const form = useForm<ModuleFormData | ModuleSimpleFormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: defaultModuleValues,
    mode: 'onChange'
  });
  
  const { handleSubmit, reset, formState: { isDirty } } = form;
  
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
      case 'nominalPower':
        return validateModulePower(value);
        
      case 'efficiency':
        const potencia = form.getValues('nominalPower');
        const cellType = form.getValues('cellType');
        return validateEfficiency(value, cellType);
        
      case 'voc':
      case 'vmpp':
        const voc = form.getValues('voc');
        const vmpp = form.getValues('vmpp');
        const nominalPower = form.getValues('nominalPower');
        if (field === 'vmpp' && voc) {
          return validateVoltageCurrent(voc, value, nominalPower);
        }
        if (field === 'voc' && vmpp) {
          return validateVoltageCurrent(value, vmpp, nominalPower);
        }
        return null;
        
      default:
        return null;
    }
  }, [form]);
  
  // Submissão do formulário
  const onSubmit = useCallback(async (data: ModuleFormData | ModuleSimpleFormData) => {
    // Extrair ID antes do try para uso no catch
    const moduleId = (data as any).id;
    
    
    try {
      setIsSubmitting(true);
      
      // Validações customizadas adicionais
      const customErrors: string[] = [];
      
      if (!isSimpleMode) {
        const fullData = data as ModuleFormData;
        
        const powerError = validateModulePower(fullData.nominalPower);
        if (powerError) customErrors.push(powerError);
        
        const efficiencyError = validateEfficiency(fullData.efficiency, fullData.cellType);
        if (efficiencyError) customErrors.push(efficiencyError);
        
        const voltageError = validateVoltageCompatibility(fullData.voc, 1000); // Usando 1000V como máximo padrão
        if (voltageError) customErrors.push(voltageError);
      }
      
      if (customErrors.length > 0) {
        throw new Error(customErrors.join('; '));
      }
      
      // Validar dados obrigatórios
      if (!isSimpleMode) {
        const validationErrors = validateModuleFormData(data as ModuleFormData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join('; '));
        }
      }

      // Executa ação baseada no modo
      if (isEditMode && moduleId) {
        const updateData = createModuleUpdateFromFormData(data as Partial<ModuleFormData>);
        await updateModule(moduleId, updateData);
      } else {
        // Para modo create, converter FormData para SolarModule
        const moduleData = data as ModuleFormData;
        const manufacturer = manufacturers.find(m => m.id === moduleData.manufacturerId);
        if (!manufacturer) {
          throw new Error('Fabricante não encontrado');
        }
        
        const completeModule = createModuleFromFormData(moduleData, manufacturer);
        addModule(completeModule as SolarModule);
      }
      onSuccess?.(data);
      
      // Reset em modo create
      if (!isEditMode) {
        reset(defaultModuleValues);
      }
      
    } catch (error) {
      const handledError = handleError(error, {
        context: 'module-form',
        action: isEditMode ? 'update' : 'create',
        data: { mode, hasId: !!moduleId }
      });
      
      onError?.(handledError);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSimpleMode, isEditMode, addModule, updateModule, handleError, onSuccess, onError, reset]);
  
  // Reset do formulário
  const onReset = useCallback(() => {
    reset(defaultModuleValues);
  }, [reset]);
  
  // Validação manual
  const onValidate = useCallback(async (): Promise<boolean> => {
    try {
      await currentSchema.parseAsync(form.getValues());
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(err => {
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

export default useModuleForm;