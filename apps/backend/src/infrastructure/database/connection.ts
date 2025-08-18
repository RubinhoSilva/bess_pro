import mongoose, { Connection } from 'mongoose';

export interface DatabaseConfig {
  mongoUri: string;
  dbName: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  serverSelectionTimeoutMS?: number;
}

export class DatabaseConnection {
  private static instance: Connection;

  static async initialize(config: DatabaseConfig): Promise<Connection> {
    if (!this.instance) {
      const options = {
        maxPoolSize: config.maxPoolSize || 10,
        minPoolSize: config.minPoolSize || 5,
        maxIdleTimeMS: config.maxIdleTimeMS || 30000,
        serverSelectionTimeoutMS: config.serverSelectionTimeoutMS || 5000,
        dbName: config.dbName,
      };

      await mongoose.connect(config.mongoUri, options);
      this.instance = mongoose.connection;

      this.instance.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });

      this.instance.on('connected', () => {
        console.log('MongoDB connected successfully');
      });

      this.instance.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });
    }
    return this.instance;
  }

  static getInstance(): Connection {
    if (!this.instance) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await mongoose.connection.close();
    }
  }
}