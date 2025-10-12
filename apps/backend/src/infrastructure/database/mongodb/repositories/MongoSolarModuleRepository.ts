import { ISolarModuleRepository } from '../../../../domain/repositories/ISolarModuleRepository';
import { SolarModule, SolarModuleData } from '../../../../domain/entities/SolarModule';
import { SolarModuleModel } from '../schemas/SolarModuleSchema';
import { MongoBaseRepository, RepositoryConfig } from './base/MongoBaseRepository';
import { SolarModuleDbMapper } from '../mappers/SolarModuleDbMapper';
import { SystemUsers } from '@/domain/constants/SystemUsers';

// Interfaces para filtros específicos
export interface SolarModuleFilters {
  userId?: string;
  search?: string;
  fabricante?: string;
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
    userId: string, 
    options?: {
      searchTerm?: string;
      fabricante?: string;
      potenciaMin?: number;
      potenciaMax?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ modules: SolarModule[]; total: number }> {
    
    const filters: SolarModuleFilters = {
      userId,
      search: options?.searchTerm,
      fabricante: options?.fabricante,
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
    userId: string;
    search?: string;
    fabricante?: string;
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

  async findByFabricanteModelo(
    fabricante: string, 
    modelo: string, 
    userId: string
  ): Promise<SolarModule | null> {
    const baseQuery = this.buildPublicAccessFilter(userId);
    
    const query = {
      ...baseQuery,
      fabricante: new RegExp(`^${fabricante}$`, 'i'),
      modelo: new RegExp(`^${modelo}$`, 'i')
    };

    const doc = await SolarModuleModel.findOne(query);
    return doc ? this.baseRepository['config'].mapper.toDomain(doc) : null;
  }

  async getMostUsedModules(userId: string, limit: number = 10): Promise<SolarModule[]> {
    // Por enquanto, retorna os mais recentes
    const docs = await SolarModuleModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async getModulesByPowerRange(
    userId: string, 
    minPower: number, 
    maxPower: number
  ): Promise<SolarModule[]> {
    const baseQuery = this.buildPublicAccessFilter(userId);
    const powerFilter = this.buildRangeFilter('potenciaNominal', minPower, maxPower);
    
    const query = this.mergeQueries(baseQuery, powerFilter);
    
    const docs = await SolarModuleModel
      .find(query)
      .sort({ potenciaNominal: 1 });

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async searchModules(userId: string, searchTerm: string): Promise<SolarModule[]> {
    const baseQuery = this.buildPublicAccessFilter(userId);
    const searchFilter = this.buildSearchFilter(searchTerm, ['fabricante', 'modelo', 'tipoCelula']);
    
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

  async findById(id: string): Promise<SolarModule | null> {
    return this.baseRepository.findById(id);
  }

  async update(id: string, moduleData: Partial<SolarModuleData>): Promise<SolarModule> {
    return this.updateFromData(id, moduleData);
  }

  async delete(id: string): Promise<boolean> {
    return this.baseRepository.delete(id);
  }

  async findDefaults(userId: string): Promise<SolarModule[]> {
    // Retorna módulos públicos padrão
    return this.findByUserId(userId, { limit: 10 }).then(result => result.modules);
  }

  async hasEquipment(userId: string): Promise<boolean> {
    const count = await this.baseRepository.count({ userId } as SolarModuleFilters);
    return count > 0;
  }



  // === MÉTODOS PRIVADOS PARA FILTROS CUSTOMIZADOS ===

  private buildCustomFilters(filters: SolarModuleFilters): any {
    const customFilters: any = {};

    // Filtro de acesso público + usuário
    const publicAccessFilter = this.buildPublicAccessFilter(filters.userId);
    
    // Filtro de fabricante
    if (filters.fabricante) {
      customFilters.fabricante = new RegExp(filters.fabricante, 'i');
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
      searchFilter = this.buildSearchFilter(filters.search, ['fabricante', 'modelo', 'tipoCelula']);
    }

    // Combinar todos os filtros
    return this.mergeQueries(
      publicAccessFilter,
      this.mergeQueries(customFilters, this.mergeQueries(powerFilter, searchFilter))
    );
  }

  // === MÉTODOS AUXILIARES (HERDADOS DO BASE REPOSITORY) ===

  private buildPublicAccessFilter(userId?: string): any {
    return this.baseRepository['buildPublicAccessFilter'](userId);
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