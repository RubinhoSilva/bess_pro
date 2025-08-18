import { LeadStage, LeadSource } from '@/domain/entities/Lead';

export interface CreateLeadCommand {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  stage?: LeadStage;
  source?: LeadSource;
  notes?: string;
  colorHighlight?: string;
  estimatedValue?: number;
  expectedCloseDate?: Date;
  userId: string;
}