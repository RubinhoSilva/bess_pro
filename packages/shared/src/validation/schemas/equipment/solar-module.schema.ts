import { z } from 'zod';

/**
 * Schema de validação para Módulos Solares
 * Baseado nos tipos do @bess-pro/shared com validações de negócio
 */
export const SolarModuleSchema = z.object({
  // Identificação básica
  model: z.string()
    .min(1, "Model is required")
    .max(255, "Model name too long (max 255 characters)"),
  
  manufacturerId: z.string()
    .uuid()
    .min(1, "Manufacturer ID is required"),
  
  // Especificações elétricas principais
  nominalPower: z.number()
    .positive("Nominal power must be positive")
    .max(10000, "Nominal power too high (max 10000W)")
    .refine(val => val >= 10 && val <= 1000, {
      message: "Nominal power must be between 10W and 1000W for typical modules"
    }),
  
  specifications: z.object({
    // Características elétricas
    voc: z.number()
      .positive("Open circuit voltage must be positive")
      .max(1000, "Voc too high (max 1000V)")
      .refine(val => val >= 10 && val <= 80, {
        message: "Typical module Voc should be between 10V and 80V"
      }),
    
    isc: z.number()
      .positive("Short circuit current must be positive")
      .max(50, "Isc too high (max 50A)")
      .refine(val => val >= 1 && val <= 15, {
        message: "Typical module Isc should be between 1A and 15A"
      }),
    
    vmp: z.number()
      .positive("Voltage at max power must be positive")
      .max(1000, "Vmp too high (max 1000V)")
      .refine(val => val >= 10 && val <= 70, {
        message: "Typical module Vmp should be between 10V and 70V"
      }),
    
    imp: z.number()
      .positive("Current at max power must be positive")
      .max(50, "Imp too high (max 50A)")
      .refine(val => val >= 1 && val <= 13, {
        message: "Typical module Imp should be between 1A and 13A"
      }),
    
    // Eficiência
    efficiency: z.number()
      .min(0, "Efficiency cannot be negative")
      .max(100, "Efficiency cannot exceed 100%")
      .refine(val => val >= 10 && val <= 25, {
        message: "Typical module efficiency should be between 10% and 25%"
      }),
    
    // Tipo de célula
    cellType: z.enum(['monocrystalline', 'polycrystalline', 'thin-film', 'bifacial', 'heterojunction']),
    
    numberOfCells: z.number()
      .int("Number of cells must be integer")
      .positive("Number of cells must be positive")
      .refine(val => val >= 24 && val <= 144, {
        message: "Number of cells should be between 24 and 144"
      }),
    
    // Tecnologia
    technology: z.string()
      .min(1, "Technology is required")
      .max(100, "Technology name too long")
  }).required(),
  
  // Coeficientes de temperatura
  temperatureCoefficients: z.object({
    tempCoefPmax: z.number()
      .refine(val => val >= -1 && val <= 0, {
        message: "Pmax temperature coefficient should be between -1%/°C and 0%/°C"
      }),
    
    tempCoefVoc: z.number()
      .refine(val => val >= -0.5 && val <= 0.1, {
        message: "Voc temperature coefficient should be between -0.5%/°C and 0.1%/°C"
      }),
    
    tempCoefIsc: z.number()
      .refine(val => val >= 0.02 && val <= 0.1, {
        message: "Isc temperature coefficient should be between 0.02%/°C and 0.1%/°C"
      })
  }).required(),
  
  // Parâmetros do diodo
  diodeParameters: z.object({
    aRef: z.number()
      .positive("A reference must be positive")
      .refine(val => val >= 1 && val <= 3, {
        message: "A reference should be between 1 and 3"
      }),
    
    iLRef: z.number()
      .positive("IL reference must be positive")
      .refine(val => val >= 1 && val <= 15, {
        message: "IL reference should be between 1A and 15A"
      }),
    
    iORef: z.number()
      .positive("IO reference must be positive")
      .refine(val => val >= 1e-12 && val <= 1e-6, {
        message: "IO reference should be between 1e-12 and 1e-6"
      }),
    
    rS: z.number()
      .min(0, "Series resistance cannot be negative")
      .max(10, "Series resistance too high (max 10Ω)"),
    
    rShRef: z.number()
      .positive("Shunt resistance must be positive")
      .refine(val => val >= 50 && val <= 10000, {
        message: "Shunt resistance should be between 50Ω and 10000Ω"
      })
  }).required(),
  
  // Parâmetros SAPM
  sapmParameters: z.object({
    a0: z.number(),
    a1: z.number(),
    a2: z.number(),
    a3: z.number(),
    a4: z.number(),
    b0: z.number(),
    b1: z.number(),
    b2: z.number(),
    b3: z.number(),
    b4: z.number(),
    dtc: z.number()
      .refine(val => val >= -50 && val <= 50, {
        message: "DTC should be between -50°C and 50°C"
      })
  }).optional(),
  
  // Parâmetros espectrais
  spectralParameters: z.object({
    material: z.string()
      .min(1, "Material is required")
      .max(50, "Material name too long"),
    
    technology: z.string()
      .min(1, "Technology is required")
      .max(100, "Technology name too long")
  }).optional(),
  
  // Parâmetros avançados
  advancedParameters: z.object({
    alphaSc: z.number(),
    betaOc: z.number(),
    gammaR: z.number()
  }).optional(),
  
  // Dimensões
  dimensions: z.object({
    widthMm: z.number()
      .positive("Width must be positive")
      .refine(val => val >= 500 && val <= 2500, {
        message: "Module width should be between 500mm and 2500mm"
      }),
    
    heightMm: z.number()
      .positive("Height must be positive")
      .refine(val => val >= 500 && val <= 2500, {
        message: "Module height should be between 500mm and 2500mm"
      }),
    
    thicknessMm: z.number()
      .positive("Thickness must be positive")
      .refine(val => val >= 2 && val <= 50, {
        message: "Module thickness should be between 2mm and 50mm"
      }),
    
    weightKg: z.number()
      .positive("Weight must be positive")
      .refine(val => val >= 5 && val <= 50, {
        message: "Module weight should be between 5kg and 50kg"
      })
  }).required(),
  
  // Metadados
  metadata: z.object({
    datasheetUrl: z.string().url().optional(),
    
    imageUrl: z.string().url().optional(),
    
    certifications: z.array(z.string())
      .max(20, "Too many certifications (max 20)")
      .optional(),
    
    warranty: z.number()
      .int("Warranty must be integer")
      .min(0, "Warranty cannot be negative")
      .max(50, "Warranty too long (max 50 years)")
      .optional(),
    
    tolerance: z.string()
      .max(20, "Tolerance description too long")
      .optional()
  }).optional()
});

// Tipos inferidos
export type SolarModuleInput = z.input<typeof SolarModuleSchema>;
export type SolarModuleOutput = z.output<typeof SolarModuleSchema>;

// Schema para atualização (campos opcionais)
export const SolarModuleUpdateSchema = SolarModuleSchema.partial();

export type SolarModuleUpdateInput = z.input<typeof SolarModuleUpdateSchema>;
export type SolarModuleUpdateOutput = z.output<typeof SolarModuleUpdateSchema>;

// Schema para query de busca
export const SolarModuleQuerySchema = z.object({
  manufacturerId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  minPower: z.number().positive().optional(),
  maxPower: z.number().positive().optional(),
  minEfficiency: z.number().min(0).max(100).optional(),
  cellType: z.enum(['monocrystalline', 'polycrystalline', 'thin-film', 'bifacial', 'heterojunction']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['model', 'nominalPower', 'efficiency', 'createdAt']).default('model'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export type SolarModuleQuery = z.input<typeof SolarModuleQuerySchema>;
export type SolarModuleQueryOutput = z.output<typeof SolarModuleQuerySchema>;