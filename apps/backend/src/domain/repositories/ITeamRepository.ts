import { Team } from "../entities/Team";

export interface TeamFilters {
  isActive?: boolean;
  ownerId?: string;
  planType?: string;
}

export interface ITeamRepository {
  save(team: Team): Promise<Team>;
  findById(id: string): Promise<Team | null>;
  findByOwnerId(ownerId: string): Promise<Team[]>;
  findByCompanyProfileId(companyProfileId: string): Promise<Team | null>;
  findAll(filters?: TeamFilters): Promise<Team[]>;
  update(id: string, team: Team): Promise<Team>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}