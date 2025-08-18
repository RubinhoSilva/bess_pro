import { Result } from '../../common/Result';
import { AdvancedProposalTemplate } from '../../../domain/entities/AdvancedProposalTemplate';
import { IAdvancedProposalTemplateRepository } from '../../../domain/repositories/IAdvancedProposalTemplateRepository';

export interface ProposalVariableValue {
  key: string;
  value: any;
}

export interface GenerateProposalRequest {
  templateId: string;
  variables: ProposalVariableValue[];
  projectData?: {
    projectId: string;
    clientName: string;
    clientEmail?: string;
    projectName: string;
    location: {
      address: string;
      city: string;
      state: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    systemData: {
      type: 'PV' | 'BESS' | 'HYBRID';
      modules?: {
        count: number;
        power: number;
        brand: string;
        model: string;
      };
      inverters?: {
        count: number;
        power: number;
        brand: string;
        model: string;
      };
      batteries?: {
        capacity: number;
        brand: string;
        model: string;
      };
    };
    calculations?: {
      totalPower: number;
      monthlyGeneration: number;
      annualGeneration: number;
      savings: {
        monthly: number;
        annual: number;
        paybackYears: number;
      };
    };
  };
  outputFormat: 'html' | 'pdf';
  userId: string;
  teamId: string;
}

export interface GeneratedProposal {
  template: AdvancedProposalTemplate;
  processedSections: ProcessedSection[];
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    templateVersion: string;
    variablesUsed: number;
    outputFormat: 'html' | 'pdf';
  };
  content: {
    html: string;
    pdf?: Buffer;
  };
}

export interface ProcessedSection {
  id: string;
  type: string;
  title: string;
  processedContent: string;
  order: number;
  pageBreak?: boolean;
  styles?: any;
}

export class GenerateProposalFromTemplateUseCase {
  constructor(
    private templateRepository: IAdvancedProposalTemplateRepository
  ) {}

  async execute(request: GenerateProposalRequest): Promise<Result<GeneratedProposal>> {
    try {
      // Get the template
      const template = await this.templateRepository.findById(request.templateId);
      if (!template) {
        return Result.failure('Template não encontrado');
      }

      // Check permissions
      if (template.teamId !== request.teamId && !template.isDefault) {
        return Result.failure('Você não tem permissão para usar este template');
      }

      // Validate required variables
      const validationResult = this.validateVariables(template, request.variables);
      if (!validationResult.isValid) {
        return Result.failure(`Variáveis obrigatórias não fornecidas: ${validationResult.missingVariables.join(', ')}`);
      }

      // Process sections
      const processedSections = await this.processSections(template, request.variables, request.projectData);

      // Generate HTML content
      const htmlContent = this.generateHTML(template, processedSections);

      // Generate PDF if requested
      let pdfBuffer: Buffer | undefined;
      if (request.outputFormat === 'pdf') {
        pdfBuffer = await this.generatePDF(htmlContent, template);
      }

      // Increment template usage
      await this.templateRepository.incrementUsageCount(request.templateId);

      const result: GeneratedProposal = {
        template,
        processedSections,
        metadata: {
          generatedAt: new Date(),
          generatedBy: request.userId,
          templateVersion: template.version,
          variablesUsed: request.variables.length,
          outputFormat: request.outputFormat
        },
        content: {
          html: htmlContent,
          pdf: pdfBuffer
        }
      };

      return Result.success(result);

    } catch (error: any) {
      return Result.failure(`Erro ao gerar proposta: ${error.message}`);
    }
  }

  private validateVariables(
    template: AdvancedProposalTemplate, 
    providedVariables: ProposalVariableValue[]
  ): { isValid: boolean; missingVariables: string[] } {
    const providedKeys = new Set(providedVariables.map(v => v.key));
    const requiredVariables = template.variables.filter(v => v.required);
    const missingVariables = requiredVariables
      .filter(v => !providedKeys.has(v.key))
      .map(v => v.key);

    return {
      isValid: missingVariables.length === 0,
      missingVariables
    };
  }

