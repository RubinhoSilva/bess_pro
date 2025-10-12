import { BaseEntity, Status } from '../common';
import { Manufacturer } from '../manufacturer';

// ============= SOLAR MODULE TYPES =============

export interface SolarModule extends BaseEntity {
  readonly manufacturer: Manufacturer;
  readonly model: string;
  readonly nominalPower: number; // Wp
  readonly specifications: ModuleSpecifications;
  readonly parameters: ModuleParameters;
  readonly dimensions: ModuleDimensions;
  readonly metadata: ModuleMetadata;
  readonly status: Status;
  readonly isPublic: boolean; // Se é público (não pode ser alterado/removido)
}

export type CellType = 'monocrystalline' | 'polycrystalline' | 'thin-film' | 'bifacial' | 'heterojunction' | 'perovskite' | 'cdte' | 'cis' | 'cigs';

export type CellTechnology = 'perc' | 'hjt' | 'topcon' | 'ibc' | 'shj' | 'half-cut' | 'multi-busbar' | 'tandem';

export interface ModuleSpecifications {
  readonly vmpp?: number; // Voltage at maximum power point (V)
  readonly impp?: number; // Current at maximum power point (A)
  readonly voc: number; // Open circuit voltage (V)
  readonly isc: number; // Short circuit current (A)
  readonly efficiency: number; // Efficiency (%)
  readonly cellType: CellType; // Tipo de célula solar
  readonly numberOfCells?: number; // Number of cells
  readonly technology: CellTechnology; // Tecnologia da célula
}

export interface ModuleParameters {
  readonly temperature: TemperatureCoefficients;
  readonly diode: DiodeParameters;
  readonly sapm: SAPMParameters;
  readonly spectral: SpectralParameters;
  readonly advanced: AdvancedModuleParameters;
}

export interface TemperatureCoefficients {
  readonly tempCoeffPmax: number; // Temperature coefficient of power (%/°C)
  readonly tempCoeffVoc: number; // Temperature coefficient of Voc (%/°C)
  readonly tempCoeffIsc: number; // Temperature coefficient of Isc (%/°C)
}

export interface DiodeParameters {
  readonly aRef: number; // Diode ideality factor
  readonly iLRef: number; // Light current at reference conditions (A)
  readonly iORef: number; // Diode saturation current (A)
  readonly rShRef: number; // Shunt resistance at reference (Ω)
  readonly rS: number; // Series resistance (Ω)
}

export interface SAPMParameters {
  readonly a4?: number; // SAPM model coefficient
  readonly a3?: number;
  readonly a2?: number;
  readonly a1?: number;
  readonly a0?: number;
  readonly b4?: number;
  readonly b3?: number;
  readonly b2?: number;
  readonly b1?: number;
  readonly b0?: number;
  readonly fd?: number; // Diffusion factor
}

export interface SpectralParameters {
  readonly am?: number; // Air mass
  readonly spectralResponse?: number[]; // Spectral response
  readonly material?: string; // Material da célula (c-Si, a-Si, CdTe, etc.)
  readonly technology?: string; // Tecnologia (mono-Si, mc-Si, a-Si, CdTe, etc.)
}

export interface AdvancedModuleParameters {
  // Coeficientes de temperatura críticos
  readonly alphaSc?: number; // Coef. temperatura corrente [A/°C]
  readonly betaOc?: number; // Coef. temperatura tensão [V/°C]
  readonly gammaR?: number; // Coef. temperatura potência [1/°C]
}

export interface ModuleDimensions {
  readonly widthMm: number; // Width in mm
  readonly heightMm: number; // Height in mm
  readonly thicknessMm: number; // Thickness in mm
  readonly weightKg: number; // Weight in kg
  readonly areaM2: number; // Area in m² (calculated)
}

export interface ModuleMetadata {
  readonly price?: number; // Unit price
  readonly currency?: string; // Price currency
  readonly manufacturerId?: string; // Manufacturer ID
  readonly productCode?: string; // Product code
  readonly datasheetUrl?: string; // Datasheet URL
  readonly imageUrl?: string; // Image URL
  readonly certifications: string[]; // Certifications
  readonly warranty: number; // Warranty in years
  readonly countryOfOrigin?: string; // Country of origin
  readonly assuranceYears?: number; // Performance assurance in years
  readonly tolerance?: string; // ex: '+3/-0%'
  readonly userId?: string; // User ID for ownership
}