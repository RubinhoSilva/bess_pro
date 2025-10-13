import 'reflect-metadata'; // Required for dependency injection
import { ApplicationBootstrap } from './presentation/bootstrap/ApplicationBootstrap';
import { runMigrations } from './infrastructure/database/migrations/runMigrations';

async function main() {
  try {
    // Run migrations first
    console.log('🔄 Running database migrations...');
    await runMigrations();
    
    // Start the application
    console.log('🚀 Starting application...');
    const app = new ApplicationBootstrap();
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
