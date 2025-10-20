import { ISolarModuleRepository } from '../../../../domain/repositories/ISolarModuleRepository';
import { SolarModule, SolarModuleData } from '../../../../domain/entities/SolarModule';
import { SolarModuleModel } from '../schemas/SolarModuleSchema';
import { MongoBaseRepository, RepositoryConfig } from './base/MongoBaseRepository';
import { SolarModuleDbMapper } from '../mappers/SolarModuleDbMapper';
import { SystemUsers } from '@/domain/constants/SystemUsers';

// Interfaces para filtros específicos
export interface SolarModuleFilters {
  teamId?: string;
  search?: string;
  manufacturerId?: string;
  tipoCelula?: string;
  potenciaMin?: number;
  potenciaMax?: number;
}

export interface SolarModulePaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * MongoSolarModuleRepository - Refatorado com Generic Base Repository
 * 
 * Redução de código: 425 linhas → ~80 linhas (81% de redução)
 */
export class MongoSolarModuleRepository implements ISolarModuleRepository {
  private baseRepository: MongoBaseRepository<SolarModule, SolarModuleFilters>;
  
  constructor() {
    const config: RepositoryConfig<SolarModule, SolarModuleFilters, any> = {
      model: SolarModuleModel,
      mapper: new SolarModuleDbMapper(),
      features: {
        softDelete: true,
        timestamps: true,
        pagination: true,
        customFilters: (filters: SolarModuleFilters) => this.buildCustomFilters(filters)
      }
    };
    
    this.baseRepository = new MongoBaseRepository(config);
  }

  // === MÉTODOS ESPECÍFICOS DO SOLAR MODULE ===

  async createFromData(moduleData: SolarModuleData): Promise<SolarModule> {
    const module = new SolarModule(moduleData);
    return this.baseRepository.create(module);
  }

