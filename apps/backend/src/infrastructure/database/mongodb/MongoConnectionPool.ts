import mongoose, { Connection } from 'mongoose';

interface ConnectionPoolConfig {
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  heartbeatFrequencyMS?: number;
  retryWrites?: boolean;
  compressors?: string[];
  readPreference?: string;
  writeConcern?: {
    w?: 'majority' | number;
    j?: boolean;
    wtimeout?: number;
  };
}

export class MongoConnectionPool {
  private connection: Connection | null = null;
  private connectionPromise: Promise<Connection> | null = null;
  private config: Required<ConnectionPoolConfig>;
  private connectionString: string;
  private metrics = {
    connectionsCreated: 0,
    connectionsDestroyed: 0,
    queriesExecuted: 0,
    errors: 0,
    lastConnectedAt: null as Date | null,
    avgResponseTime: 0,
    responseTimes: [] as number[]
  };

  constructor(connectionString: string, config: ConnectionPoolConfig = {}) {
    this.connectionString = connectionString;
    this.config = {
      maxPoolSize: config.maxPoolSize || 50,
      minPoolSize: config.minPoolSize || 5,
      maxIdleTimeMS: config.maxIdleTimeMS || 300000, // 5 minutos
      serverSelectionTimeoutMS: config.serverSelectionTimeoutMS || 30000, // 30 segundos
      socketTimeoutMS: config.socketTimeoutMS || 45000, // 45 segundos
      heartbeatFrequencyMS: config.heartbeatFrequencyMS || 10000, // 10 segundos
      retryWrites: config.retryWrites ?? true,
      compressors: config.compressors || ['zstd', 'zlib', 'snappy'],
      readPreference: config.readPreference || 'secondaryPreferred',
      writeConcern: config.writeConcern || {
        w: 'majority',
        j: true,
        wtimeout: 30000
      }
    };

    this.setupEventListeners();
  }

