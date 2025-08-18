import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce de valores
 * Útil para otimizar consultas de busca e filtros
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook avançado para debounce com controle de loading
 */
export function useAdvancedDebounce<T>(
  value: T, 
  delay: number = 300
): {
  debouncedValue: T;
  isDebouncing: boolean;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);

  useEffect(() => {
    setIsDebouncing(true);
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return {
    debouncedValue,
    isDebouncing
  };
}

/**
 * Hook para debounce de múltiplos valores (filtros)
 */
export function useDebounceFilters<T extends Record<string, any>>(
  filters: T,
  delay: number = 300
): {
  debouncedFilters: T;
  isDebouncing: boolean;
} {
  const [debouncedFilters, setDebouncedFilters] = useState<T>(filters);
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);

  useEffect(() => {
    setIsDebouncing(true);
    
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [filters, delay]);

  return {
    debouncedFilters,
    isDebouncing
  };
}