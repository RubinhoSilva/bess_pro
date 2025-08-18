import { TeamInvite, CreateTeamInviteRequest } from '../entities/TeamInvite';

export interface ITeamInviteRepository {
  create(teamId: string, invitedBy: string, data: CreateTeamInviteRequest, token: string, expiresAt: Date): Promise<TeamInvite>;
  findById(id: string): Promise<TeamInvite | null>;
  findByToken(token: string): Promise<TeamInvite | null>;
  findByTeamId(teamId: string): Promise<TeamInvite[]>;
  findPendingByEmail(email: string): Promise<TeamInvite[]>;
  update(id: string, data: Partial<TeamInvite>): Promise<TeamInvite | null>;
  delete(id: string): Promise<boolean>;
  expireOldInvites(): Promise<number>;
}