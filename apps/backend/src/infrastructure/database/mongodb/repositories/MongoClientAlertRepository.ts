import { ClientAlert, AlertStatus, AlertType, AlertPriority } from '../../../../domain/entities/ClientAlert';
import { IClientAlertRepository, ClientAlertFilters } from '../../../../domain/repositories/IClientAlertRepository';
import { ClientAlertModel, IClientAlertDocument } from '../schemas/ClientAlertSchema';
import { MongoSoftDeleteRepository } from './base/MongoSoftDeleteRepository';
import { 
  PaginationRequest, 
  PaginationResponse, 
  OffsetPaginationRequest, 
  OffsetPaginationResponse,
  PaginationUtils 
} from '../../../../shared/interfaces/Pagination';
import { PaginationCacheService } from '../../../cache/PaginationCacheService';

export class MongoClientAlertRepository extends MongoSoftDeleteRepository<ClientAlert, IClientAlertDocument> implements IClientAlertRepository {
  private cacheService?: PaginationCacheService;

  constructor(cacheService?: PaginationCacheService) {
    super(ClientAlertModel);
    this.cacheService = cacheService;
  }

  protected toDomain(doc: IClientAlertDocument): ClientAlert {
    return ClientAlert.create({
      id: doc._id.toString() || doc.domainId,
      clientId: doc.clientId,
      userId: doc.userId,
      title: doc.title,
      description: doc.description,
      alertDate: doc.alertDate,
      alertType: doc.alertType,
      priority: doc.priority,
      status: doc.status,
      isRecurring: doc.isRecurring,
      recurringPattern: doc.recurringPattern ? doc.recurringPattern : undefined,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt ? doc.deletedAt : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  protected toPersistence(entity: ClientAlert): Partial<IClientAlertDocument> {
    return {
      domainId: entity.getId(),
      clientId: entity.getClientId(),
      userId: entity.getUserId(),
      title: entity.getTitle(),
      description: entity.getDescription(),
      alertDate: entity.getAlertDate(),
      alertType: entity.getAlertType(),
      priority: entity.getPriority(),
      status: entity.getStatus(),
      isRecurring: entity.getIsRecurring(),
      recurringPattern: entity.getRecurringPattern() || undefined,
      isDeleted: entity.isDeleted(),
      deletedAt: entity.getDeletedAt() || undefined,
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt()
    };
  }

  async findByClientId(clientId: string): Promise<ClientAlert[]> {
    const docs = await this.model.find({
      clientId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ alertDate: 1 });

    return docs.map((doc: any) => this.toDomain(doc));
  }

  async findByUserId(userId: string): Promise<ClientAlert[]> {
    const docs = await this.model.find({
      userId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ alertDate: 1 });

    return docs.map((doc: any) => this.toDomain(doc));
  }

  async findByFilters(filters: ClientAlertFilters): Promise<ClientAlert[]> {
    const query: any = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };

    if (filters.clientId) {
      query.clientId = filters.clientId;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.alertType) {
      query.alertType = filters.alertType;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.alertDate = {};
      if (filters.dateFrom) {
        query.alertDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.alertDate.$lte = filters.dateTo;
      }
    }

    if (filters.isOverdue) {
      query.alertDate = { $lt: new Date() };
      query.status = AlertStatus.PENDING;
    }

    const docs = await this.model.find(query).sort({ alertDate: 1 });
    return docs.map((doc: any) => this.toDomain(doc));
  }

  async findDueAlerts(userId: string): Promise<ClientAlert[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Pipeline otimizado com índices hint
    const docs = await this.model.aggregate([
      {
        $match: {
          userId,
          status: AlertStatus.PENDING,
          alertDate: { $gte: startOfDay, $lte: endOfDay },
          isDeleted: { $ne: true }
        }
      },
      {
        $addFields: {
          priorityWeight: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', AlertPriority.URGENT] }, then: 4 },
                { case: { $eq: ['$priority', AlertPriority.HIGH] }, then: 3 },
                { case: { $eq: ['$priority', AlertPriority.MEDIUM] }, then: 2 },
                { case: { $eq: ['$priority', AlertPriority.LOW] }, then: 1 }
              ],
              default: 1
            }
          }
        }
      },
      {
        $sort: { priorityWeight: -1, alertDate: 1 }
      },
      {
        $limit: 100
      },
      {
        $project: {
          priorityWeight: 0 // Remove campo temporário
        }
      }
    ], {
      hint: { userId: 1, status: 1, alertDate: 1 }, // Forçar uso do índice
      allowDiskUse: false // Forçar uso de memória para melhor performance
    });

