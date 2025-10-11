/**
 * Centralized error handling system
 * Provides consistent error processing, logging, and user feedback
 */

import toast from 'react-hot-toast';
import { AppError, ErrorType, ErrorSeverity, ErrorContext } from './AppError';

// Enum values for iteration
const ERROR_TYPES = ['validation', 'network', 'business', 'system', 'auth', 'equipment', 'configuration'] as const;
const ERROR_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export class ErrorHandler {
  private static readonly MAX_LOG_ENTRIES = 100;
  private static readonly STORAGE_KEY = 'app_error_logs';

  /**
   * Main error handling method - converts any error to AppError and processes it
   */
  static handle(error: unknown, context?: string, contextData?: ErrorContext): AppError {
    const appError = this.normalizeError(error, context, contextData);
    
    // Log the error
    this.log(appError);
    
    // Show user feedback if needed
    if (appError.shouldShowUser) {
      this.showToast(appError);
    }
    
    // Report critical errors
    if (appError.severity === 'critical') {
      this.report(appError);
    }
    
    return appError;
  }

  /**
   * Convert any error to AppError with intelligent detection
   */
  static normalizeError(error: unknown, context?: string, contextData?: ErrorContext): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }

    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error, context);
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return AppError.network(
        this.getNetworkErrorMessage(error),
        'NETWORK_CONNECTION_FAILED',
        { action: context }
      );
    }

    // Handle validation errors
    if (this.isValidationError(error)) {
      return AppError.validation(
        this.getValidationErrorMessage(error),
        'VALIDATION_FAILED',
        { action: context, ...contextData }
      );
    }

    // Handle generic Error objects
    if (error instanceof Error) {
      return this.categorizeGenericError(error, context, contextData);
    }

    // Handle unknown errors
    return AppError.system(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      { action: context, originalError: error, ...contextData }
    );
  }

  /**
   * Log error to localStorage and console
   */
  static log(error: AppError): void {
    // Console logging with appropriate level
    this.logToConsole(error);

    // Store in localStorage for debugging
    this.storeError(error);
  }

  /**
   * Show appropriate toast notification based on error type and severity
   */
  static showToast(error: AppError): void {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
      position: 'top-right' as const,
    };

    switch (error.type) {
      case 'validation':
        toast.error(error.message, {
          ...toastOptions,
          icon: '⚠️',
        });
        break;

      case 'network':
        toast.error(error.message, {
          ...toastOptions,
          icon: '🌐',
        });
        break;

      case 'auth':
        toast.error(error.message, {
          ...toastOptions,
          icon: '🔒',
          duration: 8000, // Longer for auth errors
        });
        break;

      case 'business':
        toast.error(error.message, {
          ...toastOptions,
          icon: '💼',
        });
        break;

      case 'equipment':
        toast.error(error.message, {
          ...toastOptions,
          icon: '⚡',
        });
        break;

      case 'configuration':
        toast.error(error.message, {
          ...toastOptions,
          icon: '⚙️',
        });
        break;

      case 'system':
      default:
        if (error.severity === 'critical') {
          toast.error('A critical error occurred. Please refresh the page.', {
            ...toastOptions,
            icon: '🚨',
            duration: 10000,
          });
        } else {
          toast.error(error.message, {
            ...toastOptions,
            icon: '❌',
          });
        }
        break;
    }
  }

  /**
   * Report error to external monitoring service
   * For now, stores in localStorage - can be extended to Sentry, etc.
   */
  static report(error: AppError): void {
    try {
      // Store critical errors separately for monitoring
      const criticalErrors = JSON.parse(
        localStorage.getItem('critical_errors') || '[]'
      );
      
      criticalErrors.push(error.toJSON());
      
      // Keep only last 20 critical errors
      if (criticalErrors.length > 20) {
        criticalErrors.splice(0, criticalErrors.length - 20);
      }
      
      localStorage.setItem('critical_errors', JSON.stringify(criticalErrors));

      // In production, you would send to monitoring service
      if (import.meta.env.PROD) {
        // Example: Sentry.captureException(error);
        console.log('🚨 Critical Error Reported:', error.toJSON());
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Retry mechanism for recoverable errors
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: AppError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handle(error, context);

        // Don't retry if error is not recoverable or it's the last attempt
        if (!lastError.isRecoverable || attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));

        // Show retry notification
        if (attempt < maxRetries) {
          toast.loading(`Retrying... (${attempt}/${maxRetries})`, {
            id: `retry-${attempt}`,
          });
        }
      }
    }

    throw lastError!;
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    try {
      const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      
      const stats = {
        total: logs.length,
        byType: {} as Record<ErrorType, number>,
        bySeverity: {} as Record<ErrorSeverity, number>,
        recent: logs.slice(-10).map(createAppErrorFromJSON),
      };

      // Initialize counters
      ERROR_TYPES.forEach(type => {
        stats.byType[type] = 0;
      });
      ERROR_SEVERITIES.forEach(severity => {
        stats.bySeverity[severity] = 0;
      });

      // Count errors
      logs.forEach((log: any) => {
        const type = log.type as ErrorType;
        const severity = log.severity as ErrorSeverity;
        
        if (type && ERROR_TYPES.includes(type)) {
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        }
        if (severity && ERROR_SEVERITIES.includes(severity)) {
          stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        total: 0,
        byType: {} as Record<ErrorType, number>,
        bySeverity: {} as Record<ErrorSeverity, number>,
        recent: [],
      };
    }
  }

  /**
   * Clear error logs
   */
  static clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('critical_errors');
  }

  // Private helper methods

  private static isAxiosError(error: any): boolean {
    return error && error.isAxiosError === true;
  }

  private static isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError &&
      (error.message.includes('Network Error') ||
       error.message.includes('fetch') ||
       error.message.includes('Failed to fetch'))
    );
  }

  private static isValidationError(error: any): boolean {
    return (
      error &&
      (error.code === 'VALIDATION_ERROR' ||
       error.name === 'ValidationError' ||
       (error.response?.status === 400 && error.response?.data?.error?.details))
    );
  }

  private static handleAxiosError(error: any, context?: string, contextData?: ErrorContext): AppError {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;
    const baseContext = { action: context, ...contextData };

    switch (status) {
      case 401:
        return AppError.auth(
          message || 'Authentication required',
          'UNAUTHORIZED',
          baseContext
        );

      case 403:
        return AppError.auth(
          message || 'Access denied',
          'FORBIDDEN',
          baseContext
        );

      case 404:
        return AppError.business(
          message || 'Resource not found',
          'NOT_FOUND',
          baseContext
        );

      case 409:
        return AppError.business(
          message || 'Conflict with existing data',
          'CONFLICT',
          baseContext
        );

      case 422:
        return AppError.validation(
          message || 'Invalid data provided',
          'UNPROCESSABLE_ENTITY',
          baseContext
        );

      case 429:
        return AppError.network(
          message || 'Too many requests',
          'RATE_LIMIT_EXCEEDED',
          baseContext
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return AppError.system(
          message || 'Server error occurred',
          'SERVER_ERROR',
          { ...baseContext, status }
        );

      default:
        if (error.code === 'ECONNABORTED') {
          return AppError.network(
            'Request timeout',
            'TIMEOUT',
            baseContext
          );
        }

        return AppError.network(
          message || 'Network error occurred',
          'NETWORK_ERROR',
          baseContext
        );
    }
  }

  private static categorizeGenericError(error: Error, context?: string, contextData?: ErrorContext): AppError {
    const message = error.message;
    const code = error.name || 'GENERIC_ERROR';
    const baseContext = { action: context, ...contextData };

    // Check for common error patterns
    if (message.includes('validation') || message.includes('required')) {
      return AppError.validation(message, code, baseContext);
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return AppError.auth(message, code, baseContext);
    }

    if (message.includes('network') || message.includes('connection')) {
      return AppError.network(message, code, baseContext);
    }

    if (message.includes('equipment') || message.includes('module') || message.includes('inverter')) {
      return AppError.equipment(message, code, baseContext);
    }

    if (message.includes('config') || message.includes('setting')) {
      return AppError.configuration(message, code, baseContext);
    }

    // Default to system error
    return AppError.system(message, code, baseContext);
  }

  private static getNetworkErrorMessage(error: any): string {
    if (error.message.includes('ERR_INTERNET_DISCONNECTED')) {
      return 'No internet connection';
    }
    if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      return 'Unable to connect to server';
    }
    if (error.message.includes('ERR_CONNECTION_TIMED_OUT')) {
      return 'Connection timeout';
    }
    return 'Network connection failed';
  }

  private static getValidationErrorMessage(error: any): string {
    if (error.response?.data?.error?.details?.length > 0) {
      return error.response.data.error.details[0].msg || error.response.data.error.details[0].message;
    }
    return error.message || 'Validation failed';
  }

  private static logToConsole(error: AppError): void {
    const logMethod = this.getConsoleMethod(error.severity);
    logMethod(
      `[${error.type.toUpperCase()}] ${error.code}: ${error.message}`,
      {
        context: error.context,
        stack: error.stack,
      }
    );
  }

  private static getConsoleMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case 'low':
        return console.debug;
      case 'medium':
        return console.info;
      case 'high':
        return console.warn;
      case 'critical':
        return console.error;
      default:
        return console.log;
    }
  }

  private static storeError(error: AppError): void {
    try {
      const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      logs.push(error.toJSON());

      // Keep only the most recent entries
      if (logs.length > this.MAX_LOG_ENTRIES) {
        logs.splice(0, logs.length - this.MAX_LOG_ENTRIES);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }
  }

  private static getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case 'low':
        return 2000;
      case 'medium':
        return 4000;
      case 'high':
        return 6000;
      case 'critical':
        return 10000;
      default:
        return 4000;
    }
  }
}

// Static method to create AppError from JSON (for localStorage recovery)
export const createAppErrorFromJSON = (json: any): AppError => {
  const error = new AppError(
    json.message,
    json.code,
    json.type,
    json.severity,
    json.context
  );
  error.stack = json.stack;
  return error;
};

// Export convenience functions
export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const withRetry = ErrorHandler.withRetry.bind(ErrorHandler);