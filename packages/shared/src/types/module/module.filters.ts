import { Status } from '../common';

// ============= MODULE FILTERS =============

export interface ModuleFilters {
  manufacturer?: string;
  model?: string;
  minPower?: number;
  maxPower?: number;
  minEfficiency?: number;
  cellType?: string;
  technology?: string;
  minPrice?: number;
  maxPrice?: number;
  manufacturerId?: string;
  status?: Status;
  searchTerm?: string;
}