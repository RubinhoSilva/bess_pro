import { MigrationRunner } from './MigrationRunner';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function runMigrations() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:bess123456@mongodb:27017/bess_pro?authSource=admin';
  const dbName = 'bess_pro';

  console.log('Connecting to:', mongoUri);
  console.log('Database:', dbName);

  const migrationRunner = new MigrationRunner(mongoUri, dbName);

  await migrationRunner.runMigrations();
  console.log('✅ Migrations completed successfully');
}

// Script de execução direta (com process.exit)
async function runMigrationsScript() {
  try {
    await runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Executar apenas se este arquivo for chamado diretamente
if (require.main === module) {
  runMigrationsScript();
}

export { runMigrations };