import { Result } from '../../common/Result';
import { IUseCase } from '../../common/IUseCase';
import { GetAdvancedTemplatesUseCase } from './GetAdvancedTemplatesUseCase';
import { CreateAdvancedTemplateUseCase, CreateAdvancedTemplateRequest } from './CreateAdvancedTemplateUseCase';
import { AdvancedProposalTemplate } from '../../../domain/entities/AdvancedProposalTemplate';

export interface CloneTemplateRequest {
  templateId: string;
  userId: string;
  teamId: string;
  newName: string;
}

export interface CloneTemplateResponse {
  clonedTemplate: AdvancedProposalTemplate;
  originalTemplate: AdvancedProposalTemplate;
}

/**
 * Use case for cloning an existing advanced proposal template
 * 
 * This use case handles the business logic for creating a copy of an existing template,
 * including validation, data preparation, and creation of the cloned template.
 */
export class CloneAdvancedTemplateUseCase implements IUseCase<CloneTemplateRequest, Result<CloneTemplateResponse>> {
  constructor(
    private getAdvancedTemplatesUseCase: GetAdvancedTemplatesUseCase,
    private createAdvancedTemplateUseCase: CreateAdvancedTemplateUseCase
  ) {}

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async execute(request: CloneTemplateRequest): Promise<Result<CloneTemplateResponse>> {
    try {
      // 1. Validações de negócio
      const validation = this.validateCloneRequest(request);
      if (!validation.isValid) {
        return Result.failure(validation.errors.join(', '));
      }

      // 2. Buscar template original
      const getResult = await this.getAdvancedTemplatesUseCase.execute({
        teamId: request.teamId,
        page: 1,
        limit: 100 // Increase limit to find the template
      });

      if (!getResult.isSuccess) {
        return Result.failure(`Erro ao buscar templates: ${getResult.error}`);
      }

      const originalTemplate = getResult.value!.templates.find(t => t.id === request.templateId);
      if (!originalTemplate) {
        return Result.failure('Template original não encontrado');
      }

      // 3. Verificar se usuário tem permissão para clonar este template
      if (originalTemplate.teamId !== request.teamId) {
        return Result.failure('Sem permissão para clonar este template');
      }

      // 4. Aplicar regras de negócio (preparar dados para clonagem)
      const cloneData = this.prepareCloneData(originalTemplate, request);

      // 5. Criar template clonado
      const cloneResult = await this.createAdvancedTemplateUseCase.execute(cloneData);
      
      if (!cloneResult.isSuccess) {
        return Result.failure(`Erro ao criar clone: ${cloneResult.error}`);
      }

      // 6. Retornar resultado
      if (!cloneResult.value) {
        return Result.failure('Template clonado não foi criado corretamente');
      }

      return Result.success({
        clonedTemplate: cloneResult.value,
        originalTemplate
      });

    } catch (error: any) {
      return Result.failure(`Erro ao clonar template: ${error.message}`);
    }
  }

  /**
   * Validates the clone request according to business rules
   */
  private validateCloneRequest(request: CloneTemplateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate template ID
    if (!request.templateId || typeof request.templateId !== 'string') {
      errors.push('ID do template é obrigatório');
    }

    // Validate user ID
    if (!request.userId || typeof request.userId !== 'string') {
      errors.push('ID do usuário é obrigatório');
    }

    // Validate team ID
    if (!request.teamId || typeof request.teamId !== 'string') {
      errors.push('ID do time é obrigatório');
    }

    // Validate new name
    if (!request.newName || typeof request.newName !== 'string') {
      errors.push('Nome para o template clonado é obrigatório');
    } else if (request.newName.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    } else if (request.newName.trim().length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Prepares clone data from original template
   */
  private prepareCloneData(original: AdvancedProposalTemplate, request: CloneTemplateRequest): CreateAdvancedTemplateRequest {
    return {
      name: request.newName.trim(),
      description: `Cópia de ${original.name}`,
      category: original.category,
      sections: original.sections.map(section => ({
        id: this.generateId(),
        type: section.type,
        title: section.title,
        content: section.content,
        order: section.order,
        isRequired: section.isRequired,
        showInPreview: section.showInPreview,
        variables: [...section.variables],
        style: section.style,
        layout: section.layout
      })),
      variables: original.variables.map(variable => ({
        key: variable.key,
        label: variable.label,
        type: variable.type,
        defaultValue: variable.defaultValue,
        required: variable.required,
        validation: variable.validation ? {
          min: variable.validation.min,
          max: variable.validation.max,
          pattern: variable.validation.pattern,
          options: variable.validation.options
        } : undefined,
        description: variable.description
      })),
      style: {
        primaryColor: original.style.primaryColor,
        secondaryColor: original.style.secondaryColor,
        accentColor: original.style.accentColor,
        fontFamily: original.style.fontFamily,
        fontSize: {
          title: original.style.fontSize.title,
          heading: original.style.fontSize.heading,
          body: original.style.fontSize.body,
          small: original.style.fontSize.small
        },
        margins: {
          top: original.style.margins.top,
          right: original.style.margins.right,
          bottom: original.style.margins.bottom,
          left: original.style.margins.left
        },
        logo: original.style.logo ? {
          url: original.style.logo.url,
          position: original.style.logo.position,
          size: original.style.logo.size
        } : undefined,
        watermark: original.style.watermark ? {
          enabled: original.style.watermark.enabled,
          text: original.style.watermark.text,
          opacity: original.style.watermark.opacity
        } : undefined
      },
      pdfSettings: {
        pageSize: original.pdfSettings.pageSize,
        orientation: original.pdfSettings.orientation,
        margins: {
          top: original.pdfSettings.margins.top,
          right: original.pdfSettings.margins.right,
          bottom: original.pdfSettings.margins.bottom,
          left: original.pdfSettings.margins.left
        },
        headerFooter: {
          showHeader: original.pdfSettings.headerFooter.showHeader,
          showFooter: original.pdfSettings.headerFooter.showFooter,
          showPageNumbers: original.pdfSettings.headerFooter.showPageNumbers
        }
      },
      features: {
        dynamicCharts: original.features.dynamicCharts,
        calculatedFields: original.features.calculatedFields,
        conditionalSections: original.features.conditionalSections,
        multilanguage: original.features.multilanguage
      },
      isDefault: false, // Cloned templates are never default
      createdBy: request.userId,
      teamId: request.teamId
    };
  }
}