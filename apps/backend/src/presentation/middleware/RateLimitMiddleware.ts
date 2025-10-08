import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export class RateLimitMiddleware {
  static general() {
    // Desabilitar completamente em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return (req: Request, res: Response, next: Function) => next();
    }
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas requisições. Tente novamente em alguns minutos.',
        },
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  static auth() {
    // Desabilitar completamente em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return (req: Request, res: Response, next: Function) => next();
    }
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs for auth endpoints (increased for development)
      message: {
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        },
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  static upload() {
    // Desabilitar completamente em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return (req: Request, res: Response, next: Function) => next();
    }
    
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 uploads per hour
      message: {
        success: false,
        error: {
          code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
          message: 'Limite de uploads excedido. Tente novamente em uma hora.',
        },
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}