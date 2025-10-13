import mongoose from 'mongoose';
import { Db } from 'mongodb';

export class Migration006RemoveUserIdAddTeamIdSolarModules {
  static async up(): Promise<void> {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection('solar_modules');

    console.log('Running migration 006: Remove userId from solar_modules and make teamId required');

    try {
      // Update all documents: remove userId field, ensure teamId exists
      const result = await collection.updateMany(
        { userId: { $exists: true } },
        { 
          $unset: { userId: "" },
          $set: { 
            teamId: { $ifNull: ["$teamId", "default-team"] } 
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} documents`);

      // Drop old indexes that use userId
      const indexesToDrop = [
        'userId_1_manufacturerId_1_modelo_1',
        'userId_1_potenciaNominal_1',
        'userId_1_fabricante_1_modelo_1',
        'userId_1'
      ];

      for (const indexName of indexesToDrop) {
        try {
          await collection.dropIndex(indexName);
          console.log(`Dropped index: ${indexName}`);
        } catch (error: any) {
          if (error.codeName !== 'IndexNotFound') {
            console.log(`Index ${indexName} not found or already dropped`);
          }
        }
      }

      // Ensure new indexes with teamId exist (they should already exist)
      await collection.createIndex(
        { teamId: 1, manufacturerId: 1, modelo: 1 }, 
        { unique: true, background: true }
      );
      console.log('Ensured unique index with teamId exists');
      
      await collection.createIndex(
        { teamId: 1, potenciaNominal: 1 },
        { background: true }
      );
      console.log('Ensured power index with teamId exists');

      console.log('Migration 006 completed successfully!');
    } catch (error) {
      console.error('Migration 006 failed:', error);
      throw error;
    }
  }

  static async down(): Promise<void> {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    const collection = db.collection('solar_modules');

    console.log('Rolling back migration 006: Add userId back to solar_modules');

    try {
      // Add userId back (this is problematic - we don't know the original values)
      // In a real scenario, you'd need to have backed up the original userIds
      console.warn('WARNING: This rollback cannot restore original userId values!');
      
      // Drop teamId indexes
      const indexesToDrop = [
        'teamId_1_manufacturerId_1_modelo_1',
        'teamId_1_potenciaNominal_1'
      ];

      for (const indexName of indexesToDrop) {
        try {
          await collection.dropIndex(indexName);
          console.log(`Dropped index: ${indexName}`);
        } catch (error: any) {
          if (error.codeName !== 'IndexNotFound') {
            console.log(`Index ${indexName} not found`);
          }
        }
      }

      // Recreate userId indexes (without knowing original userId values)
      console.warn('WARNING: Cannot recreate userId indexes without original data!');
      
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}