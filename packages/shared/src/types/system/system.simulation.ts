/**
 * System simulation types for performance modeling and analysis
 */

export interface SimulationParameters {
  readonly timeRange: {
    readonly start: Date;
    readonly end: Date;
    readonly interval: 'hourly' | 'daily' | 'monthly';
  };
  readonly weatherData: {
    readonly irradiance: number[];
    readonly temperature: number[];
    readonly windSpeed: number[];
  };
  readonly systemConfiguration: {
    readonly moduleCount: number;
    readonly inverterCount: number;
    readonly tilt: number;
    readonly azimuth: number;
    readonly shading: number; // percentage
  };
}

export interface SimulationResult {
  readonly id: string;
  readonly parameters: SimulationParameters;
  readonly energyProduction: {
    readonly dcPower: number[];
    readonly acPower: number[];
    readonly efficiency: number[];
    readonly losses: {
      readonly temperature: number[];
      readonly shading: number[];
      readonly mismatch: number[];
      readonly wiring: number[];
    };
  };
  readonly performance: {
    readonly specificProduction: number; // kWh/kWp
    readonly performanceRatio: number;
    readonly capacityFactor: number;
  };
  readonly financial: {
    readonly energyValue: number;
    readonly savings: number;
    readonly co2Avoided: number; // kg
  };
  readonly simulatedAt: Date;
  readonly simulationEngine: string;
}

export interface PerformanceAnalysis {
  readonly bestDay: {
    readonly date: Date;
    readonly production: number;
    readonly efficiency: number;
  };
  readonly worstDay: {
    readonly date: Date;
    readonly production: number;
    readonly efficiency: number;
  };
  readonly monthlyAverages: Array<{
    readonly month: number;
    readonly production: number;
    readonly efficiency: number;
  }>;
  readonly seasonalVariation: {
    readonly summer: number;
    readonly winter: number;
    readonly variation: number; // percentage
  };
}

export interface WhatIfScenario {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly changes: {
    readonly parameter: string;
    readonly originalValue: number;
    readonly newValue: number;
  }[];
  readonly impact: {
    readonly energyChange: number; // percentage
    readonly financialChange: number; // percentage
    readonly paybackChange: number; // years
  };
  readonly recommendation: 'adopt' | 'consider' | 'reject';
}