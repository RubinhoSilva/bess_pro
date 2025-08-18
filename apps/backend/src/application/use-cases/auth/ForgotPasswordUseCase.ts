import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordResetTokenRepository } from '../../../domain/repositories/IPasswordResetTokenRepository';
import { Email } from '../../../domain/value-objects/Email';
import { ForgotPasswordCommand } from '../../dtos/input/auth/ForgotPasswordCommand';
import { DefaultEmailInvitationService } from '../../../domain/services/EmailInvitationService';
import { randomUUID } from 'crypto';

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private emailService: DefaultEmailInvitationService
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<{ success: boolean; message: string }> {
    const { email } = command;

    // Validar email
    const emailVO = Email.create(email);

    // Verificar se usuário existe
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      // Por segurança, não informar que o email não existe
      return {
        success: true,
        message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir a senha.'
      };
    }

    // Verificar se já existe um token válido para este usuário
    const existingToken = await this.passwordResetTokenRepository.findByEmailAndNotUsed(emailVO);
    if (existingToken && existingToken.expiresAt > new Date()) {
      // Token ainda é válido, reenviar o mesmo token
      await this.sendResetEmail(user, existingToken.token);
      return {
        success: true,
        message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir a senha.'
      };
    }

    // Gerar novo token
    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    console.log('💾 Salvando token de reset:', { 
      email: user.getEmail().getValue(),
      userId: user.getId(),
      token: resetToken,
      expiresAt 
    });

    // Salvar token
    const savedToken = await this.passwordResetTokenRepository.save({
      email: user.getEmail().getValue(),
      userId: user.getId(),
      token: resetToken,
      expiresAt,
      used: false,
      createdAt: new Date()
    });

    console.log('✅ Token salvo:', savedToken);

    // Enviar email
    await this.sendResetEmail(user, resetToken);

    return {
      success: true,
      message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir a senha.'
    };
  }

  private generateResetToken(): string {
    return randomUUID().replace(/-/g, '');
  }

  private async sendResetEmail(user: any, token: string): Promise<void> {
    await this.emailService.sendPasswordResetEmail(user, token);
  }
}