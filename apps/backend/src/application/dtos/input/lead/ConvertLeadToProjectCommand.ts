export interface ConvertLeadToProjectCommand {
  leadId: string;
  userId: string;
  projectName: string;
  projectType: 'pv' | 'bess';
}