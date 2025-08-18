import { Result } from '../../common/Result';
import { AdvancedProposalTemplate, IAdvancedProposalTemplate, TemplateVariable, TemplateStyle, PageSection } from '../../../domain/entities/AdvancedProposalTemplate';
import { IAdvancedProposalTemplateRepository } from '../../../domain/repositories/IAdvancedProposalTemplateRepository';

export interface UpdateAdvancedTemplateRequest {
  templateId: string;
  name?: string;
  description?: string;
  category?: 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM';
  sections?: PageSection[];
  variables?: TemplateVariable[];
  style?: Partial<TemplateStyle>;
  isDefault?: boolean;
  isActive?: boolean;
  pdfSettings?: Partial<IAdvancedProposalTemplate['pdfSettings']>;
  features?: Partial<IAdvancedProposalTemplate['features']>;
  userId: string;
  teamId: string;
}

export class UpdateAdvancedTemplateUseCase {
  constructor(
    private templateRepository: IAdvancedProposalTemplateRepository
  ) {}

  async execute(request: UpdateAdvancedTemplateRequest): Promise<Result<AdvancedProposalTemplate>> {
    try {
      // Find existing template
      const existingTemplate = await this.templateRepository.findById(request.templateId);
      if (!existingTemplate) {
        return Result.failure('Template não encontrado');
      }

      // Check if user has permission to update this template
      if (existingTemplate.teamId !== request.teamId) {
        return Result.failure('Você não tem permissão para editar este template');
      }

      // If changing name, check for duplicates
      if (request.name && request.name !== existingTemplate.name) {
        const duplicateTemplate = await this.templateRepository.findByName(request.name, request.teamId);
        if (duplicateTemplate && duplicateTemplate.id !== request.templateId) {
          return Result.failure('Já existe um template com este nome para sua equipe');
        }
      }

      // Update template properties
      if (request.name !== undefined) {
        existingTemplate.name = request.name;
      }

      if (request.description !== undefined) {
        existingTemplate.description = request.description;
      }

      if (request.category !== undefined) {
        existingTemplate.category = request.category;
      }

      if (request.isActive !== undefined) {
        existingTemplate.isActive = request.isActive;
      }

      // Update sections and variables if provided
      if (request.sections !== undefined && request.variables !== undefined) {
        existingTemplate.updateContent(request.sections, request.variables);
      }

      // Update style if provided
      if (request.style !== undefined) {
        existingTemplate.updateStyle(request.style);
      }

      // Update PDF settings if provided
      if (request.pdfSettings !== undefined) {
        existingTemplate.pdfSettings = { ...existingTemplate.pdfSettings, ...request.pdfSettings };
      }

      // Update features if provided
      if (request.features !== undefined) {
        existingTemplate.features = { ...existingTemplate.features, ...request.features };
      }

      // Handle default template setting
      if (request.isDefault !== undefined) {
        if (request.isDefault && !existingTemplate.isDefault) {
          // Set as default and unset others in the same category
          await this.templateRepository.setAsDefault(request.templateId, existingTemplate.category);
        } else if (!request.isDefault && existingTemplate.isDefault) {
          // Unset as default
          await this.templateRepository.unsetAsDefault(request.templateId);
        }
        existingTemplate.isDefault = request.isDefault;
      }

      // Validate the updated template
      const validationErrors = existingTemplate.validateTemplate();
      if (validationErrors.length > 0) {
        return Result.failure(`Template inválido após atualização: ${validationErrors.join(', ')}`);
      }

      // Save the updated template
      const updatedTemplate = await this.templateRepository.update(existingTemplate);

      return Result.success(updatedTemplate);

    } catch (error: any) {
      return Result.failure(`Erro ao atualizar template: ${error.message}`);
    }
  }
}