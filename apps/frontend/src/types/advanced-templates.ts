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
  variables: string[];
  style?: Partial<TemplateStyle>;
  layout?: {
    columns: number;
    spacing: number;
    alignment: 'left' | 'center' | 'right' | 'justify';
  };
}

export interface AdvancedProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM';
  isDefault: boolean;
  isActive: boolean;
  version: string;
  
  sections: PageSection[];
  variables: TemplateVariable[];
  style: TemplateStyle;
  
  createdBy: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  
  usageCount: number;
  lastUsed?: string;
  
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
  
  features: {
    dynamicCharts: boolean;
    calculatedFields: boolean;
    conditionalSections: boolean;
    multilanguage: boolean;
  };
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM';
  sections: Omit<PageSection, 'id'>[];
  variables: TemplateVariable[];
  style?: Partial<TemplateStyle>;
  isDefault?: boolean;
  pdfSettings?: Partial<AdvancedProposalTemplate['pdfSettings']>;
  features?: Partial<AdvancedProposalTemplate['features']>;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: 'PV' | 'BESS' | 'HYBRID' | 'CUSTOM';
  sections?: PageSection[];
  variables?: TemplateVariable[];
  style?: Partial<TemplateStyle>;
  isDefault?: boolean;
  isActive?: boolean;
  pdfSettings?: Partial<AdvancedProposalTemplate['pdfSettings']>;
  features?: Partial<AdvancedProposalTemplate['features']>;
}

export interface GenerateProposalRequest {
  variables: Array<{
    key: string;
    value: any;
  }>;
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
}

export interface TemplatesListResponse {
  templates: AdvancedProposalTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    categories: string[];
    creators: string[];
  };
}

export interface GeneratedProposal {
  template: {
    id: string;
    name: string;
    category: string;
  };
  metadata: {
    generatedAt: string;
    generatedBy: string;
    templateVersion: string;
    variablesUsed: number;
    outputFormat: 'html' | 'pdf';
  };
  content: {
    html: string;
  };
}

export interface DragItem {
  id: string;
  type: 'section' | 'variable';
  data: PageSection | TemplateVariable;
}

export interface DropResult {
  dropEffect: string;
  targetId?: string;
  targetIndex?: number;
}