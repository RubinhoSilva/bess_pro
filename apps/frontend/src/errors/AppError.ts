/**
 * Base error class for application-specific errors
 * Provides structured error handling with type, code, and context
 */

export type ErrorType = 'validation' | 'network' | 'business' | 'system' | 'auth' | 'equipment' | 'configuration';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  user?: string;
  action?: string;
  data?: any;
  url?: string;
  timestamp?: string;
  component?: string;
  originalError?: unknown;
  status?: number;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: string,
    type: ErrorType,
    severity: ErrorSeverity = 'medium',
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.type = type;
    this.severity = severity;
    this.context = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context
    };
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Create a validation error
   */
  static validation(message: string, code: string = 'VALIDATION_ERROR', context?: ErrorContext): AppError {
    return new AppError(message, code, 'validation', 'low', context);
  }

  /**
   * Create a network error
   */
  static network(message: string, code: string = 'NETWORK_ERROR', context?: ErrorContext): AppError {
    return new AppError(message, code, 'network', 'medium', context);
  }

  /**
   * Create a business logic error
   */
  static business(message: string, code: string = 'BUSINESS_ERROR', context?: ErrorContext): AppError {
    return new AppError(message, code, 'business', 'medium', context);
  }

  /**
   * Create a system error
   */
  static system(message: string, code: string = 'SYSTEM_ERROR', context?: ErrorContext): AppError {
    return new AppError(message, code, 'system', 'high', context);
  }

  /**
   * Create an authentication error
   */
  static auth(message: string, code: string = 'AUTH_ERROR', context?: ErrorContext): AppError {
    return new AppError(message, code, 'auth', 'high', context);
  }

  /**
   * Create an equipment-related error
   */
  static equipment(message: string, code: string = 'EQUIPMENT_ERROR', context?: ErrorContext): AppError {
    return new AppError(message, code, 'equipment', 'medium', context);
  }

  /**
   * Create a configuration error
   */
  static configuration(message: string, code: string = 'CONFIG_ERROR', context?: ErrorContext): AppError {
    return new AppError(message, code, 'configuration', 'medium', context);
  }

  /**
   * Convert to JSON for logging/reporting
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if error is recoverable (can be retried)
   */
  get isRecoverable(): boolean {
    return this.type === 'network' || 
           (this.type === 'system' && this.severity !== 'critical');
  }

  /**
   * Check if error should show user feedback
   */
  get shouldShowUser(): boolean {
    return this.type !== 'system' || this.severity !== 'low';
  }
}