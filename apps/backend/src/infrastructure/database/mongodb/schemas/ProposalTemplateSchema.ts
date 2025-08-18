import { Schema, model, Document } from 'mongoose';
import { ProposalTemplate, ProposalSection, TemplateVariable, TemplateStyle, ProposalData } from '../../../../domain/entities/ProposalTemplate';

const SectionConditionSchema = new Schema({
  variable: { type: String, required: true },
  operator: { type: String, enum: ['equals', 'not_equals', 'greater', 'less', 'contains'], required: true },
  value: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const VariableValidationSchema = new Schema({
  type: { type: String, enum: ['required', 'min', 'max', 'pattern'], required: true },
  value: { type: Schema.Types.Mixed },
  message: { type: String, required: true }
}, { _id: false });

const ProposalSectionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['cover', 'introduction', 'technical', 'financial', 'custom'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true },
  isRequired: { type: Boolean, default: false },
  showInPreview: { type: Boolean, default: true },
  conditions: [SectionConditionSchema]
}, { _id: false });

const TemplateVariableSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'currency', 'date', 'boolean', 'image', 'calculated'], required: true },
  defaultValue: { type: Schema.Types.Mixed },
  isRequired: { type: Boolean, default: false },
  category: { type: String, enum: ['client', 'project', 'company', 'calculation'], required: true },
  description: { type: String },
  validations: [{ 
    type: { type: String, enum: ['required', 'min', 'max', 'pattern'], required: true },
    value: { type: Schema.Types.Mixed },
    message: { type: String, required: true }
  }]
}, { _id: false });

const TemplateStyleSchema = new Schema({
  primaryColor: { type: String, default: '#2563eb' },
  secondaryColor: { type: String, default: '#64748b' },
  accentColor: { type: String, default: '#10b981' },
  fontFamily: { type: String, default: 'Inter' },
  fontSize: {
    title: { type: Number, default: 32 },
    heading: { type: Number, default: 24 },
    body: { type: Number, default: 14 },
    small: { type: Number, default: 12 }
  },
  margins: {
    top: { type: Number, default: 20 },
    right: { type: Number, default: 20 },
    bottom: { type: Number, default: 20 },
    left: { type: Number, default: 20 }
  },
  logo: {
    url: { type: String },
    position: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }
  },
  watermark: {
    enabled: { type: Boolean, default: false },
    text: { type: String },
    opacity: { type: Number, default: 0.1 }
  }
}, { _id: false });

const ProposalTemplateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['PV', 'BESS', 'HYBRID', 'GENERAL'], required: true },
  isDefault: { type: Boolean, default: false },
  structure: [ProposalSectionSchema],
  variables: [TemplateVariableSchema],
  styling: { type: TemplateStyleSchema, default: {} },
  createdBy: { type: String, required: true },
  teamId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ProposalDataSchema = new Schema({
  templateId: { type: String, required: true },
  projectId: { type: String, required: true },
  clientId: { type: String, required: true },
  variableValues: { type: Map, of: Schema.Types.Mixed },
  customSections: [ProposalSectionSchema],
  generatedAt: { type: Date, default: Date.now },
  pdfUrl: { type: String }
});

// Indexes for performance
ProposalTemplateSchema.index({ teamId: 1, category: 1 });
ProposalTemplateSchema.index({ createdBy: 1 });
ProposalTemplateSchema.index({ isDefault: 1 });

ProposalDataSchema.index({ projectId: 1 });
ProposalDataSchema.index({ templateId: 1, projectId: 1 }, { unique: true });

export interface ProposalTemplateDocument extends Document {
  name: string;
  description?: string;
  category: 'PV' | 'BESS' | 'HYBRID' | 'GENERAL';
  isDefault: boolean;
  structure: ProposalSection[];
  variables: TemplateVariable[];
  styling: TemplateStyle;
  createdBy: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalDataDocument extends Document {
  templateId: string;
  projectId: string;
  clientId: string;
  variableValues: Record<string, any>;
  customSections?: any[];
  generatedAt: Date;
  pdfUrl?: string;
}

export const ProposalTemplateModel = model<ProposalTemplateDocument>('ProposalTemplate', ProposalTemplateSchema);
export const ProposalDataModel = model<ProposalDataDocument>('ProposalData', ProposalDataSchema);