export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  invitedBy: string; // userId que fez o convite
  token: string; // token único para aceitar o convite
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamInviteRequest {
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface TeamInviteResponse {
  id: string;
  teamId: string;
  email: string;
  role: string;
  invitedBy: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}