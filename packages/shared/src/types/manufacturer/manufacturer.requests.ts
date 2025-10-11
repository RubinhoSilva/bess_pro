/**
 * Manufacturer request/response types for API operations
 */

export interface CreateManufacturerRequest {
  readonly name: string;
  readonly description?: string;
  readonly website?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: {
    readonly street?: string;
    readonly city?: string;
    readonly state?: string;
    readonly country?: string;
    readonly postalCode?: string;
  };
  readonly foundedYear?: number;
  readonly headquarters?: string;
  readonly specialties?: string[];
  readonly markets?: string[];
  readonly certifications?: string[];
  readonly logoUrl?: string;
  readonly imageUrl?: string;
  readonly supportEmail?: string;
  readonly supportPhone?: string;
}

export interface UpdateManufacturerRequest {
  readonly name?: string;
  readonly description?: string;
  readonly website?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: {
    readonly street?: string;
    readonly city?: string;
    readonly state?: string;
    readonly country?: string;
    readonly postalCode?: string;
  };
  readonly foundedYear?: number;
  readonly headquarters?: string;
  readonly specialties?: string[];
  readonly markets?: string[];
  readonly certifications?: string[];
  readonly logoUrl?: string;
  readonly imageUrl?: string;
  readonly supportEmail?: string;
  readonly supportPhone?: string;
  readonly status?: 'active' | 'inactive';
}