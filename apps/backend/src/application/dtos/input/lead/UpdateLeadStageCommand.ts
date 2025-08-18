import { LeadStage } from '@/domain/entities/Lead';

export interface UpdateLeadStageCommand {
  leadId: string;
  userId: string;
  stage: LeadStage;
}