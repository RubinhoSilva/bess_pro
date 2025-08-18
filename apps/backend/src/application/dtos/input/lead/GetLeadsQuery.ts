import { LeadStage, LeadSource } from '@/domain/entities/Lead';

export interface GetLeadsQuery {
  userId: string;
  stage?: LeadStage;
  source?: LeadSource;
  searchTerm?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'estimatedValue' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}