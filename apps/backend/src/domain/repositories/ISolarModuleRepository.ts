import { SolarModule, SolarModuleData } from '../entities/SolarModule';

export interface ISolarModuleRepository {
  create(moduleData: SolarModuleData): Promise<SolarModule>;
  findById(id: string): Promise<SolarModule | null>;
  findByUserId(userId: string, options?: {
    searchTerm?: string;
    fabricante?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    modules: SolarModule[];
    total: number;
  }>;
  update(id: string, updates: Partial<SolarModuleData>): Promise<SolarModule>;
  delete(id: string): Promise<boolean>;
  findByFabricanteModelo(fabricante: string, modelo: string, userId: string): Promise<SolarModule | null>;
  
  // Método de busca avançada
  findByFilters(filters: {
    userId?: string;
    search?: string;
    fabricante?: string;
    tipoCelula?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{
    modules: SolarModule[];
    total: number;
  }>;
  
  // Métodos para análise e estatísticas
  getMostUsedModules(userId: string, limit?: number): Promise<SolarModule[]>;
  getModulesByPowerRange(userId: string, minPower: number, maxPower: number): Promise<SolarModule[]>;
  searchModules(userId: string, searchTerm: string): Promise<SolarModule[]>;
}