export interface ProjectSummaryDto {
  id: string;
  projectName: string;
  projectType: 'pv' | 'bess' | 'hybrid';
  address: string;
  savedAt: string;
  hasLocation: boolean;
  hasLead: boolean;
}