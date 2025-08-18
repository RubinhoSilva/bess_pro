import { Schema, model } from 'mongoose';
import { ClientStatus, ClientType } from '../../../../domain/entities/Client';

export interface IClientDocument {
  _id?: string;
  domainId?: string; // UUID do domínio
  name: string;
  email: string;
  phone?: string;
  company?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: ClientStatus;
  clientType: ClientType;
  notes?: string;
  tags: string[];
  totalProjectsValue: number;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  userId: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClientDocument>({
  domainId: { type: String, required: false, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  document: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  status: { 
    type: String, 
    enum: Object.values(ClientStatus), 
    default: ClientStatus.ACTIVE 
  },
  clientType: { 
    type: String, 
    enum: Object.values(ClientType), 
    default: ClientType.RESIDENTIAL 
  },
  notes: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  totalProjectsValue: { type: Number, min: 0 },
  lastContactDate: { type: Date },
  nextFollowUpDate: { type: Date },
  userId: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'clients'
});

// Índices compostos para busca otimizada
ClientSchema.index({ domainId: 1 }, { unique: true });
ClientSchema.index({ userId: 1, createdAt: -1 });
ClientSchema.index({ userId: 1, status: 1 });
ClientSchema.index({ userId: 1, clientType: 1 });
ClientSchema.index({ userId: 1, email: 1 }, { unique: true });
ClientSchema.index({ isDeleted: 1 });
ClientSchema.index({ isDeleted: 1, deletedAt: -1 });

// Índice de texto para busca
ClientSchema.index({
  name: 'text',
  email: 'text',
  company: 'text',
  phone: 'text'
});

export const ClientModel = model<IClientDocument>('Client', ClientSchema);