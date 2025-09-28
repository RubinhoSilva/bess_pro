import { ManufacturerType } from "@/domain/entities/Manufacturer";

export interface UpdateManufacturerCommand {
  id: string;
  name?: string;
  type?: ManufacturerType;
  description?: string;
  website?: string;
  country?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
}