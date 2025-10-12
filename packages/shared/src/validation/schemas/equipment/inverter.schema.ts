import { z } from 'zod';

/**
 * Schema de validação para Inversores
 * Baseado nos tipos do @bess-pro/shared com validações de negócio
 */
export const InverterSchema = z.object({
  // Fabricante
  manufacturer: z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Manufacturer name is required"),
    type: z.enum(['SOLAR_MODULE', 'INVERTER', 'BOTH']),
    description: z.string().optional(),
    website: z.string().url().optional(),
    contact: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional()
      }).optional()
    }),
    business: z.object({
      foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
      headquarters: z.string().optional(),
      employeeCount: z.number().int().positive().optional(),
      revenue: z.number().positive().optional()
    }),
    certifications: z.array(z.string()).optional(),
    metadata: z.object({
      logoUrl: z.string().url().optional(),
      imageUrl: z.string().url().optional(),
      specialties: z.array(z.string()).optional(),
      markets: z.array(z.string()).optional(),
      qualityStandards: z.array(z.string()).optional()
    }),
    status: z.enum(['active', 'inactive']),
    isDefault: z.boolean().default(false),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
  }),
  
  // Modelo
  model: z.string()
    .min(1, "Model is required")
    .max(255, "Model name too long (max 255 characters)"),
  
  // Especificações de potência
  power: z.object({
    ratedACPower: z.number()
      .positive("Rated AC power must be positive")
      .max(100000, "Rated AC power too high (max 100kW)")
      .refine(val => val >= 100 && val <= 50000, {
        message: "Rated AC power should be between 100W and 50kW"
      }),
    
    maxPVPower: z.number()
      .positive("Max PV power must be positive")
      .max(200000, "Max PV power too high (max 200kW)")
      .refine(val => val >= 100 && val <= 100000, {
        message: "Max PV power should be between 100W and 100kW"
      }),
    
    ratedDCPower: z.number()
      .positive("Rated DC power must be positive")
      .max(200000, "Rated DC power too high (max 200kW)")
      .optional(),
    
    shortCircuitVoltageMax: z.number()
      .positive("Short circuit voltage must be positive")
      .max(1500, "Short circuit voltage too high (max 1500V)")
      .refine(val => val >= 50 && val <= 1000, {
        message: "Short circuit voltage should be between 50V and 1000V"
      }),
    
    maxInputCurrent: z.number()
      .positive("Max input current must be positive")
      .max(200, "Max input current too high (max 200A)")
      .refine(val => val >= 5 && val <= 100, {
        message: "Max input current should be between 5A and 100A"
      }),
    
    maxApparentPower: z.number()
      .positive("Max apparent power must be positive")
      .max(200000, "Max apparent power too high (max 200kVA)")
      .optional(),
    
    maxDCVoltage: z.number()
      .positive("Max DC voltage must be positive")
      .max(1500, "Max DC voltage too high (max 1500V)")
      .optional(),
    
    maxOutputCurrent: z.number()
      .positive("Max output current must be positive")
      .max(200, "Max output current too high (max 200A)")
      .optional()
  }).required(),
  
  // Configuração MPPT
  mppt: z.object({
    numberOfMppts: z.number()
      .int("Number of MPPTs must be integer")
      .positive("Number of MPPTs must be positive")
      .max(20, "Too many MPPTs (max 20)")
      .refine(val => val >= 1 && val <= 12, {
        message: "Number of MPPTs should be between 1 and 12"
      }),
    
    stringsPerMppt: z.number()
      .int("Strings per MPPT must be integer")
      .positive("Strings per MPPT must be positive")
      .max(20, "Too many strings per MPPT (max 20)")
      .refine(val => val >= 1 && val <= 15, {
        message: "Strings per MPPT should be between 1 and 15"
      }),
    
    mpptRange: z.string()
      .max(50, "MPPT range description too long")
      .optional(),
    
    maxInputCurrentPerMppt: z.number()
      .positive("Max input current per MPPT must be positive")
      .max(50, "Max input current per MPPT too high (max 50A)")
      .optional()
  }).required(),
  
  // Especificações elétricas
  electrical: z.object({
    maxEfficiency: z.number()
      .min(0, "Efficiency cannot be negative")
      .max(100, "Efficiency cannot exceed 100%")
      .refine(val => val >= 85 && val <= 99, {
        message: "Typical inverter efficiency should be between 85% and 99%"
      }),
    
    europeanEfficiency: z.number()
      .min(0, "European efficiency cannot be negative")
      .max(100, "European efficiency cannot exceed 100%")
      .refine(val => val >= 80 && val <= 98, {
        message: "European efficiency should be between 80% and 98%"
      })
      .optional(),
    
    mpptEfficiency: z.number()
      .min(0, "MPPT efficiency cannot be negative")
      .max(100, "MPPT efficiency cannot exceed 100%")
      .refine(val => val >= 95 && val <= 99.9, {
        message: "MPPT efficiency should be between 95% and 99.9%"
      })
      .optional(),
    
    gridType: z.enum(['monofasico', 'bifasico', 'trifasico']),
    
    ratedVoltage: z.string()
      .min(1, "Rated voltage is required")
      .max(20, "Rated voltage too long")
      .refine(val => /^(110|127|220|230|240|380|400|440)V?$/.test(val), {
        message: "Rated voltage should be a standard value (110V, 127V, 220V, 230V, 240V, 380V, 400V, 440V)"
      }),
    
    frequency: z.number()
      .positive("Frequency must be positive")
      .refine(val => val === 50 || val === 60, {
        message: "Frequency must be 50Hz or 60Hz"
      })
      .optional(),
    
    powerFactor: z.number()
      .min(0, "Power factor cannot be negative")
      .max(1, "Power factor cannot exceed 1")
      .refine(val => val >= 0.8 && val <= 1, {
        message: "Power factor should be between 0.8 and 1.0"
      })
      .optional()
  }).required(),
  
  // Dimensões
  dimensions: z.object({
    widthMm: z.number()
      .positive("Width must be positive")
      .refine(val => val >= 100 && val <= 1000, {
        message: "Inverter width should be between 100mm and 1000mm"
      }),
    
    heightMm: z.number()
      .positive("Height must be positive")
      .refine(val => val >= 100 && val <= 1000, {
        message: "Inverter height should be between 100mm and 1000mm"
      }),
    
    depthMm: z.number()
      .positive("Depth must be positive")
      .refine(val => val >= 50 && val <= 800, {
        message: "Inverter depth should be between 50mm and 800mm"
      }),
    
    weightKg: z.number()
      .positive("Weight must be positive")
      .refine(val => val >= 5 && val <= 200, {
        message: "Inverter weight should be between 5kg and 200kg"
      })
  }).optional(),
  
  // Metadados
  metadata: z.object({
    price: z.number()
      .positive("Price must be positive")
      .max(1000000, "Price too high (max 1M)")
      .optional(),
    
    currency: z.string()
      .length(3, "Currency must be 3 characters (ISO 4217)")
      .optional(),
    
    manufacturerId: z.string().uuid().optional(),
    
    productCode: z.string()
      .max(100, "Product code too long")
      .optional(),
    
    datasheetUrl: z.string().url().optional(),
    
    imageUrl: z.string().url().optional(),
    
    certifications: z.array(z.string())
      .max(20, "Too many certifications (max 20)")
      .optional(),
    
    warranty: z.number()
      .int("Warranty must be integer")
      .min(0, "Warranty cannot be negative")
      .max(25, "Warranty too long (max 25 years)")
      .optional(),
    
    connectionType: z.enum(['on-grid', 'off-grid', 'hybrid']),
    
    countryOfOrigin: z.string()
      .max(100, "Country name too long")
      .optional(),
    
    protections: z.array(z.string())
      .max(20, "Too many protections (max 20)")
      .optional(),
    
    protectionRating: z.string()
      .max(10, "Protection rating too long")
      .refine(val => /^IP[0-9]{2}$/.test(val), {
        message: "Protection rating must be in format IPXX (e.g., IP65)"
      })
      .optional(),
    
    operatingTemperature: z.string()
      .max(50, "Operating temperature range too long")
      .refine(val => /^-?\d+°C\s*to\s*\d+°C$/.test(val), {
        message: "Operating temperature must be in format '-25°C to +60°C'"
      })
      .optional(),
    
    userId: z.string().uuid().optional(),
    
    sandiaParameters: z.object({
      vdco: z.number().optional(),
      pso: z.number().optional(),
      c0: z.number().optional(),
      c1: z.number().optional(),
      c2: z.number().optional(),
      c3: z.number().optional(),
      pnt: z.number().optional()
    }).optional()
  }).required()
});

// Tipos inferidos
export type InverterInput = z.input<typeof InverterSchema>;
export type InverterOutput = z.output<typeof InverterSchema>;

// Schema para atualização (campos opcionais)
export const InverterUpdateSchema = InverterSchema.partial();

export type InverterUpdateInput = z.input<typeof InverterUpdateSchema>;
export type InverterUpdateOutput = z.output<typeof InverterUpdateSchema>;

// Schema para query de busca
export const InverterQuerySchema = z.object({
  manufacturerId: z.string().uuid().optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(255).optional(),
  minPower: z.number().positive().optional(),
  maxPower: z.number().positive().optional(),
  gridType: z.enum(['monofasico', 'bifasico', 'trifasico']).optional(),
  minMppts: z.number().int().positive().optional(),
  minEfficiency: z.number().min(0).max(100).optional(),
  connectionType: z.enum(['on-grid', 'off-grid', 'hybrid']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['model', 'ratedACPower', 'maxEfficiency', 'createdAt']).default('model'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export type InverterQuery = z.input<typeof InverterQuerySchema>;
export type InverterQueryOutput = z.output<typeof InverterQuerySchema>;