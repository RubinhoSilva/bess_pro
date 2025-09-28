import { ManufacturerType } from "@/domain/entities/Manufacturer";

export interface CreateManufacturerCommand {
  name: string;
  type: ManufacturerType;
  teamId?: string;
  description?: string;
  website?: string;
  country?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
}