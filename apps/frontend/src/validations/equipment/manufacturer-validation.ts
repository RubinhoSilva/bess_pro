import { z } from 'zod';

/**
 * Schema para validação de dados do fabricante
 * Compatível com os tipos do shared: Manufacturer, ManufacturerContact, ManufacturerBusiness, ManufacturerMetadata
 * E com a estrutura do store (campos flat como no original)
 */
export const manufacturerFormSchema = z.object({
  // Campos principais (compatíveis com store)
  name: z.string().min(1, 'Nome do fabricante é obrigatório'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  
  // Contato (exatamente como no store)
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().optional(),
  
  // Endereço (exatamente como no store)
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, 'País é obrigatório'),
  postalCode: z.string().optional(),
  
  // Informações comerciais (exatamente como no store)
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  headquarters: z.string().optional(),
  employeeCount: z.number().int().min(1).optional(),
  revenue: z.number().positive().optional(),
  stockTicker: z.string().optional(),
  parentCompany: z.string().optional(),
  
  // Metadados (exatamente como no store)
  logoUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  brochureUrl: z.string().url().optional().or(z.literal('')),
  
  // Redes sociais (exatamente como no store)
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  
  // Classificações (exatamente como no store)
  specialties: z.array(z.string()).default([]),
  markets: z.array(z.string()).default([]),
  qualityStandards: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  
  // Campos adicionais para compatibilidade
  type: z.enum(['solar_module', 'inverter', 'both'], {
    errorMap: () => ({ message: 'Tipo de fabricante inválido' })
  }),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  userId: z.string().optional(),
  notes: z.string().optional(),
  productLines: z.array(z.string()).default([]),
});

// Schema simplificado para formulário rápido
export const manufacturerSimpleSchema = manufacturerFormSchema.pick({
  name: true,
  country: true,
  type: true,
  isActive: true,
});

// Tipos exportados
export type ManufacturerFormData = z.infer<typeof manufacturerFormSchema>;
export type ManufacturerSimpleFormData = z.infer<typeof manufacturerSimpleSchema>;

// Valores padrão para formulários
export const defaultManufacturerValues: Partial<ManufacturerFormData> = {
  name: '',
  description: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  supportEmail: '',
  supportPhone: '',
  street: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  foundedYear: undefined,
  headquarters: '',
  employeeCount: undefined,
  revenue: undefined,
  stockTicker: '',
  parentCompany: '',
  logoUrl: '',
  imageUrl: '',
  brochureUrl: '',
  linkedin: '',
  twitter: '',
  facebook: '',
  youtube: '',
  specialties: [],
  markets: [],
  qualityStandards: [],
  certifications: [],
  type: 'both',
  isActive: true,
  isPublic: false,
  userId: '',
  notes: '',
  productLines: [],
};

// Validações personalizadas
export const validateManufacturerName = (name: string): string | null => {
  if (name.length < 2) return 'Nome muito curto';
  if (name.length > 100) return 'Nome muito longo';
  if (!/^[a-zA-Z0-9\s\-&.]+$/.test(name)) {
    return 'Nome contém caracteres inválidos';
  }
  return null;
};

export const validateWebsite = (website: string): string | null => {
  if (!website) return null;
  
  try {
    new URL(website);
    return null;
  } catch {
    return 'URL inválida';
  }
};

export const validateEmail = (email: string): string | null => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email inválido';
  }
  return null;
};

export const validateFoundedYear = (year: number): string | null => {
  const currentYear = new Date().getFullYear();
  if (year < 1800) return 'Ano de fundação muito antigo';
  if (year > currentYear) return 'Ano de fundação no futuro';
  return null;
};