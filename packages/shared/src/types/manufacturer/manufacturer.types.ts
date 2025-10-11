/**
 * Manufacturer types for equipment manufacturers
 */

import { BaseEntity, Status } from '../common';

export interface Manufacturer extends BaseEntity {
  readonly name: string;
  readonly description?: string;
  readonly website?: string;
  readonly contact: ManufacturerContact;
  readonly business: ManufacturerBusiness;
  readonly certifications: string[];
  readonly metadata: ManufacturerMetadata;
  readonly status: Status;
}

export interface ManufacturerContact {
  readonly email?: string;
  readonly phone?: string;
  readonly address?: ManufacturerAddress;
  readonly supportEmail?: string;
  readonly supportPhone?: string;
}

export interface ManufacturerAddress {
  readonly street?: string;
  readonly city?: string;
  readonly state?: string;
  readonly country?: string;
  readonly postalCode?: string;
  readonly coordinates?: {
    readonly latitude: number;
    readonly longitude: number;
  };
}

export interface ManufacturerBusiness {
  readonly foundedYear?: number;
  readonly headquarters?: string;
  readonly employeeCount?: number;
  readonly revenue?: number;
  readonly stockTicker?: string;
  readonly parentCompany?: string;
  readonly subsidiaries?: string[];
}

export interface ManufacturerMetadata {
  readonly logoUrl?: string;
  readonly imageUrl?: string;
  readonly brochureUrl?: string;
  readonly socialMedia?: {
    readonly linkedin?: string;
    readonly twitter?: string;
    readonly facebook?: string;
    readonly youtube?: string;
  };
  readonly specialties: string[];
  readonly markets: string[];
  readonly qualityStandards: string[];
}