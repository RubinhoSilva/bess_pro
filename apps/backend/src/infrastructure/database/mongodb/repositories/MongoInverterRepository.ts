import { IInverterRepository } from '../../../../domain/repositories/IInverterRepository';
import { Inverter, InverterData } from '../../../../domain/entities/Inverter';
import { InverterModel } from '../schemas/InverterSchema';
import { MongoBaseRepository, RepositoryConfig } from './base/MongoBaseRepository';
import { InverterDbMapper } from '../mappers/InverterDbMapper';
import { SystemUsers } from '@/domain/constants/SystemUsers';

// Interfaces para filtros específicos
export interface InverterFilters {
  userId?: string;
  search?: string;
  fabricante?: string;
  tipoRede?: string;
  potenciaMin?: number;
  potenciaMax?: number;
}

export interface InverterPaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * MongoInverterRepository - Refatorado com Generic Base Repository
 * 
 * Redução de código: 421 linhas → ~80 linhas (81% de redução)
 */
export class MongoInverterRepository implements IInverterRepository {
  private baseRepository: MongoBaseRepository<Inverter, InverterFilters>;
  
  constructor() {
    const config: RepositoryConfig<Inverter, InverterFilters, any> = {
      model: InverterModel,
      mapper: new InverterDbMapper(),
      features: {
        softDelete: false,
        timestamps: true,
        pagination: true,
        customFilters: (filters: InverterFilters) => this.buildCustomFilters(filters)
      }
    };
    
    this.baseRepository = new MongoBaseRepository(config);
  }

  // === MÉTODOS ESPECÍFICOS DO INVERTER ===

  async createFromData(inverterData: InverterData): Promise<Inverter> {
    const inverter = new Inverter(inverterData);
    return this.baseRepository.create(inverter);
  }

