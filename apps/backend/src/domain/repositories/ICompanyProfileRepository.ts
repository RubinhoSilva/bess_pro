import { CompanyProfile } from "../entities/CompanyProfile";
import { ISoftDeleteRepository } from "./IBaseRepository";

export interface ICompanyProfileRepository extends ISoftDeleteRepository<CompanyProfile, string> {
  create(companyProfile: CompanyProfile): Promise<CompanyProfile>;
  findById(id: string): Promise<CompanyProfile | null>;
  findByCompanyName(companyName: string): Promise<CompanyProfile | null>;
  findByTaxId(taxId: string): Promise<CompanyProfile | null>;
  findByEmail(email: string): Promise<CompanyProfile | null>;
  findAll(activeOnly?: boolean): Promise<CompanyProfile[]>;
  findWithPagination(page: number, pageSize: number, activeOnly?: boolean): Promise<{
    companyProfiles: CompanyProfile[];
    total: number;
    totalPages: number;
  }>;
  update(companyProfile: CompanyProfile): Promise<CompanyProfile>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  search(searchTerm: string, activeOnly?: boolean): Promise<CompanyProfile[]>;
  searchWithPagination(searchTerm: string, page: number, pageSize: number, activeOnly?: boolean): Promise<{
    companyProfiles: CompanyProfile[];
    total: number;
    totalPages: number;
  }>;
  exists(id: string): Promise<boolean>;
  existsByTaxId(taxId: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  count(activeOnly?: boolean): Promise<number>;
}