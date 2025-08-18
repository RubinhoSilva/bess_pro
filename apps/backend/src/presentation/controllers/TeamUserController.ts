import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { InviteUserToTeamUseCase } from '../../application/use-cases/team/InviteUserToTeamUseCase';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class TeamUserController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  async inviteUser(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = req.params;
      const { email, role, name } = req.body;
      const inviterUserId = this.extractUserId(req);

      if (!email || !role) {
        return this.badRequest(res, 'Email e role são obrigatórios');
      }

      const validRoles = ['admin', 'vendedor', 'viewer'];
      if (!validRoles.includes(role)) {
        return this.badRequest(res, 'Role inválida. Use: admin, vendedor ou viewer');
      }

      const useCase = this.container.resolve<InviteUserToTeamUseCase>(ServiceTokens.INVITE_USER_TO_TEAM_USE_CASE);
      
      const result = await useCase.execute({
        teamId,
        inviterUserId,
        inviteeEmail: email,
        inviteeRole: role,
        inviteeName: name
      });

      return this.created(res, result);
    } catch (error) {
      console.error('Invite user error:', error);
      const message = error instanceof Error ? error.message : 'Erro ao convidar usuário';
      return this.badRequest(res, message);
    }
  }

  async getTeamUsers(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = req.params;
      const currentUserId = this.extractUserId(req);

      const userRepository = this.container.resolve<any>(ServiceTokens.USER_REPOSITORY);
      const teamRepository = this.container.resolve<any>(ServiceTokens.TEAM_REPOSITORY);

      // Verificar se o usuário pertence ao team (exceto super_admin)
      const currentUser = await userRepository.findById(currentUserId);
      if (!currentUser) {
        return this.unauthorized(res, 'Usuário não encontrado');
      }
      
      if (!currentUser.getRole().isSuperAdmin() && currentUser.getTeamId() !== teamId) {
        return this.forbidden(res, 'Você não tem acesso a este team');
      }

      // Verificar se o team existe
      const team = await teamRepository.findById(teamId);
      if (!team) {
        return this.notFound(res, 'Team não encontrado');
      }

      // Buscar usuários do team (incluindo histórico de removidos)
      const users = await userRepository.findByTeamIdWithHistory(teamId);
      
      // Mapear para response DTO
      const UserMapper = require('../../application/mappers/UserMapper').UserMapper;
      const usersDto = users.map((user: any) => UserMapper.toResponseDto(user));

      return this.ok(res, usersDto);
    } catch (error) {
      console.error('Get team users error:', error);
      return this.internalServerError(res, 'Erro ao buscar usuários do team');
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId, userId } = req.params;
      const { role } = req.body;
      const currentUserId = this.extractUserId(req);

      if (!role) {
        return this.badRequest(res, 'Role é obrigatória');
      }

      const validRoles = ['admin', 'vendedor', 'viewer'];
      if (!validRoles.includes(role)) {
        return this.badRequest(res, 'Role inválida. Use: admin, vendedor ou viewer');
      }

      const userRepository = this.container.resolve<any>(ServiceTokens.USER_REPOSITORY);
      
      // Verificar se o usuário que está alterando tem permissão
      const currentUser = await userRepository.findById(currentUserId);
      if (!currentUser || !currentUser.getRole().canManageUsers()) {
        return this.forbidden(res, 'Você não tem permissão para alterar roles');
      }

      if (!currentUser.getRole().isSuperAdmin() && currentUser.getTeamId() !== teamId) {
        return this.forbidden(res, 'Você não pertence a este team');
      }

      // Buscar usuário a ser alterado
      const targetUser = await userRepository.findById(userId);
      if (!targetUser) {
        return this.notFound(res, 'Usuário não encontrado');
      }

      if (targetUser.getTeamId() !== teamId) {
        return this.badRequest(res, 'Usuário não pertence a este team');
      }

      // Não permitir alterar role do owner do team
      if (targetUser.getRole().getValue() === 'team_owner') {
        return this.badRequest(res, 'Não é possível alterar a role do owner do team');
      }

      // Atualizar role
      targetUser.changeRole(role);
      await userRepository.update(targetUser);

      const UserMapper = require('../../application/mappers/UserMapper').UserMapper;
      const userDto = UserMapper.toResponseDto(targetUser);

      return this.ok(res, userDto);
    } catch (error) {
      console.error('Update user role error:', error);
      const message = error instanceof Error ? error.message : 'Erro ao alterar role do usuário';
      return this.badRequest(res, message);
    }
  }

  async removeUserFromTeam(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId, userId } = req.params;
      const currentUserId = this.extractUserId(req);

      const userRepository = this.container.resolve<any>(ServiceTokens.USER_REPOSITORY);
      
      // Verificar se o usuário que está removendo tem permissão
      const currentUser = await userRepository.findById(currentUserId);
      if (!currentUser || !currentUser.getRole().canManageUsers()) {
        return this.forbidden(res, 'Você não tem permissão para remover usuários');
      }

      if (!currentUser.getRole().isSuperAdmin() && currentUser.getTeamId() !== teamId) {
        return this.forbidden(res, 'Você não pertence a este team');
      }

      // Buscar usuário a ser removido
      const targetUser = await userRepository.findById(userId);
      if (!targetUser) {
        return this.notFound(res, 'Usuário não encontrado');
      }

      if (targetUser.getTeamId() !== teamId) {
        return this.badRequest(res, 'Usuário não pertence a este team');
      }

      // Não permitir remover o owner do team
      if (targetUser.getRole().getValue() === 'team_owner') {
        return this.badRequest(res, 'Não é possível remover o owner do team');
      }

      // Não permitir que o usuário remova a si mesmo
      if (targetUser.getId() === currentUserId) {
        return this.badRequest(res, 'Você não pode remover a si mesmo do team');
      }

      // Remover usuário do team
      targetUser.removeFromTeam();
      await userRepository.update(targetUser);

      return this.ok(res, { message: 'Usuário removido do team com sucesso. O usuário ainda aparecerá na listagem com status "Removido"' });
    } catch (error) {
      console.error('Remove user from team error:', error);
      const message = error instanceof Error ? error.message : 'Erro ao remover usuário do team';
      return this.badRequest(res, message);
    }
  }
}