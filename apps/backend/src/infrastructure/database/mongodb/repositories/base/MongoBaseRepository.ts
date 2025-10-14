import { Model, Document, Types } from 'mongoose';
import { SystemUsers } from '../../../../../domain/constants/SystemUsers';

// Interfaces genéricas para configuração
export interface RepositoryMapper<TDomain, TDocument extends Document> {
  toDomain(doc: TDocument): TDomain;
  toPersistence(entity: TDomain): Partial<TDocument>;
  toUpdate?(entity: TDomain): Partial<TDocument>;
}

export interface RepositoryConfig<TDomain, TFilters, TDocument extends Document> {
  model: Model<TDocument>;
  mapper: RepositoryMapper<TDomain, TDocument>;
  features?: {
    softDelete?: boolean;
    timestamps?: boolean;
    pagination?: boolean;
    customFilters?: (filters: TFilters) => any;
  };
  idFields?: {
    primary?: string; // '_id' por padrão
    secondary?: string; // 'domainId' para Client
  };
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Generic Base Repository Universal
 * 
 * Esta classe implementa toda a lógica comum de repositórios MongoDB,
 * eliminando 90% da duplicação de código entre repositórios.
 */
export class MongoBaseRepository<TDomain, TFilters = {}, TDocument extends Document = any> {
  protected model: Model<TDocument>;
  protected config: RepositoryConfig<TDomain, TFilters, TDocument>;

  constructor(config: RepositoryConfig<TDomain, TFilters, TDocument>) {
    this.model = config.model;
    this.config = config;
  }

  // === MÉTODOS CRUD GENÉRICOS ===

  async create(entity: TDomain): Promise<TDomain> {
    const persistenceData = this.config.mapper.toPersistence(entity);
    const doc = new this.model(persistenceData);
    const savedDoc = await doc.save();
    return this.config.mapper.toDomain(savedDoc);
  }

