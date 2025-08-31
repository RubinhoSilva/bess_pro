import { api } from './api';

export interface EnergyCompany {
  id: string;
  name: string;
  acronym: string;
  region: string;
  states: string[];
  tariffB1?: number;
  tariffB3?: number;
  tariffC?: number;
  wireB?: number;
  distributionCharge?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnergyCompanyInput {
  name: string;
  acronym: string;
  region: string;
  states: string[];
  tariffB1?: number;
  tariffB3?: number;
  tariffC?: number;
  wireB?: number;
  distributionCharge?: number;
  isActive?: boolean;
}

export const energyCompanyService = {
  // Obter todas as concessionárias ativas (para usuários normais)
  async getActiveCompanies(): Promise<EnergyCompany[]> {
    const response = await api.get('/energy-companies');
    return response.data.data || [];
  },

  // Obter todas as concessionárias incluindo inativas (para admins)
  async getAllCompanies(): Promise<EnergyCompany[]> {
    const response = await api.get('/energy-companies/admin/all');
    return response.data.data || [];
  },

  // Obter concessionárias por estado
  async getCompaniesByState(state: string): Promise<EnergyCompany[]> {
    const response = await api.get(`/energy-companies/state/${state}`);
    return response.data.data || [];
  },

  // Obter concessionária por ID
  async getCompanyById(id: string): Promise<EnergyCompany> {
    const response = await api.get(`/energy-companies/${id}`);
    return response.data.data;
  },

  // Criar nova concessionária (admin apenas)
  async createCompany(data: CreateEnergyCompanyInput): Promise<EnergyCompany> {
    const response = await api.post('/energy-companies', data);
    return response.data.data;
  },

  // Atualizar concessionária (admin apenas)
  async updateCompany(id: string, data: Partial<CreateEnergyCompanyInput>): Promise<EnergyCompany> {
    const response = await api.put(`/energy-companies/${id}`, data);
    return response.data.data;
  },

  // Excluir concessionária (admin apenas)
  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/energy-companies/${id}`);
  }
};