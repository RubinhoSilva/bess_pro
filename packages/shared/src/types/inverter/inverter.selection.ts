import { Inverter } from './inverter.types';

// ============= INVERTER SELECTION TYPES =============

export interface SelectedInverter {
  readonly inverter: Inverter;
  readonly quantity: number;
  readonly selectedAt: Date;
  readonly observations?: string;
}