  async findById(id: string): Promise<TDomain | null> {
    const doc = await this.findOneById(id);
    return doc ? this.config.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<TDomain[]> {
    const query = this.buildBaseQuery();
    const docs = await this.model.find(query);
    return docs.map(doc => this.config.mapper.toDomain(doc));
  }

  async update(entity: TDomain): Promise<TDomain> {
    const updateData = this.config.mapper.toUpdate 
      ? this.config.mapper.toUpdate(entity)
      : this.config.mapper.toPersistence(entity);
    
    const updatedDoc = await this.model.findByIdAndUpdate(
      this.getId(entity),
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error(`${this.getEntityName()} não encontrado para atualização`);
    }

    return this.config.mapper.toDomain(updatedDoc);
  }

  async updateById(id: string, updates: Partial<TDomain>): Promise<TDomain | null> {
    const persistenceData = updates as any;
    
    if (this.config.features?.timestamps) {
      persistenceData.updatedAt = new Date();
    }
    
    const query = this.buildIdQuery(id);
    const baseQuery = this.config.features?.softDelete 
      ? { ...query, ...this.getSoftDeleteQuery() }
      : query;

    console.log('MongoBaseRepository.updateById - id:', id);
    console.log('MongoBaseRepository.updateById - baseQuery:', JSON.stringify(baseQuery, null, 2));
    console.log('MongoBaseRepository.updateById - persistenceData:', JSON.stringify(persistenceData, null, 2));

    const updatedDoc = await this.model.findOneAndUpdate(
      baseQuery,
      persistenceData,
      { new: true, runValidators: true }
    );
    
    console.log('MongoBaseRepository.updateById - updatedDoc:', updatedDoc);

    return updatedDoc ? this.config.mapper.toDomain(updatedDoc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (this.config.features?.softDelete) {
      return this.softDelete(id);
    } else {
      return this.hardDelete(id);
    }
  }

  async softDelete(id: string): Promise<boolean> {
    const query = this.buildIdQuery(id);
    const baseQuery = { ...query, ...this.getSoftDeleteQuery() };

    const result = await this.model.findOneAndUpdate(
      baseQuery,
      {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    const query = this.buildIdQuery(id);
    const result = await this.model.findOneAndDelete(query);
    return !!result;
  }

  // === MÉTODOS DE PAGINAÇÃO ===

  async findWithPagination(
    filters: TFilters = {} as TFilters,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<TDomain>> {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * pageSize;

    const query = this.buildQuery(filters);
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [docs, total] = await Promise.all([
      this.model.find(query).sort(sort).skip(skip).limit(pageSize),
      this.model.countDocuments(query)
    ]);

    const items = docs.map(doc => this.config.mapper.toDomain(doc));
    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  // === MÉTODOS DE CONSULTA ===

  async count(filters: TFilters = {} as TFilters): Promise<number> {
    const query = this.buildQuery(filters);
    return this.model.countDocuments(query);
  }

  async exists(id: string): Promise<boolean> {
    const query = this.buildIdQuery(id);
    const baseQuery = this.config.features?.softDelete 
      ? { ...query, ...this.getSoftDeleteQuery() }
      : query;

    const doc = await this.model.findOne(baseQuery);
    return !!doc;
  }

  // === MÉTODOS PROTEGIDOS PARA CUSTOMIZAÇÃO ===

  protected async findOneById(id: string): Promise<TDocument | null> {
    const query = this.buildIdQuery(id);
    const baseQuery = this.config.features?.softDelete 
      ? { ...query, ...this.getSoftDeleteQuery() }
      : query;
    
    return await this.model.findOne(baseQuery);
  }

  protected buildQuery(filters: TFilters): any {
    let query: any = this.buildBaseQuery();

    // Aplicar filtros customizados
    if (this.config.features?.customFilters) {
      const customFilters = this.config.features.customFilters(filters);
      query = this.mergeQueries(query, customFilters);
    }

    return query;
  }

  protected buildBaseQuery(): any {
    return this.config.features?.softDelete 
      ? { ...this.getSoftDeleteQuery() }
      : {};
  }

  protected buildIdQuery(id: string): any {
    if (!this.config.idFields) {
      return { _id: this.isValidObjectId(id) ? id : null };
    }

    const { primary = '_id', secondary } = this.config.idFields;
    
    if (secondary) {
      const conditions = [
        { [primary]: this.isValidObjectId(id) ? id : null },
        { [secondary]: id }
      ].filter(condition => Object.values(condition)[0] !== null);

      return { $or: conditions };
    }

    return { [primary]: this.isValidObjectId(id) ? id : null };
  }

  protected getSoftDeleteQuery(): any {
    return {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    };
  }

  // === MÉTODOS AUXILIARES ===

  protected getId(entity: TDomain): string {
    return (entity as any).getId?.() || (entity as any).id;
  }

  protected isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  protected getEntityName(): string {
    return this.constructor.name.replace('Repository', '');
  }

  protected mergeQueries(baseQuery: any, additionalQuery: any): any {
    if (!baseQuery || Object.keys(baseQuery).length === 0) {
      return additionalQuery;
    }
    
    if (!additionalQuery || Object.keys(additionalQuery).length === 0) {
      return baseQuery;
    }

    // Se ambos têm $or, precisamos mesclar corretamente
    if (baseQuery.$or && additionalQuery.$or) {
      return {
        $and: [
          { $or: baseQuery.$or },
          { $or: additionalQuery.$or },
          ...Object.keys(baseQuery).filter(k => k !== '$or').map(k => ({ [k]: baseQuery[k] })),
          ...Object.keys(additionalQuery).filter(k => k !== '$or').map(k => ({ [k]: additionalQuery[k] }))
        ]
      };
    }

    return { ...baseQuery, ...additionalQuery };
  }

  // === MÉTODOS ESPECÍFICOS PARA EQUIPAMENTOS ===

  protected buildPublicAccessFilter(teamId?: string): any {
    const baseFilter: any = {
      $or: [
        { teamId: SystemUsers.PUBLIC_EQUIPMENT }
      ]
    };
    
    if (teamId) {
      baseFilter.$or.push({ teamId });
    }
    
    return baseFilter;
  }

  protected buildSearchFilter(searchTerm: string, searchFields: string[]): any {
    const searchConditions = searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }));
    
    return { $or: searchConditions };
  }

  protected buildRangeFilter(
    field: string, 
    min?: number, 
    max?: number
  ): any {
    if (min === undefined && max === undefined) return {};
    
    const rangeFilter: any = {};
    if (min !== undefined) rangeFilter.$gte = min;
    if (max !== undefined) rangeFilter.$lte = max;
    
    return { [field]: rangeFilter };
  }
}