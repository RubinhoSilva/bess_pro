import { Request, Response } from 'express';
import { Result } from '../../application/common/Result';

export abstract class BaseController {
  protected ok<T>(res: Response, data?: T): Response {
    if (data) {
      return res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  protected created<T>(res: Response, data: T): Response {
    return res.status(201).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  protected badRequest(res: Response, message: string): Response {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  protected unauthorized(res: Response, message: string = 'Não autorizado'): Response {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  protected forbidden(res: Response, message: string = 'Acesso negado'): Response {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  protected notFound(res: Response, message: string = 'Recurso não encontrado'): Response {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  protected conflict(res: Response, message: string): Response {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  protected internalServerError(res: Response, message: string = 'Erro interno do servidor'): Response {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  protected handleResult<T>(res: Response, result: Result<T>): Response {
    if (result.isSuccess) {
      return this.ok(res, result.value);
    }

    // Parse common error types
    const errorMessage = result.error!;
    
    if (errorMessage.includes('não encontrado') || errorMessage.includes('not found')) {
      return this.notFound(res, errorMessage);
    }
    
    if (errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
      return this.conflict(res, errorMessage);
    }
    
    if (errorMessage.includes('permissão') || errorMessage.includes('permission')) {
      return this.forbidden(res, errorMessage);
    }

    if (errorMessage.includes('inválido') || errorMessage.includes('invalid')) {
      return this.badRequest(res, errorMessage);
    }

    return this.badRequest(res, errorMessage);
  }

  protected extractUserId(req: Request): string {
    const user = (req as any).user;
    if (!user || (!user.userId && !user.id)) {
      throw new Error('Usuário não autenticado');
    }
    return user.userId || user.id;
  }

  protected extractUserIdOptional(req: Request): string | undefined {
    const user = (req as any).user;
    return user?.userId || user?.id;
  }

  protected extractTeamId(req: Request): string {
    const user = (req as any).user;
    if (!user || (!user.teamId && !user.team)) {
      throw new Error('Time não autenticado');
    }
    return user.teamId || user.team;
  }

  protected extractTeamIdOptional(req: Request): string | undefined {
    const user = (req as any).user;
    return user?.teamId || user?.team;
  }

  protected extractPagination(req: Request): { page: number; pageSize: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    
    return { page, pageSize };
  }
}