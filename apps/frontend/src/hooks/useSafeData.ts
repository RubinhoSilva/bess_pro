import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para validação segura de dados e prevenção de erros
 */
export function useSafeData<T>(
  data: T | undefined | null,
  defaultValue: T,
  validator?: (data: T) => boolean
): [T, boolean, string | null] {
  const [safeData, setSafeData] = useState<T>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (data === null || data === undefined) {
        setSafeData(defaultValue);
        setIsValid(false);
        setError('Dados não fornecidos');
        return;
      }

      // Validador customizado se fornecido
      if (validator && !validator(data)) {
        setSafeData(defaultValue);
        setIsValid(false);
        setError('Dados inválidos');
        return;
      }

      // Validação básica para objetos
      if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
          // Validar array
          if (data.length === 0) {
            setSafeData(defaultValue);
            setIsValid(false);
            setError('Array vazio');
            return;
          }
        } else {
          // Validar objeto
          if (Object.keys(data).length === 0) {
            setSafeData(defaultValue);
            setIsValid(false);
            setError('Objeto vazio');
            return;
          }
        }
      }

      setSafeData(data);
      setIsValid(true);
      setError(null);
    } catch (err) {
      console.error('Erro na validação de dados:', err);
      setSafeData(defaultValue);
      setIsValid(false);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [data, defaultValue, validator]);

  return [safeData, isValid, error];
}

/**
 * Hook para acesso seguro a propriedades de objetos
 */
export function useSafeProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue: T[K]
): T[K] {
  const [value, setValue] = useState<T[K]>(defaultValue);

  useEffect(() => {
    try {
      if (obj && typeof obj === 'object' && key in obj) {
        const propValue = obj[key];
        if (propValue !== undefined && propValue !== null) {
          setValue(propValue);
        } else {
          setValue(defaultValue);
        }
      } else {
        setValue(defaultValue);
      }
    } catch (err) {
      console.error(`Erro ao acessar propriedade ${String(key)}:`, err);
      setValue(defaultValue);
    }
  }, [obj, key, defaultValue]);

  return value;
}

/**
 * Hook para gerenciar estado com validação
 */
export function useValidatedState<T>(
  initialValue: T,
  validator?: (value: T) => boolean,
  onError?: (error: string) => void
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setValidatedValue = useCallback((newValue: T) => {
    try {
      if (validator && !validator(newValue)) {
        const errorMsg = 'Valor inválido';
        setIsValid(false);
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setValue(newValue);
      setIsValid(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setIsValid(false);
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [validator, onError]);

  return [value, setValidatedValue, isValid, error] as const;
}

/**
 * Hook para prevenir renderização com dados inválidos
 */
export function useSafeRender<T>(
  data: T | undefined | null,
  requiredKeys: (keyof T)[] = []
): [boolean, T | null, string | null] {
  const [canRender, setCanRender] = useState<boolean>(false);
  const [safeData, setSafeData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!data) {
        setCanRender(false);
        setSafeData(null);
        setError('Dados não fornecidos');
        return;
      }

      // Verificar chaves obrigatórias
      const missingKeys = requiredKeys.filter(key => {
        const hasKey = Object.prototype.hasOwnProperty.call(data, key);
        const value = data[key];
        return !hasKey || value === null || value === undefined;
      });
      
      if (missingKeys.length > 0) {
        setCanRender(false);
        setSafeData(null);
        setError(`Chaves obrigatórias ausentes: ${missingKeys.join(', ')}`);
        return;
      }

      setCanRender(true);
      setSafeData(data);
      setError(null);
    } catch (err) {
      setCanRender(false);
      setSafeData(null);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [data, requiredKeys]);

  return [canRender, safeData, error];
}

/**
 * Utilitário para validação de objetos
 */
export const validateObject = (obj: any, requiredFields: string[] = []): { isValid: boolean; error?: string } => {
  try {
    if (!obj || typeof obj !== 'object') {
      return { isValid: false, error: 'Objeto inválido ou nulo' };
    }

    const missingFields = requiredFields.filter(field => !(field in obj) || obj[field] === null || obj[field] === undefined);
    
    if (missingFields.length > 0) {
      return { isValid: false, error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` };
    }

    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: err instanceof Error ? err.message : 'Erro na validação' };
  }
};

/**
 * Utilitário para acesso seguro a propriedades aninhadas
 */
export const safeGet = (obj: any, path: string, defaultValue: any = null): any => {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

export default useSafeData;