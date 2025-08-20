import { Request, Response, NextFunction } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { UserId } from '../../domain/value-objects/UserId';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

export class AuthMiddleware {
  constructor(private container: Container) {}

  authenticate() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Token de acesso é obrigatório',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const token = authHeader.substring(7); // Remove "Bearer "
        
        const tokenService = this.container.resolve<any>(ServiceTokens.TOKEN_SERVICE);
        const decoded = await tokenService.verifyToken(token);

        // Skip user verification for performance - trust the JWT token
        // Note: In production, consider adding caching for user verification

        // Add user to request
        (req as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token inválido ou expirado',
          },
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  authorize(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuário não autenticado',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Acesso negado para este recurso',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    };
  }

  optional() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          next();
          return;
        }

        const token = authHeader.substring(7);
        
        const tokenService = this.container.resolve<any>(ServiceTokens.TOKEN_SERVICE);
        const decoded = await tokenService.verifyToken(token);

        // Skip user verification for performance in optional middleware
        (req as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        // Ignore auth errors in optional middleware
        next();
      }
    };
  }
}