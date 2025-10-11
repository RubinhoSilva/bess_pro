import { z } from 'zod';

/**
 * Schema para validação de dados do inversor
 * Compatível com os tipos do shared: Inverter, InverterPower, MPPTConfiguration, ElectricalSpecifications, InverterMetadata
 * E com a estrutura do store (campos flat como no original)
 */
export const inverterFormSchema = z.object({
  // Campos principais (compatíveis com store)
  manufacturerId: z.string().min(1, 'Fabricante é obrigatório'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  
  // Configuração de potência (exatamente como no store)
  ratedACPower: z.number().positive('Potência AC nominal deve ser positiva'),
  maxPVPower: z.number().positive('Potência máxima PV deve ser positiva'),
  ratedDCPower: z.number().positive('Potência DC nominal deve ser positiva').optional(),
  shortCircuitVoltageMax: z.number().positive('Tensão máxima de curto-circuito deve ser positiva'),
  maxInputCurrent: z.number().positive('Corrente máxima de entrada deve ser positiva'),
  maxApparentPower: z.number().positive('Potência aparente máxima deve ser positiva'),
  
  // Configuração MPPT (exatamente como no store)
  numberOfMppts: z.number().int().min(1, 'Número de MPPTs deve ser pelo menos 1'),
  stringsPerMppt: z.number().int().min(1, 'Strings por MPPT deve ser pelo menos 1'),
  
  // Especificações elétricas (exatamente como no store)
  maxEfficiency: z.number().min(0).max(100, 'Eficiência máxima deve estar entre 0 e 100'),
  gridType: z.enum(['monofasico', 'bifasico', 'trifasico'], {
    errorMap: () => ({ message: 'Tipo de rede inválido' })
  }),
  ratedVoltage: z.number().positive('Tensão nominal deve ser positiva').optional(),
  frequency: z.number().positive('Frequência deve ser positiva').optional(),
  powerFactor: z.number().min(0).max(1, 'Fator de potência deve estar entre 0 e 1').optional(),
  
  // Metadados (exatamente como no store)
  price: z.number().positive('Preço deve ser positivo').optional(),
  currency: z.string().min(3, 'Moeda deve ter pelo menos 3 caracteres').optional(),
  productCode: z.string().min(1, 'Código do produto é obrigatório').optional(),
  datasheetUrl: z.string().url('URL do datasheet inválida').optional(),
  imageUrl: z.string().url('URL da imagem inválida').optional(),
  certifications: z.array(z.string()).default([]),
  warranty: z.number().int().min(0, 'Garantia deve ser positiva').default(0),
  connectionType: z.enum(['on-grid', 'off-grid', 'hybrid'], {
    errorMap: () => ({ message: 'Tipo de conexão inválido' })
  }),
  countryOfOrigin: z.string().min(2, 'País de origem inválido').optional(),
  
  // Status
  isPublic: z.boolean().default(false),
});

// Schema simplificado para formulário rápido (dimensionamento)
export const inverterSimpleSchema = inverterFormSchema.pick({
  manufacturerId: true,
  model: true,
  ratedACPower: true,
  gridType: true,
  maxPVPower: true,
  shortCircuitVoltageMax: true,
  numberOfMppts: true,
  stringsPerMppt: true,
  maxEfficiency: true,
});

// Schema para validação de compatibilidade
export const inverterCompatibilitySchema = z.object({
  ratedACPower: z.number().positive(),
  maxPVPower: z.number().positive(),
  shortCircuitVoltageMax: z.number().positive(),
  numberOfMppts: z.number().int().positive(),
  stringsPerMppt: z.number().int().positive(),
  maxInputCurrent: z.number().positive().optional(),
});

// Tipos exportados
export type InverterFormData = z.infer<typeof inverterFormSchema>;
export type InverterSimpleFormData = z.infer<typeof inverterSimpleSchema>;
export type InverterCompatibilityData = z.infer<typeof inverterCompatibilitySchema>;

// Valores padrão para formulários
export const defaultInverterValues: Partial<InverterFormData> = {
  ratedACPower: 0,
  gridType: 'monofasico',
  maxPVPower: 0,
  shortCircuitVoltageMax: 0,
  numberOfMppts: 1,
  stringsPerMppt: 1,
  maxEfficiency: 0,
  maxInputCurrent: 0,
  maxApparentPower: 0,
  ratedVoltage: 0,
  frequency: 60,
  warranty: 0,
  isPublic: false,
  connectionType: 'on-grid',
  certifications: [],
};

// Validações personalizadas
export const validateInverterPower = (potencia: number) => {
  if (potencia < 300) return 'Potência muito baixa para inversores comerciais';
  if (potencia > 50000) return 'Potência muito alta para inversores comerciais';
  return null;
};

export const validateMpptConfiguration = (numeroMppt: number, stringsPorMppt: number) => {
  const totalStrings = numeroMppt * stringsPorMppt;
  if (totalStrings > 100) {
    return 'Número total de strings muito alto para configuração típica';
  }
  if (stringsPorMppt > 20) {
    return 'Número de strings por MPPT muito alto';
  }
  return null;
};

/**
 * Configurações para validação de inversores
 */
const INVERTER_VALIDATION_CONFIG = {
  /** Tensão mínima para sistemas comerciais (Volts) */
  MIN_COMMERCIAL_VOLTAGE: 400,
} as const;

export const validateVoltageRange = (tensaoCcMax: number, potenciaSaidaCA: number) => {
  if (tensaoCcMax < INVERTER_VALIDATION_CONFIG.MIN_COMMERCIAL_VOLTAGE) {
    return `Tensão CC máxima muito baixa para sistemas comerciais (mínimo: ${INVERTER_VALIDATION_CONFIG.MIN_COMMERCIAL_VOLTAGE}V)`;
  }
  return null;
};

