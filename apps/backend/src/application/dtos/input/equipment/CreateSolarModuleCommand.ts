export interface CreateSolarModuleCommand {
  userId: string;
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
}