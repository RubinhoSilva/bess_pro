import { Schema, model, Document } from 'mongoose';

export interface ISolarModuleDocument extends Document {
  teamId: string;
  manufacturerId: string;
  isDefault?: boolean;
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
  
  // Parâmetros para modelo espectral
  material?: string;
  technology?: string;
  
  // Parâmetros do modelo de diodo único
  aRef?: number;
  iLRef?: number;
  iORef?: number;
  rS?: number;
  rShRef?: number;
  
  // Coeficientes de temperatura críticos
  alphaSc?: number;
  betaOc?: number;
  gammaR?: number;
  
  // Parâmetros SAPM térmicos
  a0?: number; a1?: number; a2?: number; a3?: number; a4?: number;
  b0?: number; b1?: number; b2?: number; b3?: number; b4?: number; b5?: number;
  dtc?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const SolarModuleSchema = new Schema<ISolarModuleDocument>({
  teamId: {
    type: String,
    required: true,
    index: true
  },
  isDefault: {
    type: Boolean,
    required: false,
    default: false,
    index: true
  },
  manufacturerId: {
    type: String,
    required: true,
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
  },
  
  // Parâmetros para modelo espectral
  material: {
    type: String,
    trim: true
  },
  technology: {
    type: String,
    trim: true
  },
  
  // Parâmetros do modelo de diodo único
  aRef: {
    type: Number,
    min: 0.5,
    max: 3.0
  },
  iLRef: {
    type: Number,
    min: 5,
    max: 20
  },
  iORef: {
    type: Number,
    min: 1e-15,
    max: 1e-8
  },
  rS: {
    type: Number,
    min: 0.1,
    max: 2.0
  },
  rShRef: {
    type: Number,
    min: 100,
    max: 1000
  },
  
  // Coeficientes de temperatura críticos
  alphaSc: {
    type: Number,
    min: 0.0001,
    max: 0.001
  },
  betaOc: {
    type: Number,
    min: -0.01,
    max: -0.001
  },
  gammaR: {
    type: Number,
    min: -0.001,
    max: 0
  },
  
  // Parâmetros SAPM térmicos
  a0: { type: Number, min: -10, max: 10 },
  a1: { type: Number, min: -1, max: 1 },
  a2: { type: Number, min: -1, max: 1 },
  a3: { type: Number, min: -1, max: 1 },
  a4: { type: Number, min: -1, max: 1 },
  b0: { type: Number, min: -1, max: 1 },
  b1: { type: Number, min: -1, max: 1 },
  b2: { type: Number, min: -1, max: 1 },
  b3: { type: Number, min: -1, max: 1 },
  b4: { type: Number, min: -1, max: 1 },
  b5: { type: Number, min: -1, max: 1 },
  dtc: {
    type: Number,
    min: 0,
    max: 10
  }
}, {
  timestamps: true,
  collection: 'solar_modules'
});

// Indexes
SolarModuleSchema.index({ teamId: 1, manufacturerId: 1, modelo: 1 }, { unique: true });
SolarModuleSchema.index({ teamId: 1, potenciaNominal: 1 });
SolarModuleSchema.index({ 
  modelo: 'text', 
  tipoCelula: 'text' 
}, {
  weights: {
    modelo: 3,
    tipoCelula: 1
  }
});

export const SolarModuleModel = model<ISolarModuleDocument>('SolarModule', SolarModuleSchema);