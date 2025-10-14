import { Schema, model, Document } from 'mongoose';

export interface IInverterDocument extends Document {
  teamId: string;
  manufacturerId?: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  tipoRede: string;
  
  // Dados de entrada (CC/FV)
  potenciaFvMax?: number;
  tensaoCcMax?: number;
  numeroMppt?: number;
  stringsPorMppt?: number;
  faixaMppt?: string;
  correnteEntradaMax?: number;
  
  // Dados de saída (CA)
  potenciaAparenteMax?: number;
  correnteSaidaMax?: number;
  tensaoSaidaNominal?: string;
  frequenciaNominal?: number;
  
  // Eficiência
  eficienciaMax?: number;
  eficienciaEuropeia?: number;
  eficienciaMppt?: number;
  
  // Proteções e certificações
  protecoes?: string[];
  certificacoes?: string[];
  grauProtecao?: string;
  
  // Características físicas
  dimensoes?: {
    larguraMm: number;
    alturaMm: number;
    profundidadeMm: number;
  };
  pesoKg?: number;
  temperaturaOperacao?: string;
  
  // Dados comerciais
  garantiaAnos?: number;
  datasheetUrl?: string;
  precoReferencia?: number;
  
  // Parâmetros Sandia para simulação precisa
  vdco?: number;
  pso?: number;
  c0?: number;
  c1?: number;
  c2?: number;
  c3?: number;
  pnt?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const InverterSchema = new Schema<IInverterDocument>({
  teamId: {
    type: String,
    required: true,
    index: true
  },
  manufacturerId: {
    type: String,
    required: false,
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
  potenciaSaidaCA: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  tipoRede: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Dados de entrada (CC/FV)
  potenciaFvMax: {
    type: Number,
    min: 0
  },
  tensaoCcMax: {
    type: Number,
    min: 0
  },
  numeroMppt: {
    type: Number,
    min: 1
  },
  stringsPorMppt: {
    type: Number,
    min: 1
  },
  faixaMppt: {
    type: String,
    trim: true
  },
  correnteEntradaMax: {
    type: Number,
    min: 0
  },
  
  // Dados de saída (CA)
  potenciaAparenteMax: {
    type: Number,
    min: 0
  },
  correnteSaidaMax: {
    type: Number,
    min: 0
  },
  tensaoSaidaNominal: {
    type: String,
    trim: true
  },
  frequenciaNominal: {
    type: Number,
    min: 0
  },
  
  // Eficiência
  eficienciaMax: {
    type: Number,
    min: 0,
    max: 100
  },
  eficienciaEuropeia: {
    type: Number,
    min: 0,
    max: 100
  },
  eficienciaMppt: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Proteções e certificações
  protecoes: [{
    type: String,
    trim: true
  }],
  certificacoes: [{
    type: String,
    trim: true
  }],
  grauProtecao: {
    type: String,
    trim: true
  },
  
  // Características físicas
  dimensoes: {
    larguraMm: {
      type: Number,
      min: 0
    },
    alturaMm: {
      type: Number,
      min: 0
    },
    profundidadeMm: {
      type: Number,
      min: 0
    }
  },
  pesoKg: {
    type: Number,
    min: 0
  },
  temperaturaOperacao: {
    type: String,
    trim: true
  },
  
  // Dados comerciais
  garantiaAnos: {
    type: Number,
    min: 0
  },
  datasheetUrl: {
    type: String,
    trim: true
  },
  precoReferencia: {
    type: Number,
    min: 0
  },
  
  // Parâmetros Sandia para simulação precisa
  vdco: {
    type: Number,
    min: 100,
    max: 1000
  },
  pso: {
    type: Number,
    min: 0,
    max: 100
  },
  c0: {
    type: Number,
    min: -1,
    max: 1
  },
  c1: {
    type: Number,
    min: -1,
    max: 1
  },
  c2: {
    type: Number,
    min: -1,
    max: 1
  },
  c3: {
    type: Number,
    min: -1,
    max: 1
  },
  pnt: {
    type: Number,
    min: 0,
    max: 1
  }
}, {
  timestamps: true,
  collection: 'inverters'
});

// Indexes
InverterSchema.index({ teamId: 1, fabricante: 1, modelo: 1 }, { unique: true });
InverterSchema.index({ teamId: 1, potenciaSaidaCA: 1 });
InverterSchema.index({ teamId: 1, tipoRede: 1 });
InverterSchema.index({ 
  fabricante: 'text', 
  modelo: 'text', 
  tipoRede: 'text' 
}, {
  weights: {
    modelo: 3,
    fabricante: 2,
    tipoRede: 1
  }
});

export const InverterModel = model<IInverterDocument>('Inverter', InverterSchema);