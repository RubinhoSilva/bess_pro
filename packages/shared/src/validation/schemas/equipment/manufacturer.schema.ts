import { z } from 'zod';

/**
 * Schema de validação para Fabricantes
 * Baseado nos tipos do @bess-pro/shared com validações de negócio
 */
export const ManufacturerSchema = z.object({
  // Identificação básica
  name: z.string()
    .min(1, "Name is required")
    .max(255, "Name too long (max 255 characters)"),
  
  type: z.enum(['SOLAR_MODULE', 'INVERTER', 'BOTH']),
  
  description: z.string()
    .max(1000, "Description too long (max 1000 characters)")
    .optional(),
  
    website: z.string()
      .url()
      .optional(),
  
  // Informações de contato
  contact: z.object({
    email: z.string()
      .email()
      .optional(),
    
    phone: z.string()
      .max(50, "Phone number too long")
      .regex(/^[+]?[\d\s\-\(\)]+$/, "Invalid phone number format")
      .optional(),
    
    address: z.object({
      street: z.string()
        .max(255, "Street address too long")
        .optional(),
      
      city: z.string()
        .max(100, "City name too long")
        .optional(),
      
      state: z.string()
        .max(100, "State name too long")
        .optional(),
      
      country: z.string()
        .max(100, "Country name too long")
        .optional(),
      
      postalCode: z.string()
        .max(20, "Postal code too long")
        .regex(/^[A-Za-z0-9\s\-]+$/, "Invalid postal code format")
        .optional()
    }).optional()
  }).optional(),
  
  // Informações comerciais
  business: z.object({
    foundedYear: z.number()
      .int("Founded year must be integer")
      .min(1800, "Founded year too early")
      .max(new Date().getFullYear(), "Founded year cannot be in the future")
      .optional(),
    
    headquarters: z.string()
      .max(255, "Headquarters address too long")
      .optional(),
    
    employeeCount: z.number()
      .int("Employee count must be integer")
      .positive("Employee count must be positive")
      .max(1000000, "Employee count too high")
      .optional(),
    
    revenue: z.number()
      .positive("Revenue must be positive")
      .max(1000000000000, "Revenue too high (max 1 trillion)")
      .optional()
  }).optional(),
  
  // Certificações
  certifications: z.array(z.string())
    .max(50, "Too many certifications (max 50)")
    .optional(),
  
  // Metadados
  metadata: z.object({
    logoUrl: z.string()
      .url()
      .optional(),
    
    imageUrl: z.string()
      .url()
      .optional(),
    
    specialties: z.array(z.string())
      .max(20, "Too many specialties (max 20)")
      .optional(),
    
    markets: z.array(z.string())
      .max(50, "Too many markets (max 50)")
      .optional(),
    
    qualityStandards: z.array(z.string())
      .max(20, "Too many quality standards (max 20)")
      .optional()
  }).optional(),
  
  // Status
  status: z.enum(['active', 'inactive']),
  
  isDefault: z.boolean()
    .default(false)
});

// Tipos inferidos
export type ManufacturerInput = z.input<typeof ManufacturerSchema>;
export type ManufacturerOutput = z.output<typeof ManufacturerSchema>;

// Schema para atualização (campos opcionais)
export const ManufacturerUpdateSchema = ManufacturerSchema.partial();

export type ManufacturerUpdateInput = z.input<typeof ManufacturerUpdateSchema>;
export type ManufacturerUpdateOutput = z.output<typeof ManufacturerUpdateSchema>;

// Schema para query de busca
export const ManufacturerQuerySchema = z.object({
  search: z.string()
    .max(100, "Search term too long")
    .optional(),
  
  type: z.enum(['SOLAR_MODULE', 'INVERTER', 'BOTH']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  country: z.string()
    .max(100, "Country name too long")
    .optional(),
  
  foundedAfter: z.number()
    .int("Year must be integer")
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  
  foundedBefore: z.number()
    .int("Year must be integer")
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  
  isDefault: z.boolean().optional(),
  
  page: z.coerce.number()
    .int("Page must be integer")
    .positive("Page must be positive")
    .default(1),
  
  pageSize: z.coerce.number()
    .int("Page size must be integer")
    .positive("Page size must be positive")
    .max(100, "Page size too large (max 100)")
    .default(20),
  
  sortBy: z.enum(['name', 'type', 'status', 'foundedYear', 'createdAt'])
    .default('name'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('asc')
});

export type ManufacturerQuery = z.input<typeof ManufacturerQuerySchema>;
export type ManufacturerQueryOutput = z.output<typeof ManufacturerQuerySchema>;