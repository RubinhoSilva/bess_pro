import { Inverter, InverterData } from '../entities/Inverter';

export interface IInverterRepository {
  create(inverterData: InverterData): Promise<Inverter>;
  findById(id: string): Promise<Inverter | null>;
  findByUserId(userId: string, options?: {
    searchTerm?: string;
    fabricante?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    tipoRede?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    inverters: Inverter[];
    total: number;
  }>;
  update(id: string, updates: Partial<InverterData>): Promise<Inverter>;
  delete(id: string): Promise<boolean>;
  findByFabricanteModelo(fabricante: string, modelo: string, userId: string): Promise<Inverter | null>;
  
  // Método de busca avançada
  findByFilters(filters: {
    userId?: string;
    search?: string;
    fabricante?: string;
    tipoRede?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{
    inverters: Inverter[];
    total: number;
  }>;
  
  // Métodos para análise e compatibilidade
  getMostUsedInverters(userId: string, limit?: number): Promise<Inverter[]>;
  getInvertersByPowerRange(userId: string, minPower: number, maxPower: number): Promise<Inverter[]>;
  getCompatibleInverters(userId: string, modulePower: number, totalModules: number): Promise<Inverter[]>;
  searchInverters(userId: string, searchTerm: string): Promise<Inverter[]>;
  getInvertersByPhaseType(userId: string, phaseType: 'monofásico' | 'bifásico' | 'trifásico'): Promise<Inverter[]>;
}