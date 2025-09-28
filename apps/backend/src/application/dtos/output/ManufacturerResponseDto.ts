import { ManufacturerType } from "@/domain/entities/Manufacturer";

export interface ManufacturerResponseDto {
  id: string;
  name: string;
  type: ManufacturerType;
  teamId?: string;
  isDefault: boolean;
  description?: string;
  website?: string;
  country?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
  createdAt: Date;
  updatedAt: Date;
}