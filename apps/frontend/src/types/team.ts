export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  ownerName?: string;
  ownerRole?: string;
  isActive: boolean;
  planType: string;
  maxUsers: number;
  currentUsers?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  planType?: string;
  maxUsers?: number;
}

export interface TeamFilters {
  isActive?: boolean;
  ownerId?: string;
  planType?: string;
}