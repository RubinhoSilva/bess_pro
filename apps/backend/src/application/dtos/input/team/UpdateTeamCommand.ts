export interface UpdateTeamCommand {
  name?: string;
  description?: string;
  isActive?: boolean;
  planType?: string;
  maxUsers?: number;
  companyProfileId?: string;
}