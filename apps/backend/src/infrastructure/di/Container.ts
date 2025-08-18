export interface ServiceRegistration {
  implementation: any;
  singleton?: boolean;
  factory?: () => any;
}

export class Container {
  private static instance: Container;
  private services = new Map<string, ServiceRegistration>();
  private singletonInstances = new Map<string, any>();

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register<T>(token: string, implementation: new (...args: any[]) => T, singleton = false): void {
    this.services.set(token, { implementation, singleton });
  }

  registerFactory<T>(token: string, factory: () => T, singleton = false): void {
    this.services.set(token, { implementation: null, factory, singleton });
  }

  registerInstance<T>(token: string, instance: T): void {
    this.singletonInstances.set(token, instance);
  }

  resolve<T>(token: string): T {
    // Check singleton instances first
    if (this.singletonInstances.has(token)) {
      return this.singletonInstances.get(token);
    }

    const registration = this.services.get(token);
    if (!registration) {
      throw new Error(`Service '${token}' not registered`);
    }

    let instance: T;

    if (registration.factory) {
      instance = registration.factory();
    } else {
      instance = new registration.implementation();
    }

    if (registration.singleton) {
      this.singletonInstances.set(token, instance);
    }

    return instance;
  }

  // Métodos estáticos para compatibilidade (mocks temporários)
  static getClientAlertRepository() {
    try {
      return Container.getInstance().resolve('ClientAlertRepository');
    } catch {
      return {
        getPerformanceMetrics: async () => ({ indexStats: [], metrics: {} })
      };
    }
  }

  static getMongoConnectionPool() {
    try {
      return Container.getInstance().resolve('MongoConnectionPool');
    } catch {
      return {
        getMetrics: () => ({ queriesExecuted: 0, errors: 0, performance: {} }),
        healthCheck: async () => ({ status: 'healthy', details: {} }),
        isConnected: () => true
      };
    }
  }

  static getPaginationCacheService() {
    try {
      return Container.getInstance().resolve('PaginationCacheService');
    } catch {
      return {
        getCacheStats: async () => ({ hits: 0, misses: 0, hitRate: 0, totalKeys: 0 }),
        invalidateCache: async () => {}
      };
    }
  }
}