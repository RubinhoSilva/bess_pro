import { createIndexes } from './001_create_indexes';
import { seedAdminUser } from './002_seed_admin_user';
import { seedKanbanColumns } from './003_seed_kanban_columns';

export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');

  try {
    // Skip manual index creation - schemas already define indexes automatically
    // await createIndexes();
    await seedAdminUser();
    await seedKanbanColumns();
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}