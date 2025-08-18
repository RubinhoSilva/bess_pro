import { Result } from '../../common/Result';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { UserId } from '../../../domain/value-objects/UserId';

export interface RevokeTokenRequest {
  refreshToken?: string;
  userId?: string;
  revokeAll?: boolean;
  revokeAllExcept?: string; // Token atual para manter ativo
}

export interface RevokeTokenResponse {
  success: boolean;
  tokensRevoked: number;
  message: string;
}

export class RevokeTokenUseCase {
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(request: RevokeTokenRequest): Promise<Result<RevokeTokenResponse>> {
    try {
      let tokensRevoked = 0;
      let message = '';

      if (request.refreshToken) {
        // Revogar token específico
        const token = await this.refreshTokenRepository.findByToken(request.refreshToken);
        if (token && token.isValid()) {
          await this.refreshTokenRepository.revokeToken(request.refreshToken);
          tokensRevoked = 1;
          message = 'Token revogado com sucesso';
        } else {
          return Result.failure('Token não encontrado ou já inválido');
        }
      } else if (request.userId && request.revokeAll) {
        // Revogar todos os tokens do usuário
        const userId = UserId.create(request.userId);
        const activeTokens = await this.refreshTokenRepository.findActiveByUserId(userId);
        
        if (request.revokeAllExcept) {
          await this.refreshTokenRepository.revokeAllUserTokensExcept(userId, request.revokeAllExcept);
          tokensRevoked = Math.max(0, activeTokens.length - 1);
          message = 'Todos os outros tokens revogados com sucesso';
        } else {
          await this.refreshTokenRepository.revokeAllUserTokens(userId);
          tokensRevoked = activeTokens.length;
          message = 'Todos os tokens revogados com sucesso';
        }
      } else {
        return Result.failure('Parâmetros insuficientes para revogação');
      }

      return Result.success({
        success: true,
        tokensRevoked,
        message
      });

    } catch (error) {
      console.error('RevokeTokenUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}