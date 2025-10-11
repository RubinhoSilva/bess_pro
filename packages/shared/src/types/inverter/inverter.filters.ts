import { Status } from '../common';

// ============= INVERTER FILTERS =============

export interface InverterFilters {
  manufacturer?: string;
  model?: string;
  minPower?: number;
  maxPower?: number;
  gridType?: 'on-grid' | 'off-grid' | 'hybrid';
  minMppts?: number;
  minEfficiency?: number;
  minPrice?: number;
  maxPrice?: number;
  manufacturerId?: string;
  status?: Status;
  searchTerm?: string;
}