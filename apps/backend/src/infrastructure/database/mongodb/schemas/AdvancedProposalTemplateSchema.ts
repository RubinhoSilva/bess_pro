import { Schema, model, Document } from 'mongoose';
import { AdvancedProposalTemplate, TemplateVariable, TemplateStyle, PageSection } from '../../../../domain/entities/AdvancedProposalTemplate';

export interface AdvancedProposalTemplateDocument extends Document, Omit<AdvancedProposalTemplate, 'id'> {
  _id: string;
}

const TemplateVariableSchema = new Schema<TemplateVariable>({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['text', 'number', 'date', 'currency', 'percentage', 'boolean', 'image', 'table']
  },
  defaultValue: { type: Schema.Types.Mixed },
  required: { type: Boolean, required: true },
  validation: {
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
    options: [{ type: String }]
  },
  description: { type: String }
}, { _id: false });

const TemplateStyleSchema = new Schema<TemplateStyle>({
  primaryColor: { type: String, required: true, default: '#2563eb' },
  secondaryColor: { type: String, required: true, default: '#64748b' },
  accentColor: { type: String, required: true, default: '#059669' },
  fontFamily: { type: String, required: true, default: 'Inter' },
  fontSize: {
    title: { type: Number, required: true, default: 24 },
    heading: { type: Number, required: true, default: 18 },
    body: { type: Number, required: true, default: 14 },
    small: { type: Number, required: true, default: 12 }
  },
  margins: {
    top: { type: Number, required: true, default: 20 },
    right: { type: Number, required: true, default: 20 },
    bottom: { type: Number, required: true, default: 20 },
    left: { type: Number, required: true, default: 20 }
  },
  logo: {
    url: { type: String },
    position: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }
  },
  watermark: {
    enabled: { type: Boolean, default: false },
    text: { type: String, default: '' },
    opacity: { type: Number, default: 0.1 }
  }
}, { _id: false });

const PageSectionSchema = new Schema<PageSection>({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['cover', 'introduction', 'technical', 'financial', 'legal', 'custom']
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true },
  isRequired: { type: Boolean, required: true, default: false },
  showInPreview: { type: Boolean, required: true, default: true },
  variables: [{ type: String }],
  style: { type: TemplateStyleSchema },
  layout: {
    columns: { type: Number, default: 1 },
    spacing: { type: Number, default: 16 },
    alignment: { type: String, enum: ['left', 'center', 'right', 'justify'], default: 'left' }
  }
}, { _id: false });

const AdvancedProposalTemplateSchema = new Schema<AdvancedProposalTemplateDocument>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['PV', 'BESS', 'HYBRID', 'CUSTOM']
  },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  version: { type: String, default: '1.0.0' },
  
  // Template structure
  sections: [PageSectionSchema],
  variables: [TemplateVariableSchema],
  style: { type: TemplateStyleSchema, required: true },
  
  // Metadata
  createdBy: { type: String, required: true },
  teamId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Usage statistics
  usageCount: { type: Number, default: 0 },
  lastUsed: { type: Date },
  
  // PDF generation settings
  pdfSettings: {
    pageSize: { type: String, enum: ['A4', 'Letter', 'A3'], default: 'A4' },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    margins: {
      top: { type: Number, default: 20 },
      right: { type: Number, default: 20 },
      bottom: { type: Number, default: 20 },
      left: { type: Number, default: 20 }
    },
    headerFooter: {
      showHeader: { type: Boolean, default: true },
      showFooter: { type: Boolean, default: true },
      showPageNumbers: { type: Boolean, default: true }
    }
  },
  
  // Advanced features
  features: {
    dynamicCharts: { type: Boolean, default: true },
    calculatedFields: { type: Boolean, default: true },
    conditionalSections: { type: Boolean, default: true },
    multilanguage: { type: Boolean, default: false }
  }
});

// Indexes for better performance
AdvancedProposalTemplateSchema.index({ teamId: 1, isActive: 1 });
AdvancedProposalTemplateSchema.index({ category: 1, isDefault: 1 });
AdvancedProposalTemplateSchema.index({ createdBy: 1 });
AdvancedProposalTemplateSchema.index({ usageCount: -1 });
AdvancedProposalTemplateSchema.index({ lastUsed: -1 });
AdvancedProposalTemplateSchema.index({ name: 1, teamId: 1 }, { unique: true });

// Text search index
AdvancedProposalTemplateSchema.index({
  name: 'text',
  description: 'text',
  category: 'text'
});

// Virtual for id
AdvancedProposalTemplateSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtual fields are serialised
AdvancedProposalTemplateSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware
AdvancedProposalTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-update middleware
AdvancedProposalTemplateSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export const AdvancedProposalTemplateModel = model<AdvancedProposalTemplateDocument>('AdvancedProposalTemplate', AdvancedProposalTemplateSchema);