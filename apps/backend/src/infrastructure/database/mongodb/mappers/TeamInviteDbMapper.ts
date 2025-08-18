import { TeamInvite } from '../../../../domain/entities/TeamInvite';
import { TeamInviteDocument } from '../schemas/TeamInviteSchema';

export class TeamInviteDbMapper {
  static toDomain(document: TeamInviteDocument): TeamInvite {
    return {
      id: document._id,
      teamId: document.teamId,
      email: document.email,
      role: document.role,
      invitedBy: document.invitedBy,
      token: document.token,
      status: document.status,
      expiresAt: document.expiresAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}