  private async processSections(
    template: AdvancedProposalTemplate,
    variables: ProposalVariableValue[],
    projectData?: GenerateProposalRequest['projectData']
  ): Promise<ProcessedSection[]> {
    const variableMap = new Map(variables.map(v => [v.key, v.value]));
    
    // Add system variables
    if (projectData) {
      this.addSystemVariables(variableMap, projectData);
    }

    return template.sections.map(section => {
      let processedContent = section.content;

      // Replace variables in content
      template.variables.forEach(variable => {
        const value = variableMap.get(variable.key) || variable.defaultValue || '';
        const formattedValue = this.formatVariableValue(value, variable.type);
        const regex = new RegExp(`\\{\\{\\s*${variable.key}\\s*\\}\\}`, 'g');
        processedContent = processedContent.replace(regex, formattedValue);
      });

      // Process conditional sections (basic implementation)
      processedContent = this.processConditionalSections(processedContent, variableMap);

      // Process calculated fields (basic implementation)
      processedContent = this.processCalculatedFields(processedContent, variableMap);

      return {
        id: section.id,
        type: section.type,
        title: section.title,
        processedContent,
        order: section.order,
        pageBreak: section.type === 'cover' || section.type === 'technical' || section.type === 'financial',
        styles: section.style
      };
    }).sort((a, b) => a.order - b.order);
  }

  private addSystemVariables(variableMap: Map<string, any>, projectData: GenerateProposalRequest['projectData']): void {
    if (!projectData) return;

    // Add standard system variables
    variableMap.set('client_name', projectData.clientName);
    variableMap.set('client_email', projectData.clientEmail || '');
    variableMap.set('project_name', projectData.projectName);
    variableMap.set('project_location', projectData.location.address);
    variableMap.set('project_city', projectData.location.city);
    variableMap.set('project_state', projectData.location.state);
    variableMap.set('system_type', projectData.systemData.type);
    variableMap.set('generation_date', new Date().toLocaleDateString('pt-BR'));

    // Add system-specific variables
    if (projectData.systemData.modules) {
      variableMap.set('modules_count', projectData.systemData.modules.count);
      variableMap.set('modules_power', projectData.systemData.modules.power);
      variableMap.set('modules_brand', projectData.systemData.modules.brand);
      variableMap.set('modules_model', projectData.systemData.modules.model);
    }

    if (projectData.systemData.inverters) {
      variableMap.set('inverters_count', projectData.systemData.inverters.count);
      variableMap.set('inverters_power', projectData.systemData.inverters.power);
      variableMap.set('inverters_brand', projectData.systemData.inverters.brand);
      variableMap.set('inverters_model', projectData.systemData.inverters.model);
    }

    if (projectData.calculations) {
      variableMap.set('total_power', projectData.calculations.totalPower);
      variableMap.set('monthly_generation', projectData.calculations.monthlyGeneration);
      variableMap.set('annual_generation', projectData.calculations.annualGeneration);
      variableMap.set('monthly_savings', projectData.calculations.savings.monthly);
      variableMap.set('annual_savings', projectData.calculations.savings.annual);
      variableMap.set('payback_years', projectData.calculations.savings.paybackYears);
    }
  }

