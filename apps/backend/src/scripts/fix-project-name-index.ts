import mongoose from 'mongoose';
import { removeUniqueProjectNameIndex } from '../infrastructure/database/migrations/004_remove_unique_project_name_index';

async function runIndexFix() {
  try {
    console.log('🔧 Starting project name index fix...');
    
    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bess_pro';
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Run the migration
    await removeUniqueProjectNameIndex();
    
    console.log('🎉 Index fix completed successfully!');
  } catch (error) {
    console.error('❌ Error running index fix:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
runIndexFix();