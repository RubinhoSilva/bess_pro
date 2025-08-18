import { IProposalTemplateRepository } from '../../../../domain/repositories/IProposalTemplateRepository';
import { ProposalTemplate, ProposalData } from '../../../../domain/entities/ProposalTemplate';
import { ProposalTemplateModel, ProposalDataModel } from '../schemas/ProposalTemplateSchema';

export class MongoProposalTemplateRepository implements IProposalTemplateRepository {
  async create(template: Omit<ProposalTemplate, 'id'>): Promise<ProposalTemplate> {
    console.log('MongoProposalTemplateRepository.create called with template:', { name: template.name, teamId: template.teamId, createdBy: template.createdBy });
    const newTemplate = new ProposalTemplateModel(template);
    const savedTemplate = await newTemplate.save();
    console.log('Template saved with ID:', savedTemplate._id, 'teamId:', savedTemplate.teamId);
    return this.toProposalTemplate(savedTemplate);
  }

  async findById(id: string): Promise<ProposalTemplate | null> {
    const template = await ProposalTemplateModel.findById(id);
    return template ? this.toProposalTemplate(template) : null;
  }

  async findByTeamId(teamId: string): Promise<ProposalTemplate[]> {
    console.log('MongoProposalTemplateRepository.findByTeamId called with teamId:', teamId);
    const templates = await ProposalTemplateModel.find({ teamId }).sort({ createdAt: -1 });
    console.log('Found templates in DB by teamId:', templates.length);
    console.log('Templates found:', templates.map(t => ({ id: t._id, name: t.name, teamId: t.teamId })));
    return templates.map(template => this.toProposalTemplate(template));
  }

  async findByCategory(category: string, teamId?: string): Promise<ProposalTemplate[]> {
    const filter: any = { category };
    if (teamId) {
      filter.$or = [
        { teamId },
        { isDefault: true, teamId: { $exists: false } }
      ];
    } else {
      filter.isDefault = true;
      filter.teamId = { $exists: false };
    }

    const templates = await ProposalTemplateModel.find(filter).sort({ createdAt: -1 });
    return templates.map(template => this.toProposalTemplate(template));
  }

  async findDefaultTemplates(): Promise<ProposalTemplate[]> {
    const templates = await ProposalTemplateModel.find({ 
      isDefault: true, 
      teamId: { $exists: false } 
    }).sort({ category: 1, name: 1 });
    
    return templates.map(template => this.toProposalTemplate(template));
  }

  async update(id: string, updates: Partial<ProposalTemplate>): Promise<ProposalTemplate> {
    const template = await ProposalTemplateModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    return this.toProposalTemplate(template);
  }

  async delete(id: string): Promise<void> {
    await ProposalTemplateModel.findByIdAndDelete(id);
  }

  async cloneTemplate(id: string, newName: string, userId: string): Promise<ProposalTemplate> {
    const originalTemplate = await ProposalTemplateModel.findById(id);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const clonedData = originalTemplate.toObject();
    delete clonedData._id;
    delete clonedData.id;
    
    const newTemplate = new ProposalTemplateModel({
      ...clonedData,
      name: newName,
      createdBy: userId,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedTemplate = await newTemplate.save();
    return this.toProposalTemplate(savedTemplate);
  }

  async setAsDefault(id: string, teamId?: string): Promise<void> {
    const template = await ProposalTemplateModel.findById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Remove default flag from other templates in the same category
    await ProposalTemplateModel.updateMany(
      { 
        category: template.category,
        ...(teamId ? { teamId } : { teamId: { $exists: false } })
      },
      { isDefault: false }
    );

    // Set this template as default
    await ProposalTemplateModel.findByIdAndUpdate(id, { isDefault: true });
  }

  async saveProposalData(data: Omit<ProposalData, 'generatedAt'>): Promise<ProposalData> {
    const existingData = await ProposalDataModel.findOne({
      templateId: data.templateId,
      projectId: data.projectId
    });

    if (existingData) {
      const updated = await ProposalDataModel.findOneAndUpdate(
        { templateId: data.templateId, projectId: data.projectId },
        { ...data, generatedAt: new Date() },
        { new: true, runValidators: true }
      );
      return this.toProposalData(updated!);
    }

    const newData = new ProposalDataModel({ ...data, generatedAt: new Date() });
    const saved = await newData.save();
    return this.toProposalData(saved);
  }

  async findProposalsByProject(projectId: string): Promise<ProposalData[]> {
    const proposals = await ProposalDataModel.find({ projectId }).sort({ generatedAt: -1 });
    return proposals.map(proposal => this.toProposalData(proposal));
  }

  async deleteProposalData(templateId: string, projectId: string): Promise<void> {
    await ProposalDataModel.deleteOne({ templateId, projectId });
  }

  private toProposalTemplate(doc: any): ProposalTemplate {
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      category: doc.category,
      isDefault: doc.isDefault,
      structure: doc.structure,
      variables: doc.variables,
      styling: doc.styling,
      createdBy: doc.createdBy,
      teamId: doc.teamId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  private toProposalData(doc: any): ProposalData {
    return {
      templateId: doc.templateId,
      projectId: doc.projectId,
      clientId: doc.clientId,
      variableValues: doc.variableValues ? Object.fromEntries(doc.variableValues) : {},
      customSections: doc.customSections,
      generatedAt: doc.generatedAt,
      pdfUrl: doc.pdfUrl
    };
  }
}