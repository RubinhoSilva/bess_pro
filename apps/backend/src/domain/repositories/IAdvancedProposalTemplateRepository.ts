import { AdvancedProposalTemplate } from '../entities/AdvancedProposalTemplate';

export interface IAdvancedProposalTemplateRepository {
  // Basic CRUD operations
  create(template: AdvancedProposalTemplate): Promise<AdvancedProposalTemplate>;
  findById(id: string): Promise<AdvancedProposalTemplate | null>;
  findByName(name: string, teamId: string): Promise<AdvancedProposalTemplate | null>;
  update(template: AdvancedProposalTemplate): Promise<AdvancedProposalTemplate>;
  delete(id: string): Promise<void>;

  // Query operations
  findByTeamId(teamId: string): Promise<AdvancedProposalTemplate[]>;
  findByCategory(category: string, teamId: string): Promise<AdvancedProposalTemplate[]>;
  findActiveTemplates(teamId: string): Promise<AdvancedProposalTemplate[]>;
  findDefaultTemplates(): Promise<AdvancedProposalTemplate[]>;

  // Search and filtering
  search(query: string, teamId: string): Promise<AdvancedProposalTemplate[]>;
  findWithPagination(
    teamId: string,
    page: number,
    limit: number,
    filters?: {
      category?: string;
      isActive?: boolean;
      isDefault?: boolean;
      createdBy?: string;
    }
  ): Promise<{
    templates: AdvancedProposalTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  // Statistics and analytics
  getMostUsedTemplates(teamId: string, limit?: number): Promise<AdvancedProposalTemplate[]>;
  getRecentlyUsedTemplates(teamId: string, limit?: number): Promise<AdvancedProposalTemplate[]>;
  getTemplateUsageStats(templateId: string): Promise<{
    totalUsage: number;
    lastUsed: Date | null;
    averageUsagePerMonth: number;
    peakUsageMonth: { month: string; count: number } | null;
  }>;

  // Template management
  setAsDefault(templateId: string, category: string): Promise<void>;
  unsetAsDefault(templateId: string): Promise<void>;
  activateTemplate(templateId: string): Promise<void>;
  deactivateTemplate(templateId: string): Promise<void>;
  incrementUsageCount(templateId: string): Promise<void>;

  // Bulk operations
  bulkUpdate(templates: AdvancedProposalTemplate[]): Promise<AdvancedProposalTemplate[]>;
  bulkDelete(templateIds: string[]): Promise<void>;
  bulkActivate(templateIds: string[]): Promise<void>;
  bulkDeactivate(templateIds: string[]): Promise<void>;

  // Version management
  createVersion(templateId: string, newVersion: string): Promise<AdvancedProposalTemplate>;
  findVersionHistory(templateId: string): Promise<AdvancedProposalTemplate[]>;
  revertToVersion(templateId: string, version: string): Promise<AdvancedProposalTemplate>;

  // Template sharing and collaboration
  shareWithTeam(templateId: string, targetTeamId: string): Promise<AdvancedProposalTemplate>;
  findSharedTemplates(teamId: string): Promise<AdvancedProposalTemplate[]>;
  getTemplateCollaborators(templateId: string): Promise<string[]>;

  // Data validation and cleanup
  validateTemplateData(template: AdvancedProposalTemplate): Promise<string[]>;
  cleanupOrphanedVariables(templateId: string): Promise<void>;
  fixBrokenReferences(templateId: string): Promise<AdvancedProposalTemplate>;
}