    return docs.map((doc: any) => this.toDomain(doc));
  }

  async findOverdueAlerts(userId: string): Promise<ClientAlert[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const docs = await this.model.aggregate([
      {
        $match: {
          userId,
          status: AlertStatus.PENDING,
          alertDate: { $lt: startOfDay },
          isDeleted: { $ne: true }
        }
      },
      {
        $addFields: {
          daysPastDue: {
            $divide: [
              { $subtract: [startOfDay, '$alertDate'] },
              1000 * 60 * 60 * 24 // milliseconds em dias
            ]
          },
          priorityWeight: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', AlertPriority.URGENT] }, then: 4 },
                { case: { $eq: ['$priority', AlertPriority.HIGH] }, then: 3 },
                { case: { $eq: ['$priority', AlertPriority.MEDIUM] }, then: 2 },
                { case: { $eq: ['$priority', AlertPriority.LOW] }, then: 1 }
              ],
              default: 1
            }
          }
        }
      },
      {
        $sort: { 
          priorityWeight: -1, 
          daysPastDue: -1, // Mais atrasados primeiro
          alertDate: 1 
        }
      },
      {
        $limit: 50
      },
      {
        $project: {
          daysPastDue: 0,
          priorityWeight: 0
        }
      }
    ], {
      hint: { userId: 1, status: 1, alertDate: 1 },
      allowDiskUse: false
    });

    return docs.map((doc: any) => this.toDomain(doc));
  }

  async findUpcomingAlerts(userId: string, days: number): Promise<ClientAlert[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const docs = await this.model.aggregate([
      {
        $match: {
          userId,
          status: AlertStatus.PENDING,
          alertDate: { $gte: today, $lte: futureDate },
          isDeleted: { $ne: true }
        }
      },
      {
        $addFields: {
          daysUntilDue: {
            $divide: [
              { $subtract: ['$alertDate', today] },
              1000 * 60 * 60 * 24
            ]
          },
          priorityWeight: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', AlertPriority.URGENT] }, then: 4 },
                { case: { $eq: ['$priority', AlertPriority.HIGH] }, then: 3 },
                { case: { $eq: ['$priority', AlertPriority.MEDIUM] }, then: 2 },
                { case: { $eq: ['$priority', AlertPriority.LOW] }, then: 1 }
              ],
              default: 1
            }
          }
        }
      },
      {
        $sort: { 
          daysUntilDue: 1, // Mais próximos primeiro
          priorityWeight: -1,
          alertDate: 1 
        }
      },
      {
        $limit: 100
      },
      {
        $project: {
          daysUntilDue: 0,
          priorityWeight: 0
        }
      }
    ], {
      hint: { userId: 1, status: 1, alertDate: 1 },
      allowDiskUse: false
    });

    return docs.map((doc: any) => this.toDomain(doc));
  }

  // Pipeline SUPER OTIMIZADO para estatísticas do dashboard
  async getDashboardStats(userId: string): Promise<{
    totalPending: number;
    overdueCount: number;
    dueToday: number;
    upcomingWeek: number;
    priorityBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const pipeline = [
      {
        $match: {
          userId,
          status: AlertStatus.PENDING,
          isDeleted: { $ne: true }
        }
      },
      {
        $facet: {
          // Estatísticas principais
          mainStats: [
            {
              $group: {
                _id: null,
                totalPending: { $sum: 1 },
                overdueCount: {
                  $sum: {
                    $cond: [{ $lt: ['$alertDate', startOfDay] }, 1, 0]
                  }
                },
                dueToday: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$alertDate', startOfDay] },
                          { $lte: ['$alertDate', endOfDay] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                upcomingWeek: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$alertDate', today] },
                          { $lte: ['$alertDate', nextWeek] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          // Breakdown por prioridade
          priorityStats: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          // Breakdown por tipo
          typeStats: [
            {
              $group: {
                _id: '$alertType',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const results = await this.model.aggregate(pipeline, {
      hint: { userId: 1, status: 1, alertDate: 1 },
      allowDiskUse: false
    });

    const result = results[0];
    const mainStats = result.mainStats[0] || {
      totalPending: 0,
      overdueCount: 0,
      dueToday: 0,
      upcomingWeek: 0
    };

    const priorityBreakdown = result.priorityStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const typeBreakdown = result.typeStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return {
      ...mainStats,
      priorityBreakdown,
      typeBreakdown
    };
  }

  // Implementação de paginação cursor-based OTIMIZADA com cache
  async findWithPagination(
    filters: ClientAlertFilters,
    pagination: PaginationRequest
  ): Promise<PaginationResponse<ClientAlert>> {
    // Tentar buscar do cache se disponível
    if (this.cacheService) {
      const cacheKey = this.cacheService.buildCacheKey({
        entity: 'client-alerts',
        userId: filters.userId,
        clientId: filters.clientId,
        filters,
        pagination
      });

      return await this.cacheService.getOrSetCachedData(
        cacheKey,
        () => this.performCursorPagination(filters, pagination),
        300 // 5 minutos de cache
      );
    }

    return this.performCursorPagination(filters, pagination);
  }

  private async performCursorPagination(
    filters: ClientAlertFilters,
    pagination: PaginationRequest
  ): Promise<PaginationResponse<ClientAlert>> {
    const limit = PaginationUtils.validateLimit(pagination.limit);
    const sortBy = pagination.sortBy || 'alertDate';
    const sortOrder = PaginationUtils.validateSortOrder(pagination.sortOrder);

    // Construir query base
    const baseQuery = this.buildFiltersQuery(filters);
    
    // Construir query com cursor se fornecido
    let query = baseQuery;
    if (pagination.cursor) {
      // Buscar o documento do cursor para obter o valor de ordenação
      const cursorDoc = await this.model.findById(pagination.cursor);
      if (cursorDoc) {
        const cursorValue = PaginationUtils.extractSortValue(cursorDoc, sortBy);
        const cursorFilter = PaginationUtils.buildCursorFilter(
          pagination.cursor,
          sortBy,
          sortOrder,
          cursorValue
        );
        query = { ...baseQuery, ...cursorFilter };
      }
    }

    // Buscar documentos (limit + 1 para verificar se há próxima página)
    const sort = PaginationUtils.buildMongoSort(sortBy, sortOrder);
    const docs = await this.model
      .find(query)
      .sort(sort)
      .limit(limit + 1)
      .exec();

    // Verificar se há próxima página
    const hasNextPage = docs.length > limit;
    if (hasNextPage) {
      docs.pop(); // Remove o documento extra
    }

    // Converter para domain entities
    const data = docs.map((doc: any) => this.toDomain(doc));

    // Determinar cursors
    let nextCursor: string | undefined;
    let previousCursor: string | undefined;

    if (hasNextPage && docs.length > 0) {
      nextCursor = PaginationUtils.extractCursor(docs[docs.length - 1], sortBy);
    }

    if (pagination.cursor && docs.length > 0) {
      previousCursor = PaginationUtils.extractCursor(docs[0], sortBy);
    }

    return {
      data,
      pagination: {
        hasNextPage,
        hasPreviousPage: !!pagination.cursor,
        nextCursor,
        previousCursor,
        limit,
        sortBy,
        sortOrder
      }
    };
  }

  // Implementação de paginação offset-based OTIMIZADA com cache
  async findWithOffsetPagination(
    filters: ClientAlertFilters,
    pagination: OffsetPaginationRequest
  ): Promise<OffsetPaginationResponse<ClientAlert>> {
    // Tentar buscar do cache se disponível
    if (this.cacheService) {
      const cacheKey = this.cacheService.buildCacheKey({
        entity: 'client-alerts',
        userId: filters.userId,
        clientId: filters.clientId,
        filters,
        pagination
      });

      return await this.cacheService.getOrSetCachedData(
        cacheKey,
        () => this.performOffsetPagination(filters, pagination),
        300 // 5 minutos de cache
      );
    }

    return this.performOffsetPagination(filters, pagination);
  }

  private async performOffsetPagination(
    filters: ClientAlertFilters,
    pagination: OffsetPaginationRequest
  ): Promise<OffsetPaginationResponse<ClientAlert>> {
    const limit = PaginationUtils.validateLimit(pagination.limit);
    const page = PaginationUtils.validatePage(pagination.page);
    const sortBy = pagination.sortBy || 'alertDate';
    const sortOrder = PaginationUtils.validateSortOrder(pagination.sortOrder);
    const offset = PaginationUtils.calculateOffset(page, limit);

    const query = this.buildFiltersQuery(filters);
    const sort = PaginationUtils.buildMongoSort(sortBy, sortOrder);

    // Buscar documentos e contar total em paralelo
    const [docs, totalCount] = await Promise.all([
      this.model
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query)
    ]);

    const data = docs.map((doc: any) => this.toDomain(doc));
    const totalPages = PaginationUtils.calculateTotalPages(totalCount, limit);

    return {
      data,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        sortBy,
        sortOrder
      }
    };
  }

  async findByClientIdWithPagination(
    clientId: string,
    pagination: PaginationRequest
  ): Promise<PaginationResponse<ClientAlert>> {
    return this.findWithPagination({ clientId }, pagination);
  }

  async findDashboardAlertsWithPagination(
    userId: string,
    pagination: PaginationRequest
  ): Promise<{
    dueAlerts: PaginationResponse<ClientAlert>;
    overdueAlerts: PaginationResponse<ClientAlert>;
    upcomingAlerts: PaginationResponse<ClientAlert>;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Executar queries em paralelo
    const [dueAlerts, overdueAlerts, upcomingAlerts] = await Promise.all([
      this.findWithPagination({
        userId,
        status: AlertStatus.PENDING,
        dateFrom: startOfDay,
        dateTo: endOfDay
      }, pagination),
      
      this.findWithPagination({
        userId,
        status: AlertStatus.PENDING,
        dateTo: startOfDay
      }, pagination),
      
      this.findWithPagination({
        userId,
        status: AlertStatus.PENDING,
        dateFrom: today,
        dateTo: nextWeek
      }, pagination)
    ]);

    return {
      dueAlerts,
      overdueAlerts,
      upcomingAlerts
    };
  }

  // Método auxiliar para construir query de filtros
  private buildFiltersQuery(filters: ClientAlertFilters): Record<string, any> {
    const query: any = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };

    if (filters.clientId) {
      query.clientId = filters.clientId;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.alertType) {
      query.alertType = filters.alertType;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.alertDate = {};
      if (filters.dateFrom) {
        query.alertDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.alertDate.$lte = filters.dateTo;
      }
    }

    if (filters.isOverdue) {
      query.alertDate = { $lt: new Date() };
      query.status = AlertStatus.PENDING;
    }

    return query;
  }

  // NOVOS MÉTODOS PARA OTIMIZAÇÃO DE PERFORMANCE

  // Query otimizada com índices hint
  private async findWithHint(
    query: Record<string, any>,
    sort: Record<string, any>,
    limit: number,
    skip?: number
  ): Promise<any[]> {
    let mongoQuery = this.model.find(query);

    // Usar hint baseado na query para forçar uso de índice específico
    if (query.userId && query.status && query.alertDate) {
      mongoQuery = mongoQuery.hint({ userId: 1, status: 1, alertDate: -1, _id: 1 });
    } else if (query.clientId && query.alertDate) {
      mongoQuery = mongoQuery.hint({ clientId: 1, alertDate: -1, _id: 1 });
    } else if (query.userId && query.alertDate) {
      mongoQuery = mongoQuery.hint({ userId: 1, alertDate: -1, _id: 1 });
    }

    if (skip !== undefined) {
      mongoQuery = mongoQuery.skip(skip);
    }

    return mongoQuery.sort(sort).limit(limit).exec();
  }

  // Contagem otimizada com cache
  private async getOptimizedCount(query: Record<string, any>): Promise<number> {
    if (this.cacheService) {
      const countKey = `count:${JSON.stringify(query)}`;
      const cachedCount = await this.cacheService.getCachedCount(countKey);
      if (cachedCount !== null) {
        return cachedCount;
      }

      // Use estimatedDocumentCount para queries simples
      let count: number;
      if (Object.keys(query).length === 1 && query.isDeleted === false) {
        count = await this.model.estimatedDocumentCount();
      } else {
        count = await this.model.countDocuments(query);
      }

      await this.cacheService.setCachedCount(countKey, count, 600); // 10 minutos
      return count;
    }

    return this.model.countDocuments(query);
  }

  // Invalidar cache quando dados mudarem
  async save(entity: ClientAlert): Promise<ClientAlert> {
    const persistenceData = this.toPersistence(entity);
    const doc = new this.model(persistenceData);
    const savedDoc = await doc.save();
    const result = this.toDomain(savedDoc);
    
    if (this.cacheService) {
      await this.cacheService.invalidateCacheByUserId(entity.getUserId());
      if (entity.getClientId()) {
        await this.cacheService.invalidateCacheByClientId(entity.getClientId());
      }
    }
    
    return result;
  }

  async updateAlert(id: string, updateData: any): Promise<ClientAlert | null> {
    const updatedDoc = await this.model.findOneAndUpdate(
      {
        _id: id,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    const result = updatedDoc ? this.toDomain(updatedDoc) : null;
    
    if (this.cacheService && result) {
      await this.cacheService.invalidateCacheByUserId(result.getUserId());
      if (result.getClientId()) {
        await this.cacheService.invalidateCacheByClientId(result.getClientId());
      }
    }
    
    return result;
  }

  async deleteAlert(id: string): Promise<boolean> {
    // Buscar entidade antes de deletar para invalidar cache
    const entity = await this.findById(id);
    const updateResult = await this.model.findOneAndUpdate(
      {
        _id: id,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      },
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );
    const result = !!updateResult;
    
    if (this.cacheService && result && entity) {
      await this.cacheService.invalidateCacheByUserId(entity.getUserId());
      if (entity.getClientId()) {
        await this.cacheService.invalidateCacheByClientId(entity.getClientId());
      }
    }
    
    return result;
  }

  // Métricas de performance
  async getPerformanceMetrics(): Promise<{
    cacheStats?: any;
    indexStats: any[];
  }> {
    const metrics: any = {};

    // Estatísticas do cache
    if (this.cacheService) {
      metrics.cacheStats = await this.cacheService.getCacheStats();
    }

    // Estatísticas dos índices
    try {
      const indexStats = await (this.model.collection as any).indexStats();
      metrics.indexStats = indexStats;
    } catch (error) {
      console.error('Error getting index stats:', error);
      metrics.indexStats = [];
    }

    return metrics;
  }
}