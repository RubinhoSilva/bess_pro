import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ErrorHandlerMiddleware {
  static handle() {
    return (error: AppError, req: Request, res: Response, next: NextFunction): void => {
      console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      // Default error response
      let statusCode = error.statusCode || 500;
      let message = error.message || 'Erro interno do servidor';

      // Handle specific error types
      if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Dados de entrada inválidos';
      } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'ID inválido';
      } else if (error.name === 'MongoError' && (error as any).code === 11000) {
        statusCode = 409;
        message = 'Recurso já existe';
      } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido';
      } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado';
      } else if (error.name === 'MulterError') {
        statusCode = 400;
        if ((error as any).code === 'LIMIT_FILE_SIZE') {
          message = 'Arquivo muito grande';
        } else if ((error as any).code === 'LIMIT_FILE_COUNT') {
          message = 'Muitos arquivos';
        } else {
          message = 'Erro no upload do arquivo';
        }
      }

      // Don't leak error details in production
      if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Erro interno do servidor';
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.name || 'INTERNAL_SERVER_ERROR',
          message,
        },
        timestamp: new Date().toISOString(),
      });
    };
  }

  static notFound() {
    return (req: Request, res: Response): void => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
        },
        timestamp: new Date().toISOString(),
      });
    };
  }
}