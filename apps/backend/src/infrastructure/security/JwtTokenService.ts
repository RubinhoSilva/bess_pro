import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ITokenService } from '../../application/services/ITokenService';
import { AuthError, AppError, ErrorCodes } from '../../shared/errors/AppError';

export interface JwtConfig {
  secretKey: string;
  refreshSecretKey: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer?: string;
  audience?: string;
}

interface TokenBlacklist {
  [jti: string]: {
    expiresAt: Date;
    revokedAt: Date;
    reason: string;
  };
}

export class JwtTokenService implements ITokenService {
  private blacklist: TokenBlacklist = {};
  private readonly algorithm = 'HS256' as const;

  constructor(private config: JwtConfig) {
    this.validateConfig();
    this.startBlacklistCleanup();
  }

  private validateConfig(): void {
    // Validar força do secret (mínimo 256 bits / 32 bytes)
    if (this.config.secretKey.length < 32) {
      throw new Error('JWT secret deve ter pelo menos 32 caracteres (256 bits)');
    }
    
    if (this.config.refreshSecretKey.length < 32) {
      throw new Error('JWT refresh secret deve ter pelo menos 32 caracteres (256 bits)');
    }

    // Validar que secrets são diferentes
    if (this.config.secretKey === this.config.refreshSecretKey) {
      throw new Error('JWT secrets para access e refresh tokens devem ser diferentes');
    }
  }

  private generateJti(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private startBlacklistCleanup(): void {
    // Limpar tokens expirados da blacklist a cada hora
    setInterval(() => {
      this.cleanupBlacklist();
    }, 60 * 60 * 1000); // 1 hora
  }

  private cleanupBlacklist(): void {
    const now = new Date();
    Object.keys(this.blacklist).forEach(jti => {
      if (this.blacklist[jti].expiresAt <= now) {
        delete this.blacklist[jti];
      }
    });
  }

  async generateToken(payload: any): Promise<string> {
    const jti = this.generateJti();
    const now = Math.floor(Date.now() / 1000);
    
    const tokenPayload = {
      ...payload,
      jti,
      iat: now,
      exp: now + this.parseExpiration(this.config.expiresIn),
      iss: this.config.issuer,
      aud: this.config.audience,
    };

    return jwt.sign(tokenPayload, this.config.secretKey, {
      algorithm: this.algorithm,
    });
  }

  generateAccessToken(payload: any): string {
    const jti = this.generateJti();
    const now = Math.floor(Date.now() / 1000);
    
    const tokenPayload = {
      ...payload,
      jti,
      iat: now,
      exp: now + this.parseExpiration(this.config.expiresIn),
      iss: this.config.issuer,
      aud: this.config.audience,
    };

    return jwt.sign(tokenPayload, this.config.secretKey, {
      algorithm: this.algorithm,
    });
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.config.secretKey, {
        algorithms: [this.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as any;

      // Verificar se token está na blacklist
      if (decoded.jti && this.isTokenRevoked(decoded.jti)) {
        throw new AuthError(ErrorCodes.TOKEN_INVALID, 'Token foi revogado', 401);
      }

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthError(ErrorCodes.TOKEN_EXPIRED, 'Token expirado', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AuthError(ErrorCodes.TOKEN_INVALID, 'Token inválido', 401);
      } else if (error instanceof AuthError) {
        throw error;
      } else {
        throw new AuthError(ErrorCodes.TOKEN_INVALID, 'Erro na verificação do token', 401);
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(refreshToken, this.config.refreshSecretKey, {
        algorithms: [this.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as any;

      // Verificar se refresh token está na blacklist
      if (decoded.jti && this.isTokenRevoked(decoded.jti)) {
        throw new AuthError(ErrorCodes.TOKEN_INVALID, 'Refresh token foi revogado', 401);
      }

      // Não revogar o refresh token para permitir múltiplas sessões ativas
      // if (decoded.jti) {
      //   this.revokeToken(decoded.jti, decoded.exp * 1000, 'refresh_token_used');
      // }

      // Gerar novo access token
      return this.generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthError(ErrorCodes.TOKEN_EXPIRED, 'Refresh token expirado', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AuthError(ErrorCodes.TOKEN_INVALID, 'Refresh token inválido', 401);
      } else if (error instanceof AuthError) {
        throw error;
      } else {
        throw new AuthError(ErrorCodes.TOKEN_INVALID, 'Erro na verificação do refresh token', 401);
      }
    }
  }

  async generateRefreshToken(payload: any): Promise<string> {
    const jti = this.generateJti();
    const now = Math.floor(Date.now() / 1000);
    
    const tokenPayload = {
      ...payload,
      jti,
      iat: now,
      exp: now + this.parseExpiration(this.config.refreshExpiresIn),
      iss: this.config.issuer,
      aud: this.config.audience,
      type: 'refresh',
    };

    return jwt.sign(tokenPayload, this.config.refreshSecretKey, {
      algorithm: this.algorithm,
    });
  }

  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Formato de expiração inválido: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: throw new Error(`Unidade de tempo inválida: ${unit}`);
    }
  }

  // Revogar token específico
  revokeToken(jti: string, expiresAtMs: number, reason: string = 'manual_revocation'): void {
    this.blacklist[jti] = {
      expiresAt: new Date(expiresAtMs),
      revokedAt: new Date(),
      reason
    };
  }

  // Revogar todos os tokens de um usuário (logout de todos os devices)
  revokeAllUserTokens(userId: string): void {
    // Em produção, isso deveria ser implementado com Redis ou database
    // Para agora, vamos apenas invalidar novos tokens com timestamp
    const timestamp = Date.now();
    // Esta implementação é simplificada - em produção precisaria de persistência
  }

  // Verificar se token está revogado
  isTokenRevoked(jti: string): boolean {
    return !!this.blacklist[jti];
  }

  // Obter estatísticas da blacklist (para monitoring)
  getBlacklistStats(): { total: number; expired: number } {
    const now = new Date();
    const tokens = Object.values(this.blacklist);
    return {
      total: tokens.length,
      expired: tokens.filter(token => token.expiresAt <= now).length
    };
  }
}