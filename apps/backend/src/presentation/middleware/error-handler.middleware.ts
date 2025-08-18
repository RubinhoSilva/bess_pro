import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '../../shared/errors/AppError';

// Mock ValidationError for compatibility
class ValidationError {
  property: string;
  value: any;
  constraints?: Record<string, string>;
  stack?: string;
  
  constructor(property: string, value: any, constraints?: Record<string, string>) {
    this.property = property;
    this.value = value;
    this.constraints = constraints;
  }
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    details?: any;
    stack?: string;
  };
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for monitoring
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Handle AppError instances
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp.toISOString(),
        ...(error.details && { details: error.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle validation errors from class-validator
  if (Array.isArray(error) && error[0] instanceof ValidationError) {
    const validationErrors = error as ValidationError[];
    const formattedErrors = validationErrors.map(err => ({
      field: err.property,
      value: err.value,
      constraints: err.constraints
    }));

    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Dados de entrada inválidos',
        timestamp: new Date().toISOString(),
        details: formattedErrors,
        ...(process.env.NODE_ENV === 'development' && { stack: (error[0] as any)?.stack })
      }
    };

    res.status(400).json(response);
    return;
  }

  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    const mongoError = error as any;
    
    // Duplicate key error
    if (mongoError.code === 11000) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: ErrorCodes.DUPLICATE_KEY_ERROR,
          message: 'Recurso já existe',
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && { 
            details: mongoError.keyPattern,
            stack: error.stack 
          })
        }
      };

      res.status(409).json(response);
      return;
    }

    // General database error
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.DATABASE_ERROR,
        message: 'Erro na base de dados',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          details: mongoError.message,
          stack: error.stack 
        })
      }
    };

    res.status(500).json(response);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.TOKEN_INVALID,
        message: 'Token inválido',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };

    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.TOKEN_EXPIRED,
        message: 'Token expirado',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };

    res.status(401).json(response);
    return;
  }

  // Handle syntax errors (malformed JSON, etc.)
  if (error instanceof SyntaxError && 'body' in error) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_INPUT_FORMAT,
        message: 'Formato de dados inválido',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };

    res.status(400).json(response);
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : error.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error
      })
    }
  };

  res.status(500).json(response);
}

// Async error wrapper for route handlers
export function asyncErrorHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Handle 404 errors (route not found)
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.RESOURCE_NOT_FOUND,
      message: `Rota ${req.method} ${req.path} não encontrada`,
      timestamp: new Date().toISOString()
    }
  };

  res.status(404).json(response);
}