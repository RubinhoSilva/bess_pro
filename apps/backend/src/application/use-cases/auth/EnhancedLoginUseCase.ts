import { Result } from '../../common/Result';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordHashService } from '../../services/IPasswordHashService';
import { ITokenService } from '../../services/ITokenService';
import { Email } from '../../../domain/value-objects/Email';
import { RefreshToken } from '../../../domain/entities/RefreshToken';

export interface EnhancedLoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  rememberMe?: boolean;
}

export interface EnhancedLoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    lastLoginAt: Date;
    isFirstLogin: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  sessionInfo: {
    deviceInfo: string;
    ipAddress: string;
    loginAt: Date;
    expiresAt: Date;
  };
}

export class EnhancedLoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private passwordHashService: IPasswordHashService,
    private tokenService: ITokenService
  ) {}

  async execute(request: EnhancedLoginRequest): Promise<Result<EnhancedLoginResponse>> {
    try {
      // Validar entrada
      if (!request.email || !request.password) {
        return Result.failure('Email e senha são obrigatórios');
      }

      // Buscar usuário com senha
      const email = Email.create(request.email);
      const userWithPassword = await this.userRepository.findByEmailWithPassword(email);

      if (!userWithPassword) {
        return Result.failure('Credenciais inválidas');
      }

      const { user, passwordHash } = userWithPassword;

      // Verificar se usuário está ativo
      if (!user.isActive()) {
        return Result.failure('Conta desativada. Entre em contato com o suporte.');
      }

      // Verificar senha
      const isValidPassword = await this.passwordHashService.verify(request.password, passwordHash);

      if (!isValidPassword) {
        return Result.failure('Credenciais inválidas');
      }

      // Verificar atividade suspeita
      const suspiciousActivity = await this.checkSuspiciousActivity(user.getId(), request.ipAddress);
      if (suspiciousActivity.isSuspicious) {
        return Result.failure('Atividade suspeita detectada. Tente novamente em alguns minutos.');
      }

      // Verificar se é primeiro login
      const isFirstLogin = user.getLastLoginAt() === null;

      // Atualizar último login
      user.updateLastLoginAt();
      await this.userRepository.update(user);

      // Gerar tokens
      const accessToken = this.tokenService.generateAccessToken({
        userId: user.getId(),
        email: user.getEmail().getValue(),
        role: user.getRole().getValue(),
        teamId: user.getTeamId().getValue()
      });

      // Configurar duração do refresh token baseado em "lembrar de mim"
      const refreshTokenDays = request.rememberMe ? 30 : 7;
      
      const refreshToken = RefreshToken.create({
        userId: user.getId(),
        token: RefreshToken.generateToken(),
        expiresAt: RefreshToken.createExpirationDate(refreshTokenDays),
        deviceInfo: request.deviceInfo || this.extractDeviceInfo(request.userAgent),
        ipAddress: request.ipAddress || 'Unknown IP',
        userAgent: request.userAgent || 'Unknown User Agent'
      });

      await this.refreshTokenRepository.save(refreshToken);

      // Verificar e limitar tokens ativos por usuário
      await this.manageActiveTokens(user.getId(), request.deviceInfo, request.ipAddress, request.userAgent);

      // Preparar resposta
      const response: EnhancedLoginResponse = {
        user: {
          id: user.getId(),
          email: user.getEmail().getValue(),
          name: user.getName().getValue(),
          role: user.getRole().getValue() as string,
          lastLoginAt: new Date(),
          isFirstLogin
        },
        accessToken,
        refreshToken: refreshToken.getToken(),
        expiresIn: 3600, // 1 hora
        tokenType: 'Bearer',
        sessionInfo: {
          deviceInfo: refreshToken.getDeviceInfo(),
          ipAddress: refreshToken.getIpAddress(),
          loginAt: refreshToken.getCreatedAt(),
          expiresAt: refreshToken.getExpiresAt()
        }
      };

      return Result.success(response);

    } catch (error) {
      console.error('EnhancedLoginUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }

  private async checkSuspiciousActivity(userId: any, ipAddress?: string): Promise<{ isSuspicious: boolean; reason?: string }> {
    try {
      if (!ipAddress) return { isSuspicious: false };

      // Verificar atividade suspeita nas últimas 2 horas
      const suspiciousStats = await this.refreshTokenRepository.findSuspiciousActivity(userId, 2);

      // Critérios de atividade suspeita:
      // 1. Mais de 5 IPs únicos nas últimas 2 horas
      // 2. Mais de 10 tentativas de login nas últimas 2 horas
      if (suspiciousStats.uniqueIps > 5) {
        return { isSuspicious: true, reason: 'Múltiplos IPs em pouco tempo' };
      }

      if (suspiciousStats.tokensCreated > 10) {
        return { isSuspicious: true, reason: 'Muitas tentativas de login' };
      }

      return { isSuspicious: false };

    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      return { isSuspicious: false };
    }
  }

  private async manageActiveTokens(userId: any, deviceInfo?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // Permitir múltiplas sessões: não revogar tokens do mesmo dispositivo
      // Apenas limpar tokens expirados para manter a limpeza da base
      await this.refreshTokenRepository.deleteExpiredTokens();

      // Limitar total de tokens ativos (aumentando para 20 sessões simultâneas)
      const activeTokens = await this.refreshTokenRepository.findActiveByUserId(userId);
      if (activeTokens.length > 20) {
        // Manter apenas os 20 mais recentes (permitir múltiplas sessões ativas)
        const tokensToRevoke = activeTokens
          .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime())
          .slice(20);

        for (const token of tokensToRevoke) {
          await this.refreshTokenRepository.revokeToken(token.getToken());
        }
      }

    } catch (error) {
      console.error('Error managing active tokens:', error);
      // Não falhar o login principal por causa disso
    }
  }

  private extractDeviceInfo(userAgent?: string): string {
    if (!userAgent) return 'Unknown Device';

    // Extrair informações básicas do user agent
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux PC';
    
    return 'Desktop Browser';
  }
}