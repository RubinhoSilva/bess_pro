import { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { Email } from '../../../domain/value-objects/Email';
import { EmailInvitationService } from '../../../domain/services/EmailInvitationService';
import { InvitationTokenModel } from '../../../infrastructure/database/mongodb/schemas/InvitationTokenSchema';

export interface InviteUserToTeamCommand {
  teamId: string;
  inviterUserId: string;
  inviteeEmail: string;
  inviteeRole: string;
  inviteeName?: string;
}

export interface InviteUserToTeamResponse {
  success: boolean;
  message: string;
  invitationId?: string;
}

export class InviteUserToTeamUseCase {
  constructor(
    private teamRepository: ITeamRepository,
    private userRepository: IUserRepository,
    private emailInvitationService: EmailInvitationService
  ) {}

  async execute(command: InviteUserToTeamCommand): Promise<InviteUserToTeamResponse> {
    const { teamId, inviterUserId, inviteeEmail, inviteeRole, inviteeName } = command;

    // Verificar se o team existe
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team não encontrado');
    }

    // Verificar se o usuário que está convidando existe e tem permissão
    const inviterUserId_ = UserId.create(inviterUserId);
    const inviter = await this.userRepository.findById(inviterUserId_.getValue());
    if (!inviter) {
      throw new Error('Usuário convidador não encontrado');
    }

    // Verificar permissões do inviter
    if (!inviter.getRole().canManageUsers()) {
      throw new Error('Você não tem permissão para convidar usuários');
    }

    // Verificar se o inviter pertence ao team (exceto super_admin)
    if (!inviter.getRole().isSuperAdmin() && inviter.getTeamId() !== teamId) {
      throw new Error('Você não pertence a este team');
    }

    // Verificar se já existe usuário com este email
    const inviteeEmail_ = Email.create(inviteeEmail);
    const existingUser = await this.userRepository.findByEmail(inviteeEmail_);
    
    if (existingUser) {
      // Se o usuário já existe, verificar se já pertence a um team
      if (existingUser.getTeamId()) {
        throw new Error('Usuário já pertence a um team');
      }
    }

    // Verificar se já existe convite pendente para este email neste team
    const existingInvitation = await InvitationTokenModel.findOne({
      email: inviteeEmail.toLowerCase(),
      teamId,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      throw new Error('Já existe um convite pendente para este usuário neste team');
    }

    // Criar usuário temporário se não existir
    let invitee = existingUser;
    if (!existingUser) {
      const userName = inviteeName || inviteeEmail.split('@')[0];
      invitee = User.create({
        email: inviteeEmail,
        name: userName,
        company: team.getName().getValue(),
        role: inviteeRole,
        teamId: teamId
      });
      invitee = await this.userRepository.save(invitee);
    } else {
      // Atualizar role e team do usuário existente
      existingUser.changeRole(inviteeRole);
      existingUser.changeTeam(teamId);
      await this.userRepository.update(existingUser);
    }

    // Gerar token de convite
    const invitationToken = this.emailInvitationService.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 horas para expirar

    // Salvar token de convite
    const invitationDoc = await InvitationTokenModel.create({
      token: invitationToken,
      email: inviteeEmail.toLowerCase(),
      userId: invitee!.getId(),
      teamId,
      inviterId: inviterUserId,
      role: inviteeRole,
      expiresAt,
      used: false
    });

    // Enviar email de convite
    try {
      await this.emailInvitationService.sendTeamInviteEmail(
        invitee!,
        team,
        inviter,
        invitationToken
      );
    } catch (error) {
      console.error('Erro ao enviar email de convite:', error);
      // Não falhar o convite se o email falhar
    }

    return {
      success: true,
      message: `Convite enviado com sucesso para ${inviteeEmail}`,
      invitationId: (invitationDoc._id as any).toString()
    };
  }
}