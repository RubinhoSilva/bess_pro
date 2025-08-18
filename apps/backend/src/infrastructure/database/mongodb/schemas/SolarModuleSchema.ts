import { Schema, model, Document } from 'mongoose';

export interface ISolarModuleDocument extends Document {
  userId: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number;
  larguraMm?: number;
  alturaMm?: number;
  espessuraMm?: number;
  vmpp?: number;
  impp?: number;
  voc?: number;
  isc?: number;
  tipoCelula?: string;
  eficiencia?: number;
  numeroCelulas?: number;
  tempCoefPmax?: number;
  tempCoefVoc?: number;
  tempCoefIsc?: number;
  pesoKg?: number;
  datasheetUrl?: string;
  certificacoes?: string[];
  garantiaAnos?: number;
  tolerancia?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SolarModuleSchema = new Schema<ISolarModuleDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  fabricante: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  modelo: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  potenciaNominal: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  larguraMm: {
    type: Number,
    min: 0
  },
  alturaMm: {
    type: Number,
    min: 0
  },
  espessuraMm: {
    type: Number,
    min: 0
  },
  vmpp: {
    type: Number,
    min: 0
  },
  impp: {
    type: Number,
    min: 0
  },
  voc: {
    type: Number,
    min: 0
  },
  isc: {
    type: Number,
    min: 0
  },
  tipoCelula: {
    type: String,
    trim: true
  },
  eficiencia: {
    type: Number,
    min: 0,
    max: 100
  },
  numeroCelulas: {
    type: Number,
    min: 0
  },
  tempCoefPmax: {
    type: Number
  },
  tempCoefVoc: {
    type: Number
  },
  tempCoefIsc: {
    type: Number
  },
  pesoKg: {
    type: Number,
    min: 0
  },
  datasheetUrl: {
    type: String,
    trim: true
  },
  certificacoes: [{
    type: String,
    trim: true
  }],
  garantiaAnos: {
    type: Number,
    min: 0
  },
  tolerancia: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'solar_modules'
});

// Indexes
SolarModuleSchema.index({ userId: 1, fabricante: 1, modelo: 1 }, { unique: true });
SolarModuleSchema.index({ userId: 1, potenciaNominal: 1 });
SolarModuleSchema.index({ 
  fabricante: 'text', 
  modelo: 'text', 
  tipoCelula: 'text' 
}, {
  weights: {
    modelo: 3,
    fabricante: 2,
    tipoCelula: 1
  }
});

export const SolarModuleModel = model<ISolarModuleDocument>('SolarModule', SolarModuleSchema);