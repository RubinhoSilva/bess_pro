import mongoose from 'mongoose';

export async function removeUniqueProjectNameIndex(): Promise<void> {
  console.log('🗑️  Removing unique project name index...');

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const collection = db.collection('projects');

    // Check if the unique index exists
    const indexes = await collection.indexes();
    const uniqueIndex = indexes.find(index => 
      index.key && 
      index.key.userId === 1 && 
      index.key.projectName === 1 && 
      index.unique === true
    );

    if (uniqueIndex) {
      // Drop the unique index by name or key pattern
      try {
        await collection.dropIndex('userId_1_projectName_1');
        console.log('✅ Unique project name index removed successfully');
      } catch (error: any) {
        if (error.message.includes('index not found')) {
          console.log('ℹ️  Index already removed, continuing...');
        } else {
          throw error;
        }
      }
      
      // Recreate the index without unique constraint
      await collection.createIndex({ userId: 1, projectName: 1 });
      console.log('✅ Non-unique project name index created successfully');
    } else {
      console.log('ℹ️  Unique project name index not found, skipping...');
    }

    console.log('✅ Migration completed successfully');
  } catch (error: any) {
    console.error('❌ Error removing unique project name index:', error.message);
    
    // If error is because index doesn't exist, that's ok
    if (error.message.includes('index not found') || error.message.includes('IndexNotFound')) {
      console.log('ℹ️  Index already doesn\'t exist, continuing...');
      return;
    }
    
    throw error;
  }
}