  async connect(): Promise<Connection> {
    if (this.connection && this.connection.readyState === 1) {
      return this.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.createConnection();
    return this.connectionPromise;
  }

  private async createConnection(): Promise<Connection> {
    try {
      const options = {
        maxPoolSize: this.config.maxPoolSize,
        minPoolSize: this.config.minPoolSize,
        maxIdleTimeMS: this.config.maxIdleTimeMS,
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
        socketTimeoutMS: this.config.socketTimeoutMS,
        heartbeatFrequencyMS: this.config.heartbeatFrequencyMS,
        retryWrites: this.config.retryWrites,
        compressors: this.config.compressors as any,
        readPreference: this.config.readPreference as any,
        writeConcern: this.config.writeConcern,
        
        // Configurações avançadas de performance
        bufferMaxEntries: 0, // Desabilita buffering
        bufferCommands: false,
        autoIndex: false, // Não criar índices automaticamente em produção
        autoCreate: false, // Não criar coleções automaticamente
        
        // Configurações de rede otimizadas
        keepAlive: true,
        keepAliveInitialDelay: 300000,
        
        // Configurações de SSL/TLS se necessário (comentado para evitar erros)
        // ssl: process.env.NODE_ENV === 'production',
        // sslValidate: process.env.NODE_ENV === 'production',
        
        // Configurações de log
        loggerLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info'
      };

      await mongoose.connect(this.connectionString, options);
      this.connection = mongoose.connection;
      this.metrics.connectionsCreated++;
      this.metrics.lastConnectedAt = new Date();
      
      console.log('✅ MongoDB connection pool established successfully');
      return this.connection;
    } catch (error) {
      this.metrics.errors++;
      this.connectionPromise = null;
      console.error('❌ Failed to establish MongoDB connection:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      console.log('🔗 MongoDB connected');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      this.metrics.errors++;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      this.connection = null;
      this.connectionPromise = null;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      this.metrics.connectionsCreated++;
    });

    // Event listeners para métricas de performance
    mongoose.connection.on('commandStarted', (event) => {
      event.startTime = Date.now();
    });

    mongoose.connection.on('commandSucceeded', (event) => {
      this.metrics.queriesExecuted++;
      if (event.startTime) {
        const responseTime = Date.now() - event.startTime;
        this.updateResponseTimeMetrics(responseTime);
      }
    });

    mongoose.connection.on('commandFailed', (event) => {
      this.metrics.errors++;
      console.error('❌ MongoDB command failed:', event);
    });

    // Graceful shutdown
    process.on('SIGINT', this.disconnect.bind(this));
    process.on('SIGTERM', this.disconnect.bind(this));
  }

  private updateResponseTimeMetrics(responseTime: number): void {
    this.metrics.responseTimes.push(responseTime);
    
    // Manter apenas as últimas 1000 medições
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
    
    // Calcular média móvel
    this.metrics.avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.metrics.connectionsDestroyed++;
        this.connection = null;
        this.connectionPromise = null;
        console.log('🔌 MongoDB connection pool closed gracefully');
      }
    } catch (error) {
      console.error('❌ Error during MongoDB disconnect:', error);
    }
  }

  isConnected(): boolean {
    return this.connection?.readyState === 1;
  }

  getMetrics() {
    const { responseTimes } = this.metrics;
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    
    return {
      ...this.metrics,
      connectionState: this.connection?.readyState || 0,
      poolStats: {
        maxPoolSize: this.config.maxPoolSize,
        minPoolSize: this.config.minPoolSize,
        currentConnections: this.isConnected() ? 1 : 0
      },
      performance: {
        avgResponseTime: Math.round(this.metrics.avgResponseTime),
        medianResponseTime: responseTimes.length > 0 ? 
          Math.round(sortedTimes[Math.floor(sortedTimes.length / 2)]) : 0,
        p95ResponseTime: responseTimes.length > 0 ? 
          Math.round(sortedTimes[Math.floor(sortedTimes.length * 0.95)]) : 0,
        p99ResponseTime: responseTimes.length > 0 ? 
          Math.round(sortedTimes[Math.floor(sortedTimes.length * 0.99)]) : 0
      }
    };
  }

  // Método para health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      if (!this.isConnected()) {
        return {
          status: 'unhealthy',
          details: { error: 'Not connected to database' }
        };
      }

      // Testar uma query simples
      const startTime = Date.now();
      await mongoose.connection.db!.admin().ping();
      const responseTime = Date.now() - startTime;

      const metrics = this.getMetrics();
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'unhealthy',
        details: {
          responseTime,
          metrics,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Configuração de índices para performance
  async ensureIndexes(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }

    try {
      console.log('🔧 Ensuring database indexes...');
      
      // Aqui você pode adicionar criação de índices personalizados
      // que não estão definidos nos schemas
      
      // Exemplo: índice composto para queries frequentes
      await mongoose.connection.collection('client_alerts').createIndex(
        { 
          userId: 1, 
          status: 1, 
          alertDate: -1,
          priority: 1 
        },
        { 
          background: true,
          name: 'performance_query_index'
        }
      );

      console.log('✅ Database indexes ensured');
    } catch (error) {
      console.error('❌ Error ensuring indexes:', error);
      throw error;
    }
  }

  // Método para otimizar configurações baseado no ambiente
  static getOptimizedConfig(environment: 'development' | 'production' | 'test'): ConnectionPoolConfig {
    const configs = {
      development: {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 60000,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 20000,
        heartbeatFrequencyMS: 30000
      },
      production: {
        maxPoolSize: 100,
        minPoolSize: 10,
        maxIdleTimeMS: 300000,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        compressors: ['zstd', 'zlib'],
        readPreference: 'secondaryPreferred',
        writeConcern: {
          w: 'majority' as const,
          j: true,
          wtimeout: 30000
        }
      },
      test: {
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        heartbeatFrequencyMS: 60000
      }
    };

    return configs[environment];
  }
}