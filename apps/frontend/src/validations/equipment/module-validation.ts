import { z } from 'zod';

/**
 * Schema para validação de dados do módulo solar
 * Compatível com os tipos do shared: SolarModule, ModuleSpecifications, ModuleParameters, ModuleDimensions, ModuleMetadata
 * E com a estrutura do store (campos flat como no original)
 */
export const moduleFormSchema = z.object({
  // Campos principais (compatíveis com store)
  manufacturerId: z.string().min(1, 'Fabricante é obrigatório'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  
  // Potência e eficiência (exatamente como no store)
  nominalPower: z.number().positive('Potência nominal deve ser positiva'),
  efficiency: z.number().min(0).max(100, 'Eficiência deve estar entre 0 e 100'),
  
  // Especificações elétricas (exatamente como no store)
  vmpp: z.number().positive('Tensão no ponto de máxima potência deve ser positiva').optional(),
  impp: z.number().positive('Corrente no ponto de máxima potência deve ser positiva').optional(),
  voc: z.number().positive('Tensão de circuito aberto deve ser positiva'),
  isc: z.number().positive('Corrente de curto-circuito deve ser positiva'),
  
  // Configuração das células (exatamente como no store)
  cellType: z.enum(['monocrystalline', 'polycrystalline', 'thin-film', 'bifacial', 'heterojunction', 'perovskite', 'cdte', 'cis', 'cigs'], {
    errorMap: () => ({ message: 'Tipo de célula inválido' })
  }),
  technology: z.enum(['perc', 'hjt', 'topcon', 'ibc', 'shj', 'half-cut', 'multi-busbar', 'tandem'], {
    errorMap: () => ({ message: 'Tecnologia da célula inválida' })
  }),
  numberOfCells: z.number().int().min(1, 'Número de células deve ser positivo').optional(),
  
  // Coeficientes de temperatura (exatamente como no store)
  tempCoeffPmax: z.number().optional(),
  tempCoeffVoc: z.number().optional(),
  tempCoeffIsc: z.number().optional(),
  
  // Parâmetros do diodo (exatamente como no store)
  aRef: z.number().optional(),
  iLRef: z.number().optional(),
  iORef: z.number().optional(),
  rShRef: z.number().optional(),
  rS: z.number().optional(),
  
  // Parâmetros SAPM (exatamente como no store)
  a4: z.number().optional(),
  a3: z.number().optional(),
  a2: z.number().optional(),
  a1: z.number().optional(),
  a0: z.number().optional(),
  b4: z.number().optional(),
  b3: z.number().optional(),
  b2: z.number().optional(),
  b1: z.number().optional(),
  b0: z.number().optional(),
  fd: z.number().optional(),
  
  // Parâmetros espectrais (exatamente como no store)
  am: z.number().optional(),
  
  // Parâmetros avançados
  alphaSc: z.number().optional(),
  betaOc: z.number().optional(),
  gammaR: z.number().optional(),
  
  // Dimensões (exatamente como no store)
  widthMm: z.number().positive('Largura deve ser positiva'),
  heightMm: z.number().positive('Altura deve ser positiva'),
  thicknessMm: z.number().positive('Espessura deve ser positiva').optional(),
  weightKg: z.number().positive('Peso deve ser positivo'),
  areaM2: z.number().positive('Área deve ser positiva'),
  
  // Metadados (exatamente como no store)
  price: z.number().positive('Preço deve ser positivo').optional(),
  currency: z.string().min(3, 'Moeda deve ter pelo menos 3 caracteres').optional(),
  productCode: z.string().min(1, 'Código do produto é obrigatório').optional(),
  datasheetUrl: z.string().url('URL do datasheet inválida').optional(),
  imageUrl: z.string().url('URL da imagem inválida').optional(),
  certifications: z.array(z.string()).default([]),
  warranty: z.number().int().min(0, 'Garantia deve ser positiva').default(0),
  countryOfOrigin: z.string().min(2, 'País de origem inválido').optional(),
  assuranceYears: z.number().int().min(0, 'Anos de garantia de performance deve ser positivo').optional(),
  
  // Status
  isPublic: z.boolean().default(false),
});

// Schema simplificado para formulário rápido (dimensionamento)
export const moduleSimpleSchema = moduleFormSchema.pick({
  manufacturerId: true,
  model: true,
  nominalPower: true,
  efficiency: true,
  voc: true,
  isc: true,
  cellType: true,
  technology: true,
});

// Schema para validação de compatibilidade
export const moduleCompatibilitySchema = z.object({
  nominalPower: z.number().positive(),
  voc: z.number().positive(),
  isc: z.number().positive(),
  vmpp: z.number().positive().optional(),
  impp: z.number().positive().optional(),
  efficiency: z.number().min(0).max(100),
  tempCoeffPmax: z.number().optional(),
  tempCoeffVoc: z.number().optional(),
  tempCoeffIsc: z.number().optional(),
});

// Tipos exportados
export type ModuleFormData = z.infer<typeof moduleFormSchema>;
export type ModuleSimpleFormData = z.infer<typeof moduleSimpleSchema>;
export type ModuleCompatibilityData = z.infer<typeof moduleCompatibilitySchema>;

// Valores padrão para formulários
export const defaultModuleValues: Partial<ModuleFormData> = {
  nominalPower: 0,
  efficiency: 0,
  voc: 0,
  isc: 0,
  cellType: 'monocrystalline',
  technology: 'perc',
  numberOfCells: 60,
  widthMm: 0,
  heightMm: 0,
  weightKg: 0,
  areaM2: 0,
  warranty: 0,
  isPublic: false,
  certifications: [],
};

// Validações personalizadas
export const validateModulePower = (potencia: number) => {
  if (potencia < 10) return 'Potência muito baixa para módulos comerciais';
  if (potencia > 700) return 'Potência muito alta para módulos comerciais';
  return null;
};

export const validateEfficiency = (eficiencia: number, cellType: string) => {
  const limits: Record<string, { min: number; max: number }> = {
    monocrystalline: { min: 17, max: 23 },
    polycrystalline: { min: 15, max: 18 },
    'thin-film': { min: 10, max: 15 },
    bifacial: { min: 19, max: 24 },
    heterojunction: { min: 22, max: 26 },
    perovskite: { min: 20, max: 28 },
  };

  const limit = limits[cellType];
  if (limit) {
    if (eficiencia < limit.min) return `Eficiência muito baixa para ${cellType}`;
    if (eficiencia > limit.max) return `Eficiência muito alta para ${cellType}`;
  }
  return null;
};

export const validateVoltageCurrent = (voc: number, isc: number, nominalPower: number) => {
  const expectedVoc = nominalPower * 0.6; // Aproximação
  const expectedIsc = nominalPower / expectedVoc;

  if (voc < expectedVoc * 0.7 || voc > expectedVoc * 1.3) {
    return `Tensão VOC fora do esperado para potência de ${nominalPower}Wp`;
  }

  if (isc < expectedIsc * 0.7 || isc > expectedIsc * 1.3) {
    return `Corrente ISC fora do esperado para potência de ${nominalPower}Wp`;
  }

  return null;
};

export const validateDimensions = (widthMm: number, heightMm: number, areaM2: number) => {
  const calculatedArea = (widthMm * heightMm) / 1000000; // Converter mm² para m²
  
  if (Math.abs(calculatedArea - areaM2) > 0.1) {
    return 'Área calculada não corresponde à área informada';
  }

  if (widthMm < 500 || widthMm > 2500) {
    return 'Largura fora do padrão comercial';
  }

  if (heightMm < 500 || heightMm > 2500) {
    return 'Altura fora do padrão comercial';
  }

  return null;
};

export const validateVoltageCompatibility = (
  moduleVoc: number,
  inverterMaxDcVoltage: number,
  temperature: number = 25
): string | null => {
  // Ajuste da tensão VOC baseado na temperatura (coeficiente típico de -0.3%/°C)
  const tempCoefficient = -0.003; // -0.3% por °C
  const tempDiff = temperature - 25; // Diferença em relação à temperatura padrão
  const adjustedVoc = moduleVoc * (1 + (tempCoefficient * tempDiff));
  
  // Verificar se a tensão ajustada excede o máximo do inversor
  if (adjustedVoc > inverterMaxDcVoltage) {
    return `Tensão VOC ajustada (${adjustedVoc.toFixed(1)}V) excede o máximo do inversor (${inverterMaxDcVoltage}V)`;
  }
  
  // Verificar margem de segurança (recomendado 15% abaixo do máximo)
  const safetyMargin = inverterMaxDcVoltage * 0.85;
  if (adjustedVoc > safetyMargin) {
    return `Tensão VOC muito próxima do limite máximo do inversor. Recomendado manter abaixo de ${safetyMargin.toFixed(0)}V`;
  }
  
  return null;
};