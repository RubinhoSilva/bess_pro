import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useManufacturerStore } from '@/store/manufacturer-store';
import { Manufacturer } from '@bess-pro/shared';
import { 
  manufacturerFormSchema, 
  manufacturerSimpleSchema, 
  ManufacturerFormData, 
  ManufacturerSimpleFormData,
  defaultManufacturerValues,
  validateManufacturerName,
  validateWebsite,
  validateEmail,
  validateFoundedYear
} from '@/validations/equipment/manufacturer-validation';
import { 
  createManufacturerFromFormData, 
  createManufacturerUpdateFromFormData,
  validateManufacturerFormData
} from '@/mappers/manufacturer-mapper';

export interface UseManufacturerFormOptions {
  mode?: 'create' | 'edit';
  onSuccess?: (data: ManufacturerFormData) => void;
  onError?: (error: Error) => void;
}

export interface UseManufacturerFormReturn {
  // Form state
  form: ReturnType<typeof useForm<ManufacturerFormData>>;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Actions
  onSubmit: (data: ManufacturerFormData) => Promise<void>;
  onReset: () => void;
  onValidate: () => Promise<boolean>;
  

  
  // Mode helpers
  isEditMode: boolean;
}

/**
 * Hook reutilizável para formulários de fabricantes
 * Suporta modos: create, edit
 */
export const useManufacturerForm = (options: UseManufacturerFormOptions = {}): UseManufacturerFormReturn => {
  const { mode = 'create', onSuccess, onError } = options;
  const { handleError } = useErrorHandler();
  const { addManufacturer, updateManufacturer } = useManufacturerStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = mode === 'edit';
  
  // Configuração do formulário
  const form = useForm<ManufacturerFormData>({
    resolver: zodResolver(manufacturerFormSchema),
    defaultValues: defaultManufacturerValues,
    mode: 'onChange'
  });
  
  const { reset, formState: { isDirty } } = form;
  

  
  // Submissão do formulário
  const onSubmit = useCallback(async (data: ManufacturerFormData) => {
    // Extrair ID antes do try para uso no catch
    const manufacturerId = (data as any).id;
    
    try {
      setIsSubmitting(true);
      

      
      // Executa ação baseada no modo
      if (isEditMode && manufacturerId) {
        const updateData = createManufacturerUpdateFromFormData(data as Partial<ManufacturerFormData>);
        await updateManufacturer(manufacturerId, updateData);
      } else {
        // Para modo create, converter FormData para Manufacturer
        const completeManufacturer = createManufacturerFromFormData(data);
        addManufacturer(completeManufacturer as Manufacturer);
      }
      
      onSuccess?.(data);
      
      // Reset em modo create
      if (!isEditMode) {
        reset(defaultManufacturerValues);
      }
      
    } catch (error) {
      const handledError = handleError(error, {
        context: 'manufacturer-form',
        action: isEditMode ? 'update' : 'create',
        data: { mode, hasId: !!manufacturerId }
      });
      
      onError?.(handledError);
    } finally {
      setIsSubmitting(false);
    }
   }, [isEditMode, addManufacturer, updateManufacturer, handleError, onSuccess, onError, reset]);
  
  // Reset do formulário
  const onReset = useCallback(() => {
    reset(defaultManufacturerValues);
  }, [reset]);
  
  // Validação manual
  const onValidate = useCallback(async (): Promise<boolean> => {
    try {
      await manufacturerFormSchema.parseAsync(form.getValues());
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
  }, [form]);
  
   return {
     form,
     isSubmitting,
     isDirty,
     onSubmit,
     onReset,
     onValidate,
     isEditMode
   };
};

export default useManufacturerForm;