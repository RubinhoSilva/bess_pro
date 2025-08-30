import { createIndexes } from './001_create_indexes';
import { seedAdminUser } from './002_seed_admin_user';
import { seedKanbanColumns } from './003_seed_kanban_columns';
import { removeUniqueProjectNameIndex } from './004_remove_unique_project_name_index';
import { fixLeadClientType } from './005_fix_lead_client_type';

export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');

  try {
    // Skip manual index creation - schemas already define indexes automatically
    // await createIndexes();
    await seedAdminUser();
    await seedKanbanColumns();
    await removeUniqueProjectNameIndex();
    // await fixLeadClientType(); // Uncomment to run the clientType fix migration
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}