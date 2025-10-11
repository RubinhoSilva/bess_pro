/**
 * Manufacturer filter types
 */

export interface ManufacturerFilters {
  readonly search?: string;
  readonly country?: string;
  readonly specialties?: string[];
  readonly markets?: string[];
  readonly certifications?: string[];
  readonly foundedYearRange?: {
    readonly min?: number;
    readonly max?: number;
  };
  readonly hasWebsite?: boolean;
  readonly hasSupport?: boolean;
  readonly status?: 'active' | 'inactive' | 'all';
}