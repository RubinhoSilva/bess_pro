export interface CreateTeamCommand {
  name: string;
  description?: string;
  ownerEmail: string;
  planType?: string;
  maxUsers?: number;
}