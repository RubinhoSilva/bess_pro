export enum ErrorCodes {
  // Authentication errors
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INSUFFICIENT_ROLE = 'INSUFFICIENT_ROLE',
  INSUFFICIENT_OWNERSHIP = 'INSUFFICIENT_OWNERSHIP',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  
  // Business logic errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CREATE_RATE_LIMIT_EXCEEDED = 'CREATE_RATE_LIMIT_EXCEEDED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DUPLICATE_KEY_ERROR = 'DUPLICATE_KEY_ERROR',
  
  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export class AppError extends Error {
  public readonly code: ErrorCodes;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCodes,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();
    
    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  // Static factory methods for common errors
  static badRequest(message: string, details?: any): AppError {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, true, details);
  }

  static unauthorized(message: string = 'Token de autenticação requerido'): AppError {
    return new AppError(ErrorCodes.AUTHENTICATION_REQUIRED, message, 401);
  }

  static forbidden(message: string = 'Acesso negado'): AppError {
    return new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS, message, 403);
  }

  static notFound(resource: string = 'Recurso'): AppError {
    return new AppError(ErrorCodes.RESOURCE_NOT_FOUND, `${resource} não encontrado`, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(ErrorCodes.RESOURCE_ALREADY_EXISTS, message, 409);
  }

  static rateLimitExceeded(message: string = 'Muitas tentativas. Tente novamente mais tarde.'): AppError {
    return new AppError(ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429);
  }

  static internal(message: string = 'Erro interno do servidor', details?: any): AppError {
    return new AppError(ErrorCodes.INTERNAL_ERROR, message, 500, true, details);
  }

  static database(message: string = 'Erro na base de dados', details?: any): AppError {
    return new AppError(ErrorCodes.DATABASE_ERROR, message, 500, true, details);
  }

  static businessRule(message: string, details?: any): AppError {
    return new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, message, 422, true, details);
  }

  // Check if error is operational (safe to expose to client)
  isOperationalError(): boolean {
    return this.isOperational;
  }

  // Convert to JSON response format
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp.toISOString(),
        ...(this.details && { details: this.details })
      }
    };
  }
}

// Domain-specific error classes
export class ClientAlertError extends AppError {
  static invalidDate(message: string = 'Data do alerta deve ser no futuro'): ClientAlertError {
    return new ClientAlertError(ErrorCodes.VALIDATION_ERROR, message, 400);
  }

  static clientNotFound(): ClientAlertError {
    return new ClientAlertError(ErrorCodes.RESOURCE_NOT_FOUND, 'Cliente não encontrado', 404);
  }

  static alertNotFound(): ClientAlertError {
    return new ClientAlertError(ErrorCodes.RESOURCE_NOT_FOUND, 'Alerta não encontrado', 404);
  }

  static invalidRecurrence(message: string = 'Configuração de recorrência inválida'): ClientAlertError {
    return new ClientAlertError(ErrorCodes.BUSINESS_RULE_VIOLATION, message, 422);
  }
}

export class AuthError extends AppError {
  static invalidCredentials(): AuthError {
    return new AuthError(ErrorCodes.INVALID_CREDENTIALS, 'Credenciais inválidas', 401);
  }

  static tokenExpired(): AuthError {
    return new AuthError(ErrorCodes.TOKEN_EXPIRED, 'Token expirado', 401);
  }

  static tokenInvalid(): AuthError {
    return new AuthError(ErrorCodes.TOKEN_INVALID, 'Token inválido', 401);
  }

  static insufficientRole(requiredRoles: string[]): AuthError {
    return new AuthError(
      ErrorCodes.INSUFFICIENT_ROLE, 
      `Acesso negado. Roles requeridos: ${requiredRoles.join(', ')}`, 
      403
    );
  }
}