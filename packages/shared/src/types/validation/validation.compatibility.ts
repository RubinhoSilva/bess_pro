/**
 * Compatibility validation types for equipment matching
 */

export interface EnvironmentalTemperatureRange {
  readonly min: number; // °C
  readonly max: number; // °C
  readonly optimal: {
    readonly min: number;
    readonly max: number;
  };
}

export interface VoltageRange {
  readonly min: number; // V
  readonly max: number; // V
  readonly nominal: number; // V
}

export interface CurrentRange {
  readonly min: number; // A
  readonly max: number; // A
  readonly nominal: number; // A
}

export interface PowerMatching {
  readonly modulePower: number; // Wp
  readonly inverterPower: number; // W
  readonly ratio: number; // module power / inverter power
  readonly isOptimal: boolean;
  readonly recommendation: string;
}

export interface VoltageCompatibility {
  readonly moduleVoc: number; // V
  readonly moduleVmp: number; // V
  readonly inverterMaxVoltage: number; // V
  readonly inverterMppVoltage: VoltageRange;
  readonly strings: {
    readonly maxModulesPerString: number;
    readonly minModulesPerString: number;
    readonly recommendedModulesPerString: number;
  };
}

export interface CurrentCompatibility {
  readonly moduleIsc: number; // A
  readonly moduleImp: number; // A
  readonly inverterMaxInputCurrent: number; // A
  readonly inverterMppCurrent: number; // A
  readonly maxStringsPerMpp: number;
  readonly recommendedStrings: number;
}

export interface PhysicalCompatibility {
  readonly moduleDimensions: {
    readonly width: number; // mm
    readonly height: number; // mm
    readonly weight: number; // kg
  };
  readonly availableSpace: number; // m²
  readonly requiredSpace: number; // m²
  readonly mountingCompatibility: string[];
  readonly windLoad: {
    readonly required: number;
    readonly supported: number;
  };
}

export interface EnvironmentalCompatibility {
  readonly temperatureRange: EnvironmentalTemperatureRange;
  readonly humidityRange: {
    readonly min: number; // %
    readonly max: number; // %
  };
  readonly altitude: {
    readonly min: number; // m
    readonly max: number; // m
  };
  readonly ipRating: {
    readonly required: string;
    readonly provided: string;
  };
}