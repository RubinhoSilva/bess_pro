import { UserId } from "@/domain/value-objects/UserId";
import { ProjectSearchFilters } from "../IProjectRepository";

export interface ProjectQuery {
  userId: UserId;
  filters?: ProjectSearchFilters;
  orderBy?: 'name' | 'date' | 'priority' | 'type';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProjectSummaryQuery {
  userId: UserId;
  includeProjectData?: boolean;
  includeLocation?: boolean;
  includeLead?: boolean;
}