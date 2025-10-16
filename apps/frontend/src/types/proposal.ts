export interface ProposalTemplate {
  id?: string;
  name: string;
  description?: string;
  category: 'PV' | 'HYBRID' | 'GENERAL';
  isDefault: boolean;
  structure: ProposalSection[];
  variables: TemplateVariable[];
  styling: TemplateStyle;
  createdBy: string;
  teamId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProposalSection {
  id: string;
  type: 'cover' | 'introduction' | 'technical' | 'financial' | 'custom';
  title: string;
  content: string; // Rich text HTML content
  order: number;
  isRequired: boolean;
  showInPreview: boolean;
  conditions?: SectionCondition[];
}

export interface TemplateVariable {
  id: string;
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'image' | 'calculated';
  defaultValue?: any;
  isRequired: boolean;
  category: 'client' | 'project' | 'company' | 'calculation';
  description?: string;
  validations?: VariableValidation[];
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
    text?: string;
    opacity: number;
  };
}

export interface SectionCondition {
  variable: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
  value: any;
}

export interface VariableValidation {
  type: 'required' | 'min' | 'max' | 'pattern';
  value?: any;
  message: string;
}

export interface ProposalData {
  templateId: string;
  projectId: string;
  clientId: string;
  variableValues: Record<string, any>;
  customSections?: ProposalSection[];
  generatedAt?: Date;
  pdfUrl?: string;
}

export interface GenerateProposalRequest {
  templateId: string;
  projectId: string;
  variableValues: Record<string, any>;
  customSections?: ProposalSection[];
}

export interface TemplateEditorState {
  template: ProposalTemplate;
  selectedSectionId?: string;
  selectedVariableId?: string;
  previewMode: boolean;
  previewData: Record<string, any>;
}

// Utility types for form handling
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: 'PV' | 'HYBRID' | 'GENERAL';
  structure: ProposalSection[];
  variables: TemplateVariable[];
  styling: TemplateStyle;
}

export interface UpdateTemplateRequest {
  id: string;
  name?: string;
  description?: string;
  structure?: ProposalSection[];
  variables?: TemplateVariable[];
  styling?: TemplateStyle;
  isDefault?: boolean;
}

export interface TemplateListFilter {
  category?: string;
  includeDefaults?: boolean;
}