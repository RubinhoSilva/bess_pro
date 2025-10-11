/**
 * React hook for error handling
 * Provides easy integration with ErrorHandler in React components
 */

import React, { useCallback, useState } from 'react';
import { AppError } from '@/errors/AppError';
import { ErrorHandler, withRetry } from '@/errors/ErrorHandler';

export interface ErrorContext {
  operation?: string;
  action?: string;
  user?: string;
  data?: any;
  url?: string;
  [key: string]: any;
}

export interface UseErrorHandlerReturn {
  error: AppError | null;
  isError: boolean;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: unknown, context?: string | ErrorContext) => AppError;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: string | ErrorContext
  ) => Promise<T | null>;
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    delay?: number,
    context?: string | ErrorContext
  ) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown, context?: string | ErrorContext): AppError => {
    const contextString = typeof context === 'string' ? context : context?.operation || 'unknown-operation';
    const appError = ErrorHandler.handle(error, contextString, typeof context === 'object' ? context : undefined);
    setError(appError);
    return appError;
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string | ErrorContext
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();

    try {
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string | ErrorContext
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();

    try {
      const contextString = typeof context === 'string' ? context : context?.operation || 'retry-operation';
      const result = await withRetry(operation, maxRetries, delay, contextString);
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isError: error !== null,
    isLoading,
    clearError,
    handleError,
    executeWithErrorHandling,
    executeWithRetry,
  };
};

/**
 * Higher-order component for error boundary functionality
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  onError?: (error: AppError) => void
) => {
  const WrappedComponent = (props: P) => {
    const { handleError } = useErrorHandler();

    const handleErrorWrapper = (error: unknown) => {
      const appError = handleError(error);
      onError?.(appError);
    };

    return React.createElement(Component, { 
      ...props, 
      onError: handleErrorWrapper 
    });
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};