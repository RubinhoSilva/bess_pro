export interface SolarModuleResponseDto {
  id: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number; // Watts
  larguraMm?: number;
  alturaMm?: number;
  espessuraMm?: number;
  vmpp?: number; // Voltage at Maximum Power Point (V)
  impp?: number; // Current at Maximum Power Point (A)
  voc?: number; // Open Circuit Voltage (V)
  isc?: number; // Short Circuit Current (A)
  tipoCelula?: string; // ex: Monocristalino, Policristalino
  eficiencia?: number; // Percentual (%)
  numeroCelulas?: number;
  tempCoefPmax?: number; // Coeficiente de temperatura de Pmax (%/°C)
  tempCoefVoc?: number; // Coeficiente de temperatura de Voc (%/°C)
  tempCoefIsc?: number; // Coeficiente de temperatura de Isc (%/°C)
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
  
  // Campos calculados
  areaM2?: number; // Área calculada em m²
  densidadePotencia?: number; // W/m²
  
  createdAt: string;
  updatedAt: string;
}

export interface SolarModuleListResponseDto {
  modules: SolarModuleResponseDto[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}