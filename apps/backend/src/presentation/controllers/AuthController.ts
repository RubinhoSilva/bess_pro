import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RegisterUserUseCase } from '../../application/use-cases/user/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/user/LoginUserUseCase';
import { ForgotPasswordUseCase } from '../../application/use-cases/auth/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/ResetPasswordUseCase';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { UserId } from '../../domain/value-objects/UserId';

export class AuthController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, name, company, role } = req.body;

      const useCase = this.container.resolve<RegisterUserUseCase>(ServiceTokens.REGISTER_USER_USE_CASE);
      
      const result = await useCase.execute({
        email,
        password,
        name,
        company,
        role,
      });

      if (result.isSuccess) {
        return this.created(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Register error:', error);
      return this.internalServerError(res, 'Erro ao registrar usuário');
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      const useCase = this.container.resolve<LoginUserUseCase>(ServiceTokens.LOGIN_USER_USE_CASE);
      
      const result = await useCase.execute({
        email,
        password,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Login error:', error);
      return this.internalServerError(res, 'Erro ao fazer login');
    }
  }

  async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return this.badRequest(res, 'Refresh token é obrigatório');
      }

      const tokenService = this.container.resolve<any>(ServiceTokens.TOKEN_SERVICE);
      const newToken = await tokenService.refreshToken(refreshToken);

      return this.ok(res, { token: newToken });
    } catch (error) {
      console.error('Refresh token error:', error);
      return this.unauthorized(res, 'Refresh token inválido');
    }
  }

  async logout(req: Request, res: Response): Promise<Response> {
    // In a stateless JWT system, logout is handled client-side
    // But we can implement token blacklisting if needed
    return this.ok(res, { message: 'Logout realizado com sucesso' });
  }

  async me(req: Request, res: Response): Promise<Response> {
    try {
      const userIdString = this.extractUserId(req);
      const userId = UserId.create(userIdString);
      const userRepository = this.container.resolve<any>(ServiceTokens.USER_REPOSITORY);
      
      const user = await userRepository.findById(userId.getValue());
      
      if (!user) {
        return this.notFound(res, 'Usuário não encontrado');
      }

      const UserMapper = require('../../application/mappers/UserMapper').UserMapper;
      const userDto = UserMapper.toResponseDto(user);

      return this.ok(res, userDto);
    } catch (error) {
      console.error('Me error:', error);
      return this.internalServerError(res, 'Erro ao buscar dados do usuário');
    }
  }

  async validateInviteToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token, email } = req.query;

      if (!token || !email) {
        return this.badRequest(res, 'Token e email são obrigatórios');
      }

      const setupPasswordUseCase = this.container.resolve<any>(ServiceTokens.SETUP_PASSWORD_USE_CASE);
      const result = await setupPasswordUseCase.validateToken(token as string, email as string);

      if (!result.valid) {
        return this.badRequest(res, 'Token de convite inválido ou expirado');
      }

      return this.ok(res, result);
    } catch (error) {
      console.error('Validate invite token error:', error);
      return this.internalServerError(res, 'Erro ao validar token de convite');
    }
  }

  async setupPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, email, password, confirmPassword } = req.body;

      if (!token || !email || !password) {
        return this.badRequest(res, 'Token, email e senha são obrigatórios');
      }

      if (password !== confirmPassword) {
        return this.badRequest(res, 'A confirmação da senha não confere');
      }

      const setupPasswordUseCase = this.container.resolve<any>(ServiceTokens.SETUP_PASSWORD_USE_CASE);
      const result = await setupPasswordUseCase.execute({
        token,
        email,
        password
      });

      return this.ok(res, result);
    } catch (error) {
      console.error('Setup password error:', error);
      const message = error instanceof Error ? error.message : 'Erro ao definir senha';
      return this.badRequest(res, message);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return this.badRequest(res, 'Email é obrigatório');
      }

      const useCase = this.container.resolve<ForgotPasswordUseCase>(ServiceTokens.FORGOT_PASSWORD_USE_CASE);
      
      const result = await useCase.execute({ email });

      return this.ok(res, result);
    } catch (error) {
      console.error('Forgot password error:', error);
      const message = error instanceof Error ? error.message : 'Erro ao enviar email de redefinição';
      return this.badRequest(res, message);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, email, newPassword } = req.body;

      if (!token || !email || !newPassword) {
        return this.badRequest(res, 'Token, email e nova senha são obrigatórios');
      }

      const useCase = this.container.resolve<ResetPasswordUseCase>(ServiceTokens.RESET_PASSWORD_USE_CASE);
      
      const result = await useCase.execute({
        token,
        email,
        newPassword
      });

      return this.ok(res, result);
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      return this.badRequest(res, message);
    }
  }

  async validateResetToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token, email } = req.query;

      console.log('🔍 Validando token de reset:', { token, email });

      if (!token || !email) {
        return this.badRequest(res, 'Token e email são obrigatórios');
      }

      // Simular validação - na prática usaria um use case específico
      const passwordResetTokenRepo = this.container.resolve<any>(ServiceTokens.PASSWORD_RESET_TOKEN_REPOSITORY);
      const resetToken = await passwordResetTokenRepo.findByToken(token as string);

      console.log('🔍 Token encontrado no banco:', resetToken);

      if (!resetToken) {
        console.log('❌ Token não encontrado no banco');
        return this.ok(res, { valid: false, message: 'Token não encontrado' });
      }

      if (resetToken.email !== email) {
        console.log('❌ Email não confere:', { tokenEmail: resetToken.email, queryEmail: email });
        return this.ok(res, { valid: false, message: 'Email não confere com o token' });
      }

      console.log('✅ Token válido!');
      return this.ok(res, { valid: true, message: 'Token válido' });
    } catch (error) {
      console.error('Validate reset token error:', error);
      return this.ok(res, { valid: false, message: 'Token inválido' });
    }
  }
}
