import { UserId } from "@/domain/value-objects/UserId";

export interface LeadQuery {
  userId: UserId;
  searchTerm?: string;
  company?: string;
  hasProject?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  orderBy?: 'name' | 'date' | 'company';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}