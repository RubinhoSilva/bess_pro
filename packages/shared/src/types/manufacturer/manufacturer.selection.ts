/**
 * Manufacturer selection types for UI components
 */

export interface SelectedManufacturer {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly website?: string;
  readonly logoUrl?: string;
  readonly specialties: string[];
  readonly country?: string;
  readonly foundedYear?: number;
  readonly certifications: string[];
}

export interface ManufacturerOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly country?: string;
  readonly specialties: string[];
}