  private formatVariableValue(value: any, type: string): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(value) || 0);
        
      case 'percentage':
        return `${(Number(value) || 0).toFixed(1)}%`;
        
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
        
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('pt-BR');
        } else if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
        }
        return String(value || '');
        
      case 'boolean':
        return value ? 'Sim' : 'Não';
        
      default:
        return String(value || '');
    }
  }

  private processConditionalSections(content: string, variableMap: Map<string, any>): string {
    // Basic conditional processing: {{#if variable}} content {{/if}}
    const ifRegex = /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs;
    
    return content.replace(ifRegex, (match, variableName, conditionalContent) => {
      const value = variableMap.get(variableName);
      return value ? conditionalContent : '';
    });
  }

  private processCalculatedFields(content: string, variableMap: Map<string, any>): string {
    // Basic calculated fields: {{calc:expression}}
    const calcRegex = /\{\{calc:(.*?)\}\}/g;
    
    return content.replace(calcRegex, (match, expression) => {
      try {
        // Simple calculation - in production, use a proper expression evaluator
        const sanitizedExpression = expression.replace(/\w+/g, (varName: string) => {
          const value = variableMap.get(varName) || 0;
          return String(Number(value));
        });
        
        // Basic arithmetic only
        if (!/^[\d+\-*/().\s]+$/.test(sanitizedExpression)) {
          return match; // Return original if unsafe
        }
        
        const result = Function(`"use strict"; return (${sanitizedExpression})`)();
        return String(result);
      } catch (error) {
        return match; // Return original if calculation fails
      }
    });
  }

  private generateHTML(template: AdvancedProposalTemplate, sections: ProcessedSection[]): string {
    const style = template.style;
    
    const css = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=${style.fontFamily}:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: '${style.fontFamily}', sans-serif;
          font-size: ${style.fontSize.body}px;
          line-height: 1.6;
          color: #333;
          padding: ${style.margins.top}px ${style.margins.right}px ${style.margins.bottom}px ${style.margins.left}px;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        h1 {
          font-size: ${style.fontSize.title}px;
          color: ${style.primaryColor};
          margin-bottom: 1em;
          font-weight: 600;
        }
        
        h2 {
          font-size: ${style.fontSize.heading}px;
          color: ${style.secondaryColor};
          margin-bottom: 0.8em;
          margin-top: 1.5em;
          font-weight: 500;
        }
        
        .section {
          margin-bottom: 2em;
        }
        
        .cover-section {
          text-align: center;
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .logo {
          margin-bottom: 2em;
        }
        
        .accent {
          color: ${style.accentColor};
        }
        
        .primary {
          color: ${style.primaryColor};
        }
        
        .secondary {
          color: ${style.secondaryColor};
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }
        
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: ${style.primaryColor}20;
          font-weight: 500;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72px;
          color: ${style.secondaryColor};
          opacity: ${style.watermark?.opacity || 0.1};
          z-index: -1;
          pointer-events: none;
        }
      </style>
    `;

    const watermark = style.watermark?.enabled ? 
      `<div class="watermark">${style.watermark.text}</div>` : '';

    const logo = style.logo?.url ? 
      `<div class="logo"><img src="${style.logo.url}" alt="Logo" style="max-height: 100px;"></div>` : '';

    const sectionsHtml = sections.map(section => {
      const pageBreakClass = section.pageBreak ? 'page-break' : '';
      const sectionClass = section.type === 'cover' ? 'cover-section' : '';
      
      return `
        <div class="section ${pageBreakClass} ${sectionClass}">
          ${section.type === 'cover' ? logo : ''}
          <h1>${section.title}</h1>
          <div>${section.processedContent}</div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.name}</title>
        ${css}
      </head>
      <body>
        ${watermark}
        ${sectionsHtml}
      </body>
      </html>
    `;
  }

  private async generatePDF(htmlContent: string, template: AdvancedProposalTemplate): Promise<Buffer> {
    // This is a placeholder implementation
    // In a real scenario, you'd use a library like puppeteer, playwright, or wkhtmltopdf
    
    const pdfOptions = {
      format: template.pdfSettings.pageSize,
      orientation: template.pdfSettings.orientation,
      margin: template.pdfSettings.margins,
      displayHeaderFooter: template.pdfSettings.headerFooter.showHeader || template.pdfSettings.headerFooter.showFooter,
      printBackground: true
    };

    // Simulated PDF generation - replace with actual PDF library
    const fakeBuffer = Buffer.from(`PDF content would be generated here with options: ${JSON.stringify(pdfOptions)}`);
    
    return fakeBuffer;
  }
}