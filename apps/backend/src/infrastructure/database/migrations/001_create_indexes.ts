import { UserModel } from '../mongodb/schemas/UserSchema';
import { ProjectModel } from '../mongodb/schemas/ProjectSchema';
import { LeadModel } from '../mongodb/schemas/LeadSchema';

export async function createIndexes(): Promise<void> {
  console.log('Creating database indexes...');

  // User indexes
  await UserModel.createIndexes();
  console.log('✅ User indexes created');

  // Project indexes
  await ProjectModel.createIndexes();
  console.log('✅ Project indexes created');

  // Lead indexes
  await LeadModel.createIndexes();
  console.log('✅ Lead indexes created');

  console.log('All indexes created successfully');
}
