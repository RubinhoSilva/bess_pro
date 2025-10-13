import { MongoClient, Db } from 'mongodb';

export interface Migration {
  version: string;
  description: string;
  up: (db: Db) => Promise<void>;
  down?: (db: Db) => Promise<void>;
}

export class MigrationRunner {
  private client: MongoClient;
  private dbName: string;

  constructor(mongoUri: string, dbName: string) {
    this.client = new MongoClient(mongoUri);
    this.dbName = dbName;
  }

  async runMigrations(): Promise<void> {
    try {
      await this.client.connect();
      const db = this.client.db(this.dbName);
      
      // Create migrations collection if it doesn't exist
      const migrationsCollection = db.collection('migrations');
      
      // Get all migrations
      const migrations = this.getMigrations();
      
      // Get already executed migrations
      const executedMigrations = await migrationsCollection
        .find({})
        .sort({ version: 1 })
        .toArray();
      
      const executedVersions = new Set(
        executedMigrations.map((m: any) => m.version)
      );
      
      // Run pending migrations
      for (const migration of migrations) {
        if (!executedVersions.has(migration.version)) {
          console.log(`Running migration ${migration.version}: ${migration.description}`);
          
          try {
            await migration.up(db);
            
            // Record migration
            await migrationsCollection.insertOne({
              version: migration.version,
              description: migration.description,
              executedAt: new Date()
            });
            
            console.log(`Migration ${migration.version} completed successfully`);
          } catch (error) {
            console.error(`Migration ${migration.version} failed:`, error);
            throw error;
          }
        }
      }
      
      console.log('All migrations are up to date');
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.client.close();
    }
  }

  private getMigrations(): Migration[] {
    return [
      {
        version: '2025-10-13-002',
        description: 'Remove userId from solar_modules and make teamId required',
        up: async (db: Db) => {
          const collection = db.collection('solar_modules');
          
          console.log('Starting migration 2025-10-13-002...');

          // Step 1: Add teamId to documents that don't have it (set as default team)
          const addTeamIdResult = await collection.updateMany(
            { teamId: { $exists: false } },
            {
              $set: {
                teamId: "default-team",
                isDefault: true
              }
            }
          );
          console.log(`Added teamId to ${addTeamIdResult.modifiedCount} documents`);

          // Step 2: Remove userId field from all documents
          const removeUserIdResult = await collection.updateMany(
            { userId: { $exists: true } },
            {
              $unset: { userId: "" }
            }
          );
          console.log(`Removed userId from ${removeUserIdResult.modifiedCount} documents`);

          // Step 3: Drop old indexes
          try {
            await collection.dropIndex('userId_1_manufacturerId_1_modelo_1');
            console.log('Dropped index userId_1_manufacturerId_1_modelo_1');
          } catch (e: any) {
            // Index might not exist, that's ok
            console.log('Index userId_1_manufacturerId_1_modelo_1 not found, skipping');
          }

          try {
            await collection.dropIndex('userId_1_potenciaNominal_1');
            console.log('Dropped index userId_1_potenciaNominal_1');
          } catch (e: any) {
            // Index might not exist, that's ok
            console.log('Index userId_1_potenciaNominal_1 not found, skipping');
          }

          try {
            await collection.dropIndex('userId_1_fabricante_1_modelo_1');
            console.log('Dropped index userId_1_fabricante_1_modelo_1');
          } catch (e: any) {
            console.log('Index userId_1_fabricante_1_modelo_1 not found, skipping');
          }

          try {
            await collection.dropIndex('userId_1');
            console.log('Dropped index userId_1');
          } catch (e: any) {
            console.log('Index userId_1 not found, skipping');
          }

          // Step 4: Create new indexes
          await collection.createIndex(
            { teamId: 1, manufacturerId: 1, modelo: 1 },
            { unique: true }
          );
          console.log('Created index teamId_1_manufacturerId_1_modelo_1');

          await collection.createIndex(
            { teamId: 1, potenciaNominal: 1 }
          );
          console.log('Created index teamId_1_potenciaNominal_1');
          
          console.log('Migration 2025-10-13-002 completed successfully!');
        }
      }
    ];
  }
}