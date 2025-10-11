// ============= SYSTEM CONSTRAINTS TYPES =============

export interface SystemConstraints {
  readonly maxSystemVoltage: number; // V
  readonly maxSystemCurrent: number; // A
  readonly maxPowerPerString: number; // W
  readonly maxModulesPerString: number;
  readonly maxStringsPerMppt: number;
  readonly temperatureRange: SystemTemperatureRange;
  readonly safetyRequirements: SafetyRequirements;
  readonly regionalRequirements: RegionalRequirements;
}

export interface SystemTemperatureRange {
  readonly min: number; // °C
  readonly max: number; // °C
}

export interface SafetyRequirements {
  readonly windLoad: number; // N/m²
  readonly snowLoad: number; // kg/m²
  readonly seismicZone: string;
  readonly fireRating: string;
  readonly temperatureRange: SystemTemperatureRange;
}

export interface RegionalRequirements {
  readonly country: string;
  readonly standards: string[];
  readonly gridCode: string;
  readonly requiredCertifications: string[];
  readonly localRestrictions: string[];
}