import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    teamId?: string;
  };
}

export const superAdminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return;
  }

  // Verificar se é o email de admin configurado na .env
  if (req.user.email !== adminEmail) {
    res.status(403).json({
      success: false,
      message: 'Acesso negado: apenas o super admin pode gerenciar teams'
    });
    return;
  }

  next();
};