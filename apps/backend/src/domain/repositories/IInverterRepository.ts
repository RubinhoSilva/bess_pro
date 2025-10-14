import { Inverter, InverterData } from '../entities/Inverter';

export interface IInverterRepository {
  create(inverterData: InverterData): Promise<Inverter>;
  findById(id: string): Promise<Inverter | null>;
  findByTeamId(teamId: string, options?: {
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
  findByManufacturerIdAndModel(manufacturerId: string, modelo: string, teamId: string): Promise<Inverter | null>;
  
  // Método de busca avançada
  findByFilters(filters: {
    teamId?: string;
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
  getMostUsedInverters(teamId: string, limit?: number): Promise<Inverter[]>;
  getInvertersByPowerRange(teamId: string, minPower: number, maxPower: number): Promise<Inverter[]>;
  getCompatibleInverters(teamId: string, modulePower: number, totalModules: number): Promise<Inverter[]>;
  searchInverters(teamId: string, searchTerm: string): Promise<Inverter[]>;
  getInvertersByPhaseType(teamId: string, phaseType: 'monofásico' | 'bifásico' | 'trifásico'): Promise<Inverter[]>;
}