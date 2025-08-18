export interface ProjectResponseDto {
  id: string;
  projectName: string;
  projectType: 'pv' | 'bess' | 'hybrid';
  userId: string;
  address: string;
  leadId?: string;
  savedAt: string;
  hasLocation: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  projectData: Record<string, any>;
  priority: number;
}

export interface ProjectSummaryDto {
  id: string;
  projectName: string;
  projectType: 'pv' | 'bess' | 'hybrid';
  address: string;
  savedAt: string;
  hasLocation: boolean;
  hasLead: boolean;
}