import { Manufacturer, ManufacturerType } from "../entities/Manufacturer";

export interface IManufacturerRepository {
  create(manufacturer: Manufacturer): Promise<Manufacturer>;
  findById(id: string): Promise<Manufacturer | null>;
  findByName(name: string, teamId?: string): Promise<Manufacturer | null>;
  findByType(type: ManufacturerType, teamId?: string): Promise<Manufacturer[]>;
  findAccessibleByTeam(teamId?: string): Promise<Manufacturer[]>;
  findDefaults(): Promise<Manufacturer[]>;
  update(id: string, manufacturer: Manufacturer): Promise<Manufacturer | null>;
  delete(id: string): Promise<boolean>;
  exists(name: string, excludeId?: string, teamId?: string): Promise<boolean>;
}