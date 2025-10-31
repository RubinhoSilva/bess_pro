import { Schema, model } from 'mongoose';

export interface ICompanyProfileDocument {
  _id?: string;
  domainId?: string; // UUID do domínio
  companyName: string;
  tradingName?: string;
  taxId?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  logoPath?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isActive: boolean;
  teamId: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  mission?: string;
  foundedYear?: string;
  completedProjectsCount?: string;
  totalInstalledPower?: string;
  satisfiedClientsCount?: string;
  companyNotes?: string;
}

const CompanyProfileSchema = new Schema<ICompanyProfileDocument>({
  domainId: { type: String, required: false, unique: true, sparse: true },
  companyName: { type: String, required: true, trim: true },
  tradingName: { type: String, trim: true },
  taxId: { type: String, trim: true },
  stateRegistration: { type: String, trim: true },
  municipalRegistration: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  logoUrl: { type: String, trim: true },
  logoPath: { type: String, trim: true },
  website: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'Brasil' },
  isActive: { type: Boolean, default: true, index: true },
  teamId: { type: String, required: true, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  mission: { type: String, trim: true },
  foundedYear: { type: String, trim: true },
  completedProjectsCount: { type: String, trim: true },
  totalInstalledPower: { type: String, trim: true },
  satisfiedClientsCount: { type: String, trim: true },
  companyNotes: { type: String, trim: true }
}, {
  timestamps: true,
  collection: 'companyProfiles'
});

// Índices compostos para busca otimizada
CompanyProfileSchema.index({ domainId: 1 }, { unique: true });
CompanyProfileSchema.index({ companyName: 1 }, { unique: true, sparse: true });
CompanyProfileSchema.index({ taxId: 1 }, { unique: true, sparse: true });
CompanyProfileSchema.index({ email: 1 }, { unique: true, sparse: true });
CompanyProfileSchema.index({ isActive: 1 });
CompanyProfileSchema.index({ isDeleted: 1 });
CompanyProfileSchema.index({ isDeleted: 1, deletedAt: -1 });
CompanyProfileSchema.index({ isActive: 1, isDeleted: 1 });
CompanyProfileSchema.index({ teamId: 1 }, { unique: true });

// Índice de texto para busca
CompanyProfileSchema.index({
  companyName: 'text',
  tradingName: 'text',
  email: 'text',
  phone: 'text',
  website: 'text'
});

export const CompanyProfileModel = model<ICompanyProfileDocument>('CompanyProfile', CompanyProfileSchema);