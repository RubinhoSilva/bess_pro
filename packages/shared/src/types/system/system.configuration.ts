import { SelectedModule } from '../module';
import { SelectedInverter } from '../inverter';

// ============= SYSTEM CONFIGURATION TYPES =============

export interface SystemConfiguration {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
  readonly modules: SelectedModule[];
  readonly inverters: SelectedInverter[];
  readonly location?: SystemLocation;
  readonly constraints?: SystemConfigurationConstraints;
  readonly calculations?: SystemConfigurationCalculations;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface SystemLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly address?: string;
  readonly city?: string;
  readonly state?: string;
  readonly country?: string;
  readonly timezone?: string;
}

export interface SystemConfigurationConstraints {
  readonly maxPower?: number; // W
  readonly maxArea?: number; // m²
  readonly maxBudget?: number; // Monetary value
  readonly maxModules?: number;
  readonly maxInverters?: number;
  readonly spatialConstraints?: SpatialConstraints;
}

export interface SpatialConstraints {
  readonly availableAreas: AvailableArea[];
  readonly shading?: ShadingData;
  readonly preferredOrientation?: number; // degrees
  readonly preferredTilt?: number; // degrees
}

export interface AvailableArea {
  readonly id: string;
  readonly name: string;
  readonly area: number; // m²
  readonly orientation: number; // degrees (0=North)
  readonly tilt: number; // degrees
  readonly shading: number; // % (0-100)
  readonly type: 'roof' | 'ground' | 'facade';
}

export interface ShadingData {
  readonly annualPercentage: number; // % annual loss
  readonly monthlyProfile?: number[]; // Monthly shading profile
  readonly hourlyProfile?: number[][]; // Hourly profile (12 months x 24 hours)
}

export interface SystemConfigurationCalculations {
  readonly totalPower: number; // W
  readonly totalArea: number; // m²
  readonly totalCost: number; // Monetary value
  readonly estimatedAnnualProduction: number; // kWh/year
  readonly capacityFactor?: number; // %
  readonly monthlyProduction?: number[]; // kWh/month
  readonly annualIrradiation?: number; // kWh/m²/year
  readonly performanceRatio?: number; // %
  readonly annualCO2Avoided?: number; // tons/year
}