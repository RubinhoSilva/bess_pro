export interface GetProjectListQuery {
  userId: string;
  projectType?: 'pv' | 'bess';
  hasLocation?: boolean;
  hasLead?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}
