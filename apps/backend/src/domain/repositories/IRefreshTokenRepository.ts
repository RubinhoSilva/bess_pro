import { RefreshToken } from '../entities/RefreshToken';
import { UserId } from '../value-objects/UserId';
import { IBaseRepository } from './IBaseRepository';

export interface IRefreshTokenRepository extends IBaseRepository<RefreshToken, string> {
  /**
   * Busca token por valor
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Busca tokens ativos de um usuário
   */
  findActiveByUserId(userId: UserId): Promise<RefreshToken[]>;

  /**
   * Busca tokens de um usuário por dispositivo
   */
  findByUserIdAndDevice(
    userId: UserId, 
    deviceInfo: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<RefreshToken[]>;

  /**
   * Revoga token específico
   */
  revokeToken(token: string): Promise<void>;

  /**
   * Revoga todos os tokens de um usuário
   */
  revokeAllUserTokens(userId: UserId): Promise<void>;

  /**
   * Revoga todos os tokens de um usuário exceto o atual
   */
  revokeAllUserTokensExcept(userId: UserId, currentToken: string): Promise<void>;

  /**
   * Remove tokens expirados
   */
  deleteExpiredTokens(): Promise<void>;

  /**
   * Conta tokens ativos de um usuário
   */
  countActiveByUserId(userId: UserId): Promise<number>;

  /**
   * Busca tokens que expiram em breve (próximas 24h)
   */
  findTokensExpiringWithin(hours: number): Promise<RefreshToken[]>;

  /**
   * Busca tokens por IP para detectar atividade suspeita
   */
  findRecentTokensByIp(ipAddress: string, hoursBack: number): Promise<RefreshToken[]>;

  /**
   * Estatísticas de tokens por usuário
   */
  getUserTokenStats(userId: UserId): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
    devicesCount: number;
    lastLoginAt: Date | null;
  }>;

  /**
   * Busca tokens suspeitos (muitos logins de IPs diferentes)
   */
  findSuspiciousActivity(userId: UserId, timeWindowHours: number): Promise<{
    uniqueIps: number;
    tokensCreated: number;
    suspiciousScore: number;
  }>;
  
  /**
   * Verifica se um token existe
   */
  exists(id: string): Promise<boolean>;
}