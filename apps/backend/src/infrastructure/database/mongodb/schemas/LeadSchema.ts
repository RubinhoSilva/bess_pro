import { Types, Schema, model, Document } from "mongoose";

export interface LeadDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  stage: string;
  source: string;
  notes?: string;
  colorHighlight?: string;
  estimatedValue?: number;
  expectedCloseDate?: Date;
  value?: number; // Valor do negócio em R$
  powerKwp?: number; // Potência do sistema em kWp
  clientType?: string; // B2B ou B2C
  tags?: string[]; // Tags customizáveis
  userId: Types.ObjectId;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<LeadDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true,
  },
  phone: { 
    type: String, 
    trim: true,
    maxlength: 20,
  },
  company: { 
    type: String, 
    trim: true,
    maxlength: 100,
  },
  address: { 
    type: String, 
    trim: true,
    maxlength: 200,
  },
  stage: {
    type: String,
    required: true,
    default: 'lead-recebido',
    index: true,
    trim: true,
    maxlength: 50,
  },
  source: {
    type: String,
    required: true,
    enum: [
      'website',
      'referral',
      'social-media',
      'direct-contact',
      'advertising',
      'other'
    ],
    default: 'other',
    index: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  colorHighlight: {
    type: String,
    trim: true,
    maxlength: 7, // For hex colors like #FF0000
  },
  estimatedValue: {
    type: Number,
    min: 0,
    index: true,
  },
  expectedCloseDate: {
    type: Date,
    index: true,
  },
  value: {
    type: Number,
    min: 0,
    index: true,
  },
  powerKwp: {
    type: Number,
    min: 0,
    index: true,
  },
  clientType: {
    type: String,
    enum: ['B2B', 'B2C'],
    default: 'B2C',
    index: true,
  },
  tags: {
    type: [String],
    default: [],
    index: true,
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'leads',
});

// Indexes
leadSchema.index({ userId: 1, email: 1 }, { unique: true });
leadSchema.index({ userId: 1, name: 1 });
leadSchema.index({ userId: 1, company: 1 });
leadSchema.index({ userId: 1, createdAt: -1 });
leadSchema.index({ userId: 1, stage: 1 });
leadSchema.index({ userId: 1, source: 1 });
leadSchema.index({ userId: 1, estimatedValue: -1 });
leadSchema.index({ userId: 1, expectedCloseDate: 1 });
leadSchema.index({ userId: 1, updatedAt: -1 });
leadSchema.index({ userId: 1, value: -1 });
leadSchema.index({ userId: 1, powerKwp: -1 });
leadSchema.index({ userId: 1, clientType: 1 });
leadSchema.index({ userId: 1, tags: 1 });
leadSchema.index({ userId: 1, isDeleted: 1 });
leadSchema.index({ userId: 1, deletedAt: 1 });

export const LeadModel = model<LeadDocument>('Lead', leadSchema);