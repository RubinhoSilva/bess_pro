import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordResetTokenRepository } from '../../../domain/repositories/IPasswordResetTokenRepository';
import { IPasswordHashService } from '../../services/IPasswordHashService';
import { Email } from '../../../domain/value-objects/Email';
import { UserId } from '../../../domain/value-objects/UserId';
import { ResetPasswordCommand } from '../../dtos/input/auth/ResetPasswordCommand';

export class ResetPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private passwordHashService: IPasswordHashService
  ) {}

  async execute(command: ResetPasswordCommand): Promise<{ success: boolean; message: string }> {
    const { token, email, newPassword } = command;

    // Validar dados básicos
    if (!token || !email || !newPassword) {
      throw new Error('Token, email e nova senha são obrigatórios');
    }

    if (newPassword.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres');
    }

    // Validar email
    const emailVO = Email.create(email);

    // Verificar se o token existe e é válido
    const resetToken = await this.passwordResetTokenRepository.findByToken(token);
    if (!resetToken) {
      throw new Error('Token inválido ou expirado');
    }

    // Verificar se o email do token confere com o email fornecido
    if (resetToken.email !== email) {
      throw new Error('Token inválido para este email');
    }

    // Verificar se o usuário existe
    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Hash da nova senha
    const passwordHash = await this.passwordHashService.hash(newPassword);

    // Atualizar senha do usuário
    await this.userRepository.updatePassword(UserId.create(user.getId()), passwordHash);

    // Marcar token como usado
    await this.passwordResetTokenRepository.markAsUsed(token);

    // Remover outros tokens do usuário por segurança
    await this.passwordResetTokenRepository.deleteByUserId(user.getId());

    return {
      success: true,
      message: 'Senha redefinida com sucesso. Você já pode fazer login com a nova senha.'
    };
  }
}