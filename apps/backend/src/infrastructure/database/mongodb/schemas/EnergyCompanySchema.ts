import { Schema, model, Document } from 'mongoose';
import { EnergyCompany } from '../../../../domain/entities/EnergyCompany';

interface EnergyCompanyDocument extends Document, Omit<EnergyCompany, 'id'> {}

const energyCompanySchema = new Schema<EnergyCompanyDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  acronym: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  region: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  states: [{
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 2 // Código do estado (SP, RJ, etc.)
  }],
  tariffB1: {
    type: Number,
    min: 0,
    default: null
  },
  tariffB3: {
    type: Number,
    min: 0,
    default: null
  },
  tariffC: {
    type: Number,
    min: 0,
    default: null
  },
  wireB: {
    type: Number,
    min: 0,
    default: null
  },
  distributionCharge: {
    type: Number,
    min: 0,
    default: null
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true,
  collection: 'energy_companies'
});

// Índices para performance
energyCompanySchema.index({ acronym: 1 });
energyCompanySchema.index({ states: 1 });
energyCompanySchema.index({ isActive: 1 });
energyCompanySchema.index({ name: 'text', acronym: 'text' });

// Transformar o documento para o formato da entidade
energyCompanySchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const EnergyCompanyModel = model<EnergyCompanyDocument>('EnergyCompany', energyCompanySchema);