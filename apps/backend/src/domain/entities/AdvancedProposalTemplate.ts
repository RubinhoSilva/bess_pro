export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean' | 'image' | 'table';
  defaultValue?: any;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  description?: string;
}

export interface TemplateStyle {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: {
    title: number;
    heading: number;
    body: number;
    small: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  logo?: {
    url: string;
    position: 'left' | 'center' | 'right';
    size: 'small' | 'medium' | 'large';
  };
  watermark?: {
    enabled: boolean;
    text: string;
    opacity: number;
  };
}

export interface PageSection {
  id: string;
  type: 'cover' | 'introduction' | 'technical' | 'financial' | 'legal' | 'custom';
  title: string;
  content: string;
  order: number;
  isRequired: boolean;
  showInPreview: boolean;
  variables: string[]; // Array of variable keys used in this section
  style?: Partial<TemplateStyle>;
  layout?: {
    columns: number;
    spacing: number;
    alignment: 'left' | 'center' | 'right' | 'justify';
  };
}

export interface IAdvancedProposalTemplate {
  readonly id: string;
  name: string;
  description: string;
  category: 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM';
  isDefault: boolean;
  isActive: boolean;
  version: string;
  
  // Template structure
  sections: PageSection[];
  variables: TemplateVariable[];
  style: TemplateStyle;
  
  // Metadata
  createdBy: string;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Usage statistics
  usageCount: number;
  lastUsed?: Date;
  
  // PDF generation settings
  pdfSettings: {
    pageSize: 'A4' | 'Letter' | 'A3';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    headerFooter: {
      showHeader: boolean;
      showFooter: boolean;
      showPageNumbers: boolean;
    };
  };
  
  // Advanced features
  features: {
    dynamicCharts: boolean;
    calculatedFields: boolean;
    conditionalSections: boolean;
    multilanguage: boolean;
  };
}

export class AdvancedProposalTemplate {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public category: 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM',
    public sections: PageSection[],
    public variables: TemplateVariable[],
    public style: TemplateStyle,
    public createdBy: string,
    public teamId: string,
    public isDefault: boolean = false,
    public isActive: boolean = true,
    public version: string = '1.0.0',
    public pdfSettings: IAdvancedProposalTemplate['pdfSettings'] = {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      headerFooter: { showHeader: true, showFooter: true, showPageNumbers: true }
    },
    public features: IAdvancedProposalTemplate['features'] = {
      dynamicCharts: true,
      calculatedFields: true,
      conditionalSections: true,
      multilanguage: false
    },
    public usageCount: number = 0,
    public lastUsed?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  // Business logic methods
  public updateContent(sections: PageSection[], variables: TemplateVariable[]): void {
    this.sections = sections;
    this.variables = variables;
    this.updatedAt = new Date();
  }

  public updateStyle(style: Partial<TemplateStyle>): void {
    this.style = { ...this.style, ...style };
    this.updatedAt = new Date();
  }

  public incrementUsage(): void {
    this.usageCount++;
    this.lastUsed = new Date();
    this.updatedAt = new Date();
  }

  public addSection(section: PageSection): void {
    const maxOrder = Math.max(...this.sections.map(s => s.order), 0);
    section.order = maxOrder + 1;
    this.sections.push(section);
    this.updatedAt = new Date();
  }

  public removeSection(sectionId: string): void {
    const sectionIndex = this.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex !== -1 && !this.sections[sectionIndex].isRequired) {
      this.sections.splice(sectionIndex, 1);
      this.reorderSections();
      this.updatedAt = new Date();
    }
  }

  public reorderSections(): void {
    this.sections.sort((a, b) => a.order - b.order);
    this.sections.forEach((section, index) => {
      section.order = index + 1;
    });
    this.updatedAt = new Date();
  }

  public addVariable(variable: TemplateVariable): void {
    if (!this.variables.find(v => v.key === variable.key)) {
      this.variables.push(variable);
      this.updatedAt = new Date();
    }
  }

  public removeVariable(variableKey: string): void {
    const variableIndex = this.variables.findIndex(v => v.key === variableKey);
    if (variableIndex !== -1) {
      // Check if variable is used in any section
      const isUsed = this.sections.some(section => 
        section.variables.includes(variableKey) || 
        section.content.includes(`{{${variableKey}}}`)
      );
      
      if (!isUsed) {
        this.variables.splice(variableIndex, 1);
        this.updatedAt = new Date();
      }
    }
  }

  public validateTemplate(): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!this.name.trim()) errors.push('Nome do template é obrigatório');
    if (!this.description.trim()) errors.push('Descrição do template é obrigatória');
    if (this.sections.length === 0) errors.push('Template deve ter pelo menos uma seção');

    // Check for required sections
    const requiredSections = this.sections.filter(s => s.isRequired);
    if (requiredSections.length === 0) {
      errors.push('Template deve ter pelo menos uma seção obrigatória');
    }

    // Validate variables
    this.variables.forEach(variable => {
      if (!variable.key.trim()) errors.push('Chave da variável não pode estar vazia');
      if (!variable.label.trim()) errors.push(`Label da variável '${variable.key}' não pode estar vazia`);
      
      // Check for duplicate variable keys
      const duplicates = this.variables.filter(v => v.key === variable.key);
      if (duplicates.length > 1) {
        errors.push(`Variável '${variable.key}' está duplicada`);
      }
    });

    // Check for orphaned variables in content
    this.sections.forEach(section => {
      const contentVariables = this.extractVariablesFromContent(section.content);
      contentVariables.forEach(varKey => {
        if (!this.variables.find(v => v.key === varKey)) {
          errors.push(`Variável '${varKey}' usada na seção '${section.title}' não está definida`);
        }
      });
    });

    return errors;
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

  public clone(newName: string, newId: string): AdvancedProposalTemplate {
    return new AdvancedProposalTemplate(
      newId,
      newName,
      `Cópia de ${this.description}`,
      this.category,
      JSON.parse(JSON.stringify(this.sections)), // Deep clone
      JSON.parse(JSON.stringify(this.variables)), // Deep clone
      JSON.parse(JSON.stringify(this.style)), // Deep clone
      this.createdBy,
      this.teamId,
      false, // Cloned templates are not default
      true,
      '1.0.0',
      JSON.parse(JSON.stringify(this.pdfSettings)), // Deep clone
      JSON.parse(JSON.stringify(this.features)), // Deep clone
      0, // Reset usage count
      undefined, // Reset last used
      new Date(),
      new Date()
    );
  }
}