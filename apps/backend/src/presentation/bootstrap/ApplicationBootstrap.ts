import { DatabaseConnection } from '../../infrastructure/database/connection';
import { Container } from '../../infrastructure/di/Container';
import { ContainerSetup } from '../../infrastructure/di/ContainerSetup';
import { AppConfig, loadConfig } from '../../infrastructure/config/AppConfig';
import { ExpressServer } from '../server/ExpressServer';
import { runMigrations } from '../../infrastructure/database/migrations';
import { EquipmentSeed } from '../../infrastructure/database/seeds/EquipmentSeed';

export class ApplicationBootstrap {
  private config: AppConfig;
  private container: Container;
  private server: ExpressServer;

  constructor() {
    this.config = loadConfig();
    this.container = ContainerSetup.setup(this.config);
    this.server = new ExpressServer(this.config, this.container);
  }

  async start(): Promise<void> {
    try {
      console.log('🎯 Starting BESS Pro Application...');

      // Initialize database
      await DatabaseConnection.initialize(this.config.database);
      console.log('✅ Database connected');

      // Run database migrations and seeders
      try {
        await runMigrations();
        console.log('✅ Migrations completed');
      } catch (error) {
        console.warn('⚠️ Migrations failed (non-critical):', error);
      }

      // Seed equipment data in development or when explicitly requested
      if (process.env.SEED_EQUIPMENT === 'true' || process.env.NODE_ENV === 'development') {
        try {
          console.log('🌱 Seeding equipment data...');
          await EquipmentSeed.seedAll();
          console.log('✅ Equipment seeding completed');
        } catch (error) {
          console.warn('⚠️ Equipment seeding failed (non-critical):', error);
        }
      }

      // Start server
      await this.server.start();
      console.log('✅ Application started successfully');

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start application:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping application...');

      await this.server.stop();
      console.log('✅ Server stopped');

      await DatabaseConnection.close();
      console.log('✅ Database disconnected');

      console.log('✅ Application stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping application:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        await this.stop();
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit the process, just log the error
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Exit the process for uncaught exceptions
      process.exit(1);
    });
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getContainer(): Container {
    return this.container;
  }

  getServer(): ExpressServer {
    return this.server;
  }
}