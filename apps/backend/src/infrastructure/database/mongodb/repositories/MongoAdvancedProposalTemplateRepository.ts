import { Model } from 'mongoose';
import { AdvancedProposalTemplate } from '../../../../domain/entities/AdvancedProposalTemplate';
import { IAdvancedProposalTemplateRepository } from '../../../../domain/repositories/IAdvancedProposalTemplateRepository';
import { AdvancedProposalTemplateDocument } from '../schemas/AdvancedProposalTemplateSchema';

export class MongoAdvancedProposalTemplateRepository implements IAdvancedProposalTemplateRepository {
  constructor(private model: Model<AdvancedProposalTemplateDocument>) {}

  async create(template: AdvancedProposalTemplate): Promise<AdvancedProposalTemplate> {
    const document = new this.model(template);
    const saved = await document.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<AdvancedProposalTemplate | null> {
    const document = await this.model.findById(id);
    return document ? this.toDomain(document) : null;
  }

  async findByName(name: string, teamId: string): Promise<AdvancedProposalTemplate | null> {
    const document = await this.model.findOne({ name, teamId });
    return document ? this.toDomain(document) : null;
  }

  async update(template: AdvancedProposalTemplate): Promise<AdvancedProposalTemplate> {
    const updated = await this.model.findByIdAndUpdate(
      template.id,
      { ...template, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updated) {
      throw new Error('Template não encontrado');
    }
    
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Template não encontrado');
    }
  }

  async findByTeamId(teamId: string): Promise<AdvancedProposalTemplate[]> {
    const documents = await this.model.find({ teamId }).sort({ updatedAt: -1 });
    return documents.map(doc => this.toDomain(doc));
  }

  async findByCategory(category: string, teamId: string): Promise<AdvancedProposalTemplate[]> {
    const documents = await this.model.find({ category, teamId, isActive: true }).sort({ name: 1 });
    return documents.map(doc => this.toDomain(doc));
  }

  async findActiveTemplates(teamId: string): Promise<AdvancedProposalTemplate[]> {
    const documents = await this.model.find({ teamId, isActive: true }).sort({ name: 1 });
    return documents.map(doc => this.toDomain(doc));
  }

  async findDefaultTemplates(): Promise<AdvancedProposalTemplate[]> {
    const documents = await this.model.find({ isDefault: true, isActive: true }).sort({ category: 1, name: 1 });
    return documents.map(doc => this.toDomain(doc));
  }

  async search(query: string, teamId: string): Promise<AdvancedProposalTemplate[]> {
    const documents = await this.model.find({
      teamId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }).sort({ name: 1 });
    
    return documents.map(doc => this.toDomain(doc));
  }

  async findWithPagination(
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
  }> {
    const query: any = { teamId };
    
    if (filters) {
      if (filters.category) query.category = filters.category;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.isDefault !== undefined) query.isDefault = filters.isDefault;
      if (filters.createdBy) query.createdBy = filters.createdBy;
    }

    const total = await this.model.countDocuments(query);
    const skip = (page - 1) * limit;
    
    const documents = await this.model
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      templates: documents.map(doc => this.toDomain(doc)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getMostUsedTemplates(teamId: string, limit: number = 10): Promise<AdvancedProposalTemplate[]> {
    const documents = await this.model
      .find({ teamId, isActive: true })
      .sort({ usageCount: -1 })
      .limit(limit);
    
    return documents.map(doc => this.toDomain(doc));
  }

  async getRecentlyUsedTemplates(teamId: string, limit: number = 10): Promise<AdvancedProposalTemplate[]> {
    const documents = await this.model
      .find({ teamId, isActive: true, lastUsed: { $exists: true } })
      .sort({ lastUsed: -1 })
      .limit(limit);
    
    return documents.map(doc => this.toDomain(doc));
  }

  async getTemplateUsageStats(templateId: string): Promise<{
    totalUsage: number;
    lastUsed: Date | null;
    averageUsagePerMonth: number;
    peakUsageMonth: { month: string; count: number } | null;
  }> {
    const template = await this.model.findById(templateId);
    
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // For now, return basic stats. In a real implementation, you'd track usage events
    const monthsSinceCreation = Math.max(1, 
      Math.floor((Date.now() - template.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );

    return {
      totalUsage: template.usageCount,
      lastUsed: template.lastUsed || null,
      averageUsagePerMonth: template.usageCount / monthsSinceCreation,
      peakUsageMonth: null // Would need separate usage tracking collection
    };
  }

  async setAsDefault(templateId: string, category: string): Promise<void> {
    // First, unset any existing default for this category
    await this.model.updateMany(
      { category, isDefault: true },
      { isDefault: false }
    );

    // Then set the new default
    await this.model.findByIdAndUpdate(templateId, { isDefault: true });
  }

  async unsetAsDefault(templateId: string): Promise<void> {
    await this.model.findByIdAndUpdate(templateId, { isDefault: false });
  }

  async activateTemplate(templateId: string): Promise<void> {
    await this.model.findByIdAndUpdate(templateId, { isActive: true, updatedAt: new Date() });
  }

  async deactivateTemplate(templateId: string): Promise<void> {
    await this.model.findByIdAndUpdate(templateId, { isActive: false, updatedAt: new Date() });
  }

  async incrementUsageCount(templateId: string): Promise<void> {
    await this.model.findByIdAndUpdate(templateId, {
      $inc: { usageCount: 1 },
      lastUsed: new Date(),
      updatedAt: new Date()
    });
  }

  async bulkUpdate(templates: AdvancedProposalTemplate[]): Promise<AdvancedProposalTemplate[]> {
    const operations = templates.map(template => ({
      updateOne: {
        filter: { _id: template.id },
        update: { ...template, updatedAt: new Date() }
      }
    }));

    await this.model.bulkWrite(operations);
    
    // Return updated templates
    const templateIds = templates.map(t => t.id);
    const updated = await this.model.find({ _id: { $in: templateIds } });
    return updated.map(doc => this.toDomain(doc));
  }

  async bulkDelete(templateIds: string[]): Promise<void> {
    await this.model.deleteMany({ _id: { $in: templateIds } });
  }

  async bulkActivate(templateIds: string[]): Promise<void> {
    await this.model.updateMany(
      { _id: { $in: templateIds } },
      { isActive: true, updatedAt: new Date() }
    );
  }

  async bulkDeactivate(templateIds: string[]): Promise<void> {
    await this.model.updateMany(
      { _id: { $in: templateIds } },
      { isActive: false, updatedAt: new Date() }
    );
  }

  async createVersion(templateId: string, newVersion: string): Promise<AdvancedProposalTemplate> {
    const original = await this.model.findById(templateId);
    if (!original) {
      throw new Error('Template não encontrado');
    }

    // Create a new template with the new version
    const versionedTemplate = {
      ...original.toObject(),
      _id: undefined,
      version: newVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      lastUsed: undefined
    };

    const document = new this.model(versionedTemplate);
    const saved = await document.save();
    return this.toDomain(saved);
  }

  async findVersionHistory(templateId: string): Promise<AdvancedProposalTemplate[]> {
    const original = await this.model.findById(templateId);
    if (!original) {
      throw new Error('Template não encontrado');
    }

    // Find all templates with the same name and teamId (representing versions)
    const documents = await this.model
      .find({ name: original.name, teamId: original.teamId })
      .sort({ version: -1 });
    
    return documents.map(doc => this.toDomain(doc));
  }

  async revertToVersion(templateId: string, version: string): Promise<AdvancedProposalTemplate> {
    const current = await this.model.findById(templateId);
    if (!current) {
      throw new Error('Template atual não encontrado');
    }

    const targetVersion = await this.model.findOne({
      name: current.name,
      teamId: current.teamId,
      version
    });

    if (!targetVersion) {
      throw new Error('Versão não encontrada');
    }

    // Update current template with target version data
    const updated = await this.model.findByIdAndUpdate(
      templateId,
      {
        sections: targetVersion.sections,
        variables: targetVersion.variables,
        style: targetVersion.style,
        pdfSettings: targetVersion.pdfSettings,
        features: targetVersion.features,
        updatedAt: new Date()
      },
      { new: true }
    );

    return this.toDomain(updated!);
  }

  async shareWithTeam(templateId: string, targetTeamId: string): Promise<AdvancedProposalTemplate> {
    const original = await this.model.findById(templateId);
    if (!original) {
      throw new Error('Template não encontrado');
    }

    // Create a copy for the target team
    const sharedTemplate = {
      ...original.toObject(),
      _id: undefined,
      teamId: targetTeamId,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      lastUsed: undefined,
      isDefault: false // Shared templates are not default
    };

    const document = new this.model(sharedTemplate);
    const saved = await document.save();
    return this.toDomain(saved);
  }

  async findSharedTemplates(teamId: string): Promise<AdvancedProposalTemplate[]> {
    // This is a simplified implementation
    // In a real scenario, you'd have a separate sharing mechanism
    const documents = await this.model.find({
      teamId: { $ne: teamId },
      isDefault: true // For now, only default templates are considered "shared"
    });
    
    return documents.map(doc => this.toDomain(doc));
  }

  async getTemplateCollaborators(templateId: string): Promise<string[]> {
    // This would require a separate collaboration tracking system
    // For now, return the creator
    const template = await this.model.findById(templateId);
    return template ? [template.createdBy] : [];
  }

  async validateTemplateData(template: AdvancedProposalTemplate): Promise<string[]> {
    const domainTemplate = this.toDomain(template as any);
    return domainTemplate.validateTemplate();
  }

  async cleanupOrphanedVariables(templateId: string): Promise<void> {
    const template = await this.model.findById(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    const domainTemplate = this.toDomain(template);
    
    // Remove variables that are not used in any section
    const usedVariables = new Set<string>();
    
    domainTemplate.sections.forEach(section => {
      section.variables.forEach(varKey => usedVariables.add(varKey));
      
      // Also check content for variable usage
      const contentVariables = this.extractVariablesFromContent(section.content);
      contentVariables.forEach(varKey => usedVariables.add(varKey));
    });

    const cleanedVariables = domainTemplate.variables.filter(variable => 
      usedVariables.has(variable.key)
    );

    await this.model.findByIdAndUpdate(templateId, {
      variables: cleanedVariables,
      updatedAt: new Date()
    });
  }

  async fixBrokenReferences(templateId: string): Promise<AdvancedProposalTemplate> {
    const template = await this.model.findById(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    const domainTemplate = this.toDomain(template);
    const availableVariables = new Set(domainTemplate.variables.map(v => v.key));
    
    // Fix sections by removing references to non-existent variables
    const fixedSections = domainTemplate.sections.map(section => ({
      ...section,
      variables: section.variables.filter(varKey => availableVariables.has(varKey))
    }));

    const updated = await this.model.findByIdAndUpdate(
      templateId,
      {
        sections: fixedSections,
        updatedAt: new Date()
      },
      { new: true }
    );

    return this.toDomain(updated!);
  }

  private toDomain(document: AdvancedProposalTemplateDocument): AdvancedProposalTemplate {
    return new AdvancedProposalTemplate(
      document._id.toString(),
      document.name,
      document.description,
      document.category,
      document.sections,
      document.variables,
      document.style,
      document.createdBy,
      document.teamId,
      document.isDefault,
      document.isActive,
      document.version,
      document.pdfSettings,
      document.features,
      document.usageCount,
      document.lastUsed,
      document.createdAt,
      document.updatedAt
    );
  }

  private extractVariablesFromContent(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      variables.push(match[1].trim());
    }
    
    return variables;
  }
}