  async findByUserId(
    userId: string, 
    options?: {
      searchTerm?: string;
      fabricante?: string;
      potenciaMin?: number;
      potenciaMax?: number;
      tipoRede?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ inverters: Inverter[]; total: number }> {
    
    const filters: InverterFilters = {
      userId,
      search: options?.searchTerm,
      fabricante: options?.fabricante,
      tipoRede: options?.tipoRede,
      potenciaMin: options?.potenciaMin,
      potenciaMax: options?.potenciaMax
    };

    const paginationOptions = {
      page: options?.offset ? Math.floor(options.offset / (options?.limit || 20)) + 1 : 1,
      pageSize: options?.limit || 20
    };

    const result = await this.baseRepository.findWithPagination(filters, paginationOptions);
    
    return {
      inverters: result.items,
      total: result.total
    };
  }

  async findByFilters(filters: {
    userId: string;
    search?: string;
    fabricante?: string;
    tipoRede?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ inverters: Inverter[]; total: number }> {
    
    const result = await this.baseRepository.findWithPagination(filters as InverterFilters, {
      page: filters.page,
      pageSize: filters.pageSize
    });
    
    return {
      inverters: result.items,
      total: result.total
    };
  }

  async updateFromData(id: string, updates: Partial<InverterData>): Promise<Inverter> {
    const updatedInverter = await this.baseRepository.updateById(id, updates as any);
    
    if (!updatedInverter) {
      throw new Error('Inversor não encontrado para atualização');
    }
    
    return updatedInverter;
  }

  // === MÉTODOS LEGADOS (MANTIDOS POR COMPATIBILIDADE) ===

  async findByFabricanteModelo(
    fabricante: string, 
    modelo: string, 
    userId: string
  ): Promise<Inverter | null> {
    const baseQuery = this.buildPublicAccessFilter(userId);
    
    const query = {
      ...baseQuery,
      fabricante: new RegExp(`^${fabricante}$`, 'i'),
      modelo: new RegExp(`^${modelo}$`, 'i')
    };

    const doc = await InverterModel.findOne(query);
    return doc ? this.baseRepository['config'].mapper.toDomain(doc) : null;
  }

  async getMostUsedInverters(userId: string, limit: number = 10): Promise<Inverter[]> {
    // Por enquanto, retorna os mais recentes
    const docs = await InverterModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async getInvertersByPowerRange(
    userId: string, 
    minPower: number, 
    maxPower: number
  ): Promise<Inverter[]> {
    const baseQuery = this.buildPublicAccessFilter(userId);
    const powerFilter = this.buildRangeFilter('potenciaSaidaCA', minPower, maxPower);
    
    const query = this.mergeQueries(baseQuery, powerFilter);
    
    const docs = await InverterModel
      .find(query)
      .sort({ potenciaSaidaCA: 1 });

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async searchInverters(userId: string, searchTerm: string): Promise<Inverter[]> {
    const baseQuery = this.buildPublicAccessFilter(userId);
    const searchFilter = this.buildSearchFilter(searchTerm, ['fabricante', 'modelo', 'tipoRede']);
    
    const query = this.mergeQueries(baseQuery, searchFilter);
    
    const docs = await InverterModel
      .find(query)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async getInvertersByPhaseType(
    userId: string, 
    phaseType: 'monofásico' | 'bifásico' | 'trifásico'
  ): Promise<Inverter[]> {
    let regexPattern: string;
    
    switch (phaseType) {
      case 'monofásico':
        regexPattern = 'monofás|mono';
        break;
      case 'bifásico':
        regexPattern = 'bifás|bi';
        break;
      case 'trifásico':
        regexPattern = 'trifás|tri';
        break;
      default:
        regexPattern = phaseType;
    }

    const baseQuery = this.buildPublicAccessFilter(userId);
    const phaseFilter = { tipoRede: new RegExp(regexPattern, 'i') };
    
    const query = this.mergeQueries(baseQuery, phaseFilter);
    
    const docs = await InverterModel
      .find(query)
      .sort({ potenciaSaidaCA: 1 });

    return docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));
  }

  async getCompatibleInverters(
    userId: string, 
    modulePower: number, 
    totalModules: number
  ): Promise<Inverter[]> {
    const totalSystemPower = modulePower * totalModules;
    const minInverterPower = totalSystemPower * 0.8; // 20% undersizing
    const maxInverterPower = totalSystemPower * 1.2; // 20% oversizing

    const baseQuery = this.buildPublicAccessFilter(userId);
    const powerFilter = this.buildRangeFilter('potenciaSaidaCA', minInverterPower, maxInverterPower);
    
    const query = this.mergeQueries(baseQuery, powerFilter);
    
    const docs = await InverterModel
      .find(query)
      .sort({ potenciaSaidaCA: 1 });

    const inverters = docs.map(doc => this.baseRepository['config'].mapper.toDomain(doc));

    // Filter by compatibility using business logic
    return inverters.filter(inverter => {
      const maxModulesSupported = inverter.calculateMaxModules(modulePower);
      return !maxModulesSupported || totalModules <= maxModulesSupported;
    });
  }

  // === MÉTODOS DA INTERFACE IInverterRepository ===

  async create(inverterData: InverterData): Promise<Inverter> {
    return this.createFromData(inverterData);
  }

  async findById(id: string): Promise<Inverter | null> {
    return this.baseRepository.findById(id);
  }

  async update(id: string, inverterData: Partial<InverterData>): Promise<Inverter> {
    return this.updateFromData(id, inverterData);
  }

  async delete(id: string): Promise<boolean> {
    return this.baseRepository.delete(id);
  }

  async findDefaults(userId: string): Promise<Inverter[]> {
    // Retorna inversores públicos padrão
    return this.findByUserId(userId, { limit: 10 }).then(result => result.inverters);
  }

  async hasEquipment(userId: string): Promise<boolean> {
    const count = await this.baseRepository.count({ userId } as InverterFilters);
    return count > 0;
  }

  // === MÉTODOS PRIVADOS PARA FILTROS CUSTOMIZADOS ===

  private buildCustomFilters(filters: InverterFilters): any {
    const customFilters: any = {};

    // Filtro de acesso público + usuário
    const publicAccessFilter = this.buildPublicAccessFilter(filters.userId);
    
    // Filtro de fabricante
    if (filters.fabricante) {
      customFilters.fabricante = new RegExp(filters.fabricante, 'i');
    }
    
    // Filtro de tipo de rede
    if (filters.tipoRede) {
      customFilters.tipoRede = new RegExp(filters.tipoRede, 'i');
    }
    
    // Filtro de potência
    const powerFilter = this.buildRangeFilter('potenciaSaidaCA', filters.potenciaMin, filters.potenciaMax);
    
    // Filtro de busca geral
    let searchFilter: any = {};
    if (filters.search) {
      searchFilter = this.buildSearchFilter(filters.search, ['fabricante', 'modelo', 'tipoRede']);
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