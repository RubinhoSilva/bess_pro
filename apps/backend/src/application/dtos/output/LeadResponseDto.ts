import { LeadStage, LeadSource, ClientType } from '@/domain/entities/Lead';

export interface LeadResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  stage: LeadStage;
  source: LeadSource;
  notes: string;
  colorHighlight: string;
  estimatedValue: number;
  expectedCloseDate: string | null;
  value?: number;
  powerKwp?: number;
  clientType?: ClientType;
  tags?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  hasProject: boolean;
}