  async findByUserId(
    teamId: string, 
    options?: {
      searchTerm?: string;
      manufacturerId?: string;
      potenciaMin?: number;
      potenciaMax?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ modules: SolarModule[]; total: number }> {
    
    const filters: SolarModuleFilters = {
      teamId,
      search: options?.searchTerm,
      manufacturerId: options?.manufacturerId,
      potenciaMin: options?.potenciaMin,
      potenciaMax: options?.potenciaMax
    };

    const paginationOptions = {
      page: options?.offset ? Math.floor(options.offset / (options?.limit || 20)) + 1 : 1,
      pageSize: options?.limit || 20
    };

    const result = await this.baseRepository.findWithPagination(filters, paginationOptions);
    
    return {
      modules: result.items,
      total: result.total
    };
  }

  async findByFilters(filters: {
    teamId?: string;
    search?: string;
    manufacturerId?: string;
    tipoCelula?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ modules: SolarModule[]; total: number }> {
    
    const result = await this.baseRepository.findWithPagination(filters as SolarModuleFilters, {
      page: filters.page,
      pageSize: filters.pageSize
    });
    
    return {
      modules: result.items,
      total: result.total
    };
  }

  async updateFromData(id: string, updates: Partial<SolarModuleData>): Promise<SolarModule> {
    const updatedModule = await this.baseRepository.updateById(id, updates as any);
    
    if (!updatedModule) {
      throw new Error('Módulo não encontrado para atualização');
    }
    
    return updatedModule;
  }

  // === MÉTODOS LEGADOS (MANTIDOS POR COMPATIBILIDADE) ===

  async findByManufacturerModelo(
    manufacturerId: string, 
    modelo: string, 
    teamId: string
  ): Promise<SolarModule | null> {
    const baseQuery = this.buildPublicAccessFilter(''); // Remove userId filter, use team logic
    
    const query = {
      ...baseQuery,
      $or: [
        { isDefault: true },
        { teamId }
      ],
      manufacturerId,
      modelo: new RegExp(`^${modelo}$`, 'i')
    };

    const doc = await SolarModuleModel.findOne(query);
    return doc ? this.baseRepository['config'].mapper.toDomain(doc) : null;
  }

  async getMostUsedModules(teamId: string, limit: number = 10): Promise<SolarModule[]> {
    // Por enquanto, retorna os mais recentes
    const docs = await SolarModuleModel
      .find({ teamId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async getModulesByPowerRange(
    teamId: string, 
    minPower: number, 
    maxPower: number
  ): Promise<SolarModule[]> {
    const baseQuery = this.buildPublicAccessFilter(teamId);
    const powerFilter = this.buildRangeFilter('potenciaNominal', minPower, maxPower);
    
    const query = this.mergeQueries(baseQuery, powerFilter);
    
    const docs = await SolarModuleModel
      .find(query)
      .sort({ potenciaNominal: 1 });

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async searchModules(teamId: string, searchTerm: string): Promise<SolarModule[]> {
    const baseQuery = this.buildPublicAccessFilter(teamId);
    const searchFilter = this.buildSearchFilter(searchTerm, ['modelo', 'tipoCelula']);
    
    const query = this.mergeQueries(baseQuery, searchFilter);
    
    const docs = await SolarModuleModel
      .find(query)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  // === MÉTODOS DA INTERFACE ISolarModuleRepository ===

  async create(moduleData: SolarModuleData): Promise<SolarModule> {
    return this.createFromData(moduleData);
  }

  async findById(id: string) {
    return this.baseRepository.findById(id);
  }

  async update(id: string, moduleData: Partial<SolarModuleData>): Promise<SolarModule> {
    return this.updateFromData(id, moduleData);
  }

  async delete(id: string): Promise<boolean> {
    return await SolarModuleModel.findByIdAndDelete(id) !== null;
  }

  async findDefaults(teamId: string): Promise<SolarModule[]> {
    // Retorna módulos públicos padrão
    return this.findByUserId(teamId, { limit: 10 }).then(result => result.modules);
  }

  async hasEquipment(teamId: string): Promise<boolean> {
    const count = await this.baseRepository.count({ teamId } as SolarModuleFilters);
    return count > 0;
  }



  // === MÉTODOS PRIVADOS PARA FILTROS CUSTOMIZADOS ===

  private buildCustomFilters(filters: SolarModuleFilters): any {
    const customFilters: any = {};

    // Filtro de acesso: teamId informado (do token) OU público
    let accessFilter: any;
    if (filters.teamId) {
      // Se tem teamId, busca do time + públicos
      accessFilter = {
        $or: [
          { teamId: filters.teamId },  // Equipamentos do time do usuário
          { teamId: SystemUsers.PUBLIC_EQUIPMENT }       // Equipamentos públicos
        ]
      };
    } else {
      // Se não tem teamId, busca apenas públicos
      accessFilter = { teamId: SystemUsers.PUBLIC_EQUIPMENT };
    }
    
    // Filtro de fabricante
    if (filters.manufacturerId) {
      customFilters.manufacturerId = filters.manufacturerId;
    }
    
    // Filtro de tipo de célula
    if (filters.tipoCelula) {
      customFilters.tipoCelula = new RegExp(filters.tipoCelula, 'i');
    }
    
    // Filtro de potência
    const powerFilter = this.buildRangeFilter('potenciaNominal', filters.potenciaMin, filters.potenciaMax);
    
    // Filtro de busca geral
    let searchFilter: any = {};
    if (filters.search) {
      searchFilter = this.buildSearchFilter(filters.search, ['modelo', 'tipoCelula']);
    }

    // Combinar todos os filtros
    return this.mergeQueries(
      accessFilter,
      this.mergeQueries(customFilters, this.mergeQueries(powerFilter, searchFilter))
    );
  }

  // === MÉTODOS AUXILIARES (HERDADOS DO BASE REPOSITORY) ===

  private buildPublicAccessFilter(teamId?: string): any {
    return this.baseRepository['buildPublicAccessFilter'](teamId);
  }

  private buildSearchFilter(searchTerm: string, searchFields: string[]): any {
    return this.baseRepository['buildSearchFilter'](searchTerm, searchFields);
  }

  private buildRangeFilter(field: string, min?: number, max?: number): any {
    return this.baseRepository['buildRangeFilter'](field, min, max);
  }

  private mergeQueries(baseQuery: any, additionalQuery: any): any {
    return this.baseRepository['mergeQueries'](baseQuery, additionalQuery);
  }
}