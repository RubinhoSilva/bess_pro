import { useCallback, useRef } from 'react';
import { FrontendCalculationLogger } from '../lib/calculationLogger';

export function useCalculationLogger(sessionPrefix: string = 'calc') {
  const loggerRef = useRef<FrontendCalculationLogger | null>(null);

  const getLogger = useCallback(() => {
    if (!loggerRef.current) {
      const sessionId = `${sessionPrefix}-${Date.now()}`;
      loggerRef.current = new FrontendCalculationLogger(sessionId);
    }
    return loggerRef.current;
  }, [sessionPrefix]);

  const clearLogs = useCallback(() => {
    getLogger().clearLogs();
  }, [getLogger]);

  const startCalculation = useCallback((title: string) => {
    getLogger().startCalculationSection(title);
  }, [getLogger]);

  const endCalculation = useCallback((title: string, summary?: any) => {
    getLogger().endCalculationSection(title, summary);
  }, [getLogger]);

  const logApiCall = useCallback((url: string, method: string, data?: any) => {
    getLogger().apiCall(url, method, data);
  }, [getLogger]);

  const logApiResponse = useCallback((url: string, status: number, data?: any) => {
    getLogger().apiResponse(url, status, data);
  }, [getLogger]);

  // Função utilitária para cálculos simples no frontend
  const logCalculation = useCallback((
    category: string,
    name: string,
    formula: string,
    variables: Record<string, any>,
    calculate: () => any,
    options?: {
      description?: string;
      units?: string;
      references?: string[];
    }
  ) => {
    const logger = getLogger();
    
    logger.info(category, `Iniciando cálculo: ${name}`, variables);
    
    try {
      const result = calculate();
      
      logger.formula(category, name, formula, variables, result, options);
      
      return result;
    } catch (error: any) {
      logger.error(category, `Erro no cálculo: ${name}`, { error: error.message, variables });
      throw error;
    }
  }, [getLogger]);

  return {
    logger: getLogger(),
    clearLogs,
    startCalculation,
    endCalculation,
    logApiCall,
    logApiResponse,
    logCalculation
  };
}