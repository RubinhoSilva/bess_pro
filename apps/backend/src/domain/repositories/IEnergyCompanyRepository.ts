import { EnergyCompany } from '../entities/EnergyCompany';

export interface IEnergyCompanyRepository {
  create(energyCompany: Omit<EnergyCompany, 'id' | 'createdAt' | 'updatedAt'>): Promise<EnergyCompany>;
  findById(id: string): Promise<EnergyCompany | null>;
  findAll(): Promise<EnergyCompany[]>;
  findByState(state: string): Promise<EnergyCompany[]>;
  findByAcronym(acronym: string): Promise<EnergyCompany | null>;
  update(id: string, energyCompany: Partial<EnergyCompany>): Promise<EnergyCompany | null>;
  delete(id: string): Promise<boolean>;
  findActiveCompanies(): Promise<EnergyCompany[]>;
}