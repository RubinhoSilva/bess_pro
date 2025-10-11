import { SolarModule } from './module.types';

// ============= MODULE SELECTION TYPES =============

export interface SelectedModule {
  readonly module: SolarModule;
  readonly quantity: number;
  readonly selectedAt: Date;
  readonly observations?: string;
}