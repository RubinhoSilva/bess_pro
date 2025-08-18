import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export interface AuthorizationOptions {
  roles?: string[];
  permissions?: string[];
  requireOwnership?: boolean;
  ownershipField?: string; // campo que contém o ID do owner (ex: 'userId', 'clientId')
}

/**
 * Middleware de autorização baseado em roles e permissões
 */
export function requireAuthorization(options: AuthorizationOptions = {}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Token de autenticação requerido'
          }
        });
        return;
      }

      // Verificar roles se especificado
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(user.role)) {
          res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_ROLE',
              message: `Acesso negado. Roles requeridos: ${options.roles.join(', ')}`
            }
          });
          return;
        }
      }

      // Verificar ownership se requerido
      if (options.requireOwnership && options.ownershipField) {
        const resourceUserId = getOwnershipValue(req, options.ownershipField);
        
        if (!resourceUserId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_OWNERSHIP_FIELD',
              message: `Campo de propriedade ${options.ownershipField} não encontrado`
            }
          });
          return;
        }

        // Super admin pode acessar tudo
        if (user.role !== 'super_admin' && resourceUserId !== user.id) {
          res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_OWNERSHIP',
              message: 'Acesso negado. Você só pode acessar seus próprios recursos'
            }
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Erro interno na verificação de autorização'
        }
      });
    }
  };
}

/**
 * Extrai o valor de ownership do request
 */
function getOwnershipValue(req: AuthenticatedRequest, field: string): string | undefined {
  // Verificar no body
  if (req.body && req.body[field]) {
    return req.body[field];
  }
  
  // Verificar nos params
  if (req.params && req.params[field]) {
    return req.params[field];
  }
  
  // Verificar na query
  if (req.query && req.query[field]) {
    return req.query[field] as string;
  }
  
  // Para casos específicos como alertas, verificar se é o próprio user
  if (field === 'userId' && req.user) {
    return req.user.id;
  }
  
  return undefined;
}

/**
 * Middleware simplificado para verificar apenas roles
 */
export function requireRole(...roles: string[]) {
  return requireAuthorization({ roles });
}

/**
 * Middleware para verificar ownership de recursos
 */
export function requireOwnership(ownershipField: string = 'userId') {
  return requireAuthorization({ 
    requireOwnership: true, 
    ownershipField 
  });
}

/**
 * Middleware para admin
 */
export function requireAdmin() {
  return requireAuthorization({ 
    roles: ['admin', 'super_admin'] 
  });
}

/**
 * Middleware para super admin apenas
 */
export function requireSuperAdmin() {
  return requireAuthorization({ 
    roles: ['super_admin'] 
  });
}

/**
 * Middleware que permite acesso se o usuário for admin OU dono do recurso
 */
export function requireAdminOrOwnership(ownershipField: string = 'userId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Token de autenticação requerido'
        }
      });
      return;
    }

    // Se for admin, libera acesso
    if (['admin', 'super_admin'].includes(user.role)) {
      next();
      return;
    }

    // Senão, verifica ownership
    const resourceUserId = getOwnershipValue(req, ownershipField);
    
    if (!resourceUserId || resourceUserId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_AUTHORIZATION',
          message: 'Acesso negado. Você precisa ser admin ou dono do recurso'
        }
      });
      return;
    }

    next();
  };
}