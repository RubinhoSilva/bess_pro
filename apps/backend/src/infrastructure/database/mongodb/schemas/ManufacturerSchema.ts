import { Schema, model, Document } from 'mongoose';
import { ManufacturerType } from '../../../../domain/entities/Manufacturer';

export interface IManufacturerDocument extends Document {
  name: string;
  type: ManufacturerType;
  teamId?: string;
  isDefault: boolean;
  description?: string;
  website?: string;
  country?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ManufacturerSchema = new Schema<IManufacturerDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(ManufacturerType),
    index: true
  },
  teamId: {
    type: String,
    index: true,
    default: null
  },
  isDefault: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    index: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  supportEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  supportPhone: {
    type: String,
    trim: true
  },
  certifications: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  collection: 'manufacturers'
});

// Indexes compostos para garantir unicidade por escopo
ManufacturerSchema.index({ name: 1, teamId: 1 }, { 
  unique: true,
  partialFilterExpression: { teamId: { $ne: null } }
});

// Fabricantes padrão devem ter nomes únicos globalmente
ManufacturerSchema.index({ name: 1, isDefault: 1 }, { 
  unique: true,
  partialFilterExpression: { isDefault: true }
});

// Index para busca por tipo e time
ManufacturerSchema.index({ type: 1, teamId: 1 });
ManufacturerSchema.index({ type: 1, isDefault: 1 });

// Index de texto para busca
ManufacturerSchema.index({ 
  name: 'text', 
  description: 'text',
  country: 'text'
}, {
  weights: {
    name: 3,
    description: 1,
    country: 1
  }
});

export const ManufacturerModel = model<IManufacturerDocument>('Manufacturer', ManufacturerSchema);