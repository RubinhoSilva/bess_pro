import { CompanyProfile } from "../entities/CompanyProfile";
import { ISoftDeleteRepository } from "./IBaseRepository";

export interface ICompanyProfileRepository extends ISoftDeleteRepository<CompanyProfile, string> {
  create(companyProfile: CompanyProfile): Promise<CompanyProfile>;
  findById(id: string): Promise<CompanyProfile | null>;
  findByCompanyName(companyName: string): Promise<CompanyProfile | null>;
  findByTaxId(taxId: string): Promise<CompanyProfile | null>;
  findByEmail(email: string): Promise<CompanyProfile | null>;
  findByTeamId(teamId: string): Promise<CompanyProfile | null>;
  update(companyProfile: CompanyProfile): Promise<CompanyProfile>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByTaxId(taxId: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}