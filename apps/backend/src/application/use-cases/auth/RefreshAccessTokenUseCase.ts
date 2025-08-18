import { Result } from '../../common/Result';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../services/ITokenService';
import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { UserId } from '../../../domain/value-objects/UserId';

export interface RefreshAccessTokenRequest {
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshAccessTokenResponse {
  accessToken: string;
  newRefreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  expiresIn: number;
  tokenType: string;
}

export class RefreshAccessTokenUseCase {
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository,
    private userRepository: IUserRepository,
    private tokenService: ITokenService
  ) {}

  async execute(request: RefreshAccessTokenRequest): Promise<Result<RefreshAccessTokenResponse>> {
    try {
      // Buscar refresh token
      const refreshTokenEntity = await this.refreshTokenRepository.findByToken(request.refreshToken);
      
      if (!refreshTokenEntity) {
        return Result.failure('Refresh token inválido');
      }

      // Verificar se o token é válido
      if (!refreshTokenEntity.isValid()) {
        // Revogar token se estiver expirado ou já revogado
        if (!refreshTokenEntity.getIsRevoked()) {
          refreshTokenEntity.revoke();
          await this.refreshTokenRepository.update(refreshTokenEntity);
        }
        return Result.failure('Refresh token expirado ou revogado');
      }

      // Buscar usuário
      const user = await this.userRepository.findById(refreshTokenEntity.getUserId().getValue());
      if (!user) {
        return Result.failure('Usuário não encontrado');
      }

      // Verificar se usuário está ativo
      if (!user.isActive()) {
        return Result.failure('Usuário inativo');
      }

      // Revogar o token atual
      refreshTokenEntity.revoke();
      await this.refreshTokenRepository.update(refreshTokenEntity);

      // Gerar novo access token
      const accessToken = this.tokenService.generateAccessToken({
        userId: user.getId(),
        email: user.getEmail().getValue(),
        role: user.getRole()
      });

      // Gerar novo refresh token
      const newRefreshToken = RefreshToken.create({
        userId: user.getId(),
        token: RefreshToken.generateToken(),
        expiresAt: RefreshToken.createExpirationDate(30), // 30 dias
        deviceInfo: request.deviceInfo || 'Unknown Device',
        ipAddress: request.ipAddress || 'Unknown IP',
        userAgent: request.userAgent || 'Unknown User Agent'
      });

      await this.refreshTokenRepository.save(newRefreshToken);

      // Limitar número de tokens ativos por usuário (máximo 5 dispositivos)
      await this.limitActiveTokens(UserId.create(user.getId()), 5);

      const response: RefreshAccessTokenResponse = {
        accessToken,
        newRefreshToken: newRefreshToken.getToken(),
        user: {
          id: user.getId(),
          email: user.getEmail().getValue(),
          name: user.getName().getValue(),
          role: user.getRole().getValue() as string
        },
        expiresIn: 3600, // 1 hora
        tokenType: 'Bearer'
      };

      return Result.success(response);

    } catch (error) {
      console.error('RefreshAccessTokenUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }

  private async limitActiveTokens(userId: UserId, maxTokens: number): Promise<void> {
    try {
      const activeTokens = await this.refreshTokenRepository.findActiveByUserId(userId);
      
      if (activeTokens.length > maxTokens) {
        // Manter apenas os mais recentes
        const tokensToRevoke = activeTokens
          .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime())
          .slice(maxTokens);

        for (const token of tokensToRevoke) {
          await this.refreshTokenRepository.revokeToken(token.getToken());
        }
      }
    } catch (error) {
      console.error('Error limiting active tokens:', error);
      // Não falhar o processo principal por causa disso
    }
  }
}