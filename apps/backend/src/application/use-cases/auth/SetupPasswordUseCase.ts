import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHashService } from '../../services/IPasswordHashService';
import { InvitationTokenModel } from '../../../infrastructure/database/mongodb/schemas/InvitationTokenSchema';
import { Email } from '../../../domain/value-objects/Email';
import { UserId } from '../../../domain/value-objects/UserId';

export interface SetupPasswordCommand {
  token: string;
  email: string;
  password: string;
}

export class SetupPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordHashService: IPasswordHashService
  ) {}

  async execute(command: SetupPasswordCommand): Promise<{ success: boolean; message: string }> {
    const { token, email, password } = command;

    // Validar se token existe e não foi usado
    const invitationToken = await InvitationTokenModel.findOne({
      token,
      email: email.toLowerCase(),
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitationToken) {
      throw new Error('Token de convite inválido ou expirado');
    }

    // Buscar usuário
    const userEmail = Email.create(email);
    const user = await this.userRepository.findByEmail(userEmail);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se usuário já tem senha definida
    const existingUserWithPassword = await this.userRepository.findByEmailWithPassword(userEmail);
    if (existingUserWithPassword?.passwordHash) {
      throw new Error('Usuário já possui senha definida');
    }

    // Validar senha
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    // Hash da senha
    const passwordHash = await this.passwordHashService.hash(password);

    // Ativar usuário e atualizar senha
    user.activate();
    await this.userRepository.update(user);
    await this.userRepository.updatePassword(UserId.create(user.getId()), passwordHash);

    // Marcar token como usado
    await InvitationTokenModel.updateOne(
      { _id: invitationToken._id },
      { used: true, updatedAt: new Date() }
    );

    return {
      success: true,
      message: 'Senha definida com sucesso! Você já pode fazer login.'
    };
  }

  async validateToken(token: string, email: string): Promise<{ valid: boolean; teamName?: string; userName?: string }> {
    const invitationToken = await InvitationTokenModel.findOne({
      token,
      email: email.toLowerCase(),
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitationToken) {
      return { valid: false };
    }

    // Buscar usuário e team para mostrar informações
    const userEmail = Email.create(email);
    const user = await this.userRepository.findByEmail(userEmail);
    
    // TODO: Buscar team name do TeamRepository
    // Por agora vou retornar informações básicas
    
    return {
      valid: true,
      userName: user?.getName().getValue(),
      teamName: 'Team' // TODO: Implementar busca do nome do team
    };
  }
}