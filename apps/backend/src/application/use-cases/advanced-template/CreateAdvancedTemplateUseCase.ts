import { Result } from '../../common/Result';
import { AdvancedProposalTemplate, IAdvancedProposalTemplate, TemplateVariable, TemplateStyle, PageSection } from '../../../domain/entities/AdvancedProposalTemplate';
import { IAdvancedProposalTemplateRepository } from '../../../domain/repositories/IAdvancedProposalTemplateRepository';
import { v4 as uuidv4 } from 'uuid';

export interface CreateAdvancedTemplateRequest {
  name: string;
  description: string;
  category: 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM';
  sections: Omit<PageSection, 'id'>[];
  variables: TemplateVariable[];
  style?: Partial<TemplateStyle>;
  createdBy: string;
  teamId: string;
  isDefault?: boolean;
  pdfSettings?: Partial<IAdvancedProposalTemplate['pdfSettings']>;
  features?: Partial<IAdvancedProposalTemplate['features']>;
}

export class CreateAdvancedTemplateUseCase {
  constructor(
    private templateRepository: IAdvancedProposalTemplateRepository
  ) {}

  async execute(request: CreateAdvancedTemplateRequest): Promise<Result<AdvancedProposalTemplate>> {
    try {
      // Validate input
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return Result.failure(`Dados inválidos: ${validationErrors.join(', ')}`);
      }

      // Check if template name already exists for this team
      const existingTemplate = await this.templateRepository.findByName(request.name, request.teamId);
      if (existingTemplate) {
        return Result.failure('Já existe um template com este nome para sua equipe');
      }

      // Generate IDs for sections
      const sectionsWithIds: PageSection[] = request.sections.map(section => ({
        ...section,
        id: uuidv4()
      }));

      // Create default style if not provided
      const defaultStyle: TemplateStyle = {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b', 
        accentColor: '#059669',
        fontFamily: 'Inter',
        fontSize: {
          title: 24,
          heading: 18,
          body: 14,
          small: 12
        },
        margins: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        },
        watermark: {
          enabled: false,
          text: '',
          opacity: 0.1
        }
      };

      const style: TemplateStyle = { ...defaultStyle, ...request.style };

      // Create default PDF settings if not provided
      const defaultPdfSettings: AdvancedProposalTemplate['pdfSettings'] = {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        headerFooter: { showHeader: true, showFooter: true, showPageNumbers: true }
      };

      const pdfSettings = { ...defaultPdfSettings, ...request.pdfSettings };

      // Create default features if not provided
      const defaultFeatures: AdvancedProposalTemplate['features'] = {
        dynamicCharts: true,
        calculatedFields: true,
        conditionalSections: true,
        multilanguage: false
      };

      const features = { ...defaultFeatures, ...request.features };

      // If this is set as default, unset other defaults for the same category
      if (request.isDefault) {
        await this.templateRepository.setAsDefault('', request.category); // This will unset all defaults
      }

      // Create the template
      const template = new AdvancedProposalTemplate(
        uuidv4(),
        request.name,
        request.description,
        request.category,
        sectionsWithIds,
        request.variables,
        style,
        request.createdBy,
        request.teamId,
        request.isDefault || false,
        true, // isActive
        '1.0.0', // version
        pdfSettings,
        features
      );

      // Validate the template
      const templateErrors = template.validateTemplate();
      if (templateErrors.length > 0) {
        return Result.failure(`Template inválido: ${templateErrors.join(', ')}`);
      }

      // Save to repository
      const savedTemplate = await this.templateRepository.create(template);

      return Result.success(savedTemplate);

    } catch (error: any) {
      return Result.failure(`Erro ao criar template: ${error.message}`);
    }
  }

  private validateRequest(request: CreateAdvancedTemplateRequest): string[] {
    const errors: string[] = [];

    // Validate basic fields
    if (!request.name?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!request.description?.trim()) {
      errors.push('Descrição é obrigatória');
    }

    if (!request.category) {
      errors.push('Categoria é obrigatória');
    }

    if (!request.createdBy?.trim()) {
      errors.push('Criador é obrigatório');
    }

    if (!request.teamId?.trim()) {
      errors.push('ID da equipe é obrigatório');
    }

    // Validate sections
    if (!request.sections || request.sections.length === 0) {
      errors.push('Template deve ter pelo menos uma seção');
    } else {
      // Check for at least one required section
      const hasRequiredSection = request.sections.some(section => section.isRequired);
      if (!hasRequiredSection) {
        errors.push('Template deve ter pelo menos uma seção obrigatória');
      }

      // Validate each section
      request.sections.forEach((section, index) => {
        if (!section.title?.trim()) {
          errors.push(`Título da seção ${index + 1} é obrigatório`);
        }

        if (!section.content?.trim()) {
          errors.push(`Conteúdo da seção ${index + 1} é obrigatório`);
        }

        if (typeof section.order !== 'number') {
          errors.push(`Ordem da seção ${index + 1} deve ser um número`);
        }
      });
    }

    // Validate variables
    if (request.variables && request.variables.length > 0) {
      const variableKeys = new Set<string>();
      
      request.variables.forEach((variable, index) => {
        if (!variable.key?.trim()) {
          errors.push(`Chave da variável ${index + 1} é obrigatória`);
        } else {
          if (variableKeys.has(variable.key)) {
            errors.push(`Chave da variável '${variable.key}' está duplicada`);
          }
          variableKeys.add(variable.key);
        }

        if (!variable.label?.trim()) {
          errors.push(`Label da variável ${index + 1} é obrigatória`);
        }

        if (!variable.type) {
          errors.push(`Tipo da variável ${index + 1} é obrigatório`);
        }
      });
    }

    return errors;
  }
}