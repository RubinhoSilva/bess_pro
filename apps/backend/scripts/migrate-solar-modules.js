const { MongoClient } = require('mongodb');

async function migrateSolarModules() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://mongodb:27017/bess_pro');
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('solar_modules');
    
    console.log('Starting migration of solar_modules collection...');
    
    // Check if there are any documents with userId
    const docs = await collection.find({ userId: { $exists: true } }).toArray();
    console.log(`Found ${docs.length} documents with userId field`);
    
    if (docs.length > 0) {
      // Update documents: remove userId field, ensure teamId exists
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
    }
    
    // Create new indexes
    console.log('Creating new indexes...');
    
    // Drop old indexes that use userId
    try {
      await collection.dropIndex('userId_1_manufacturerId_1_modelo_1');
      console.log('Dropped old unique index');
    } catch (error) {
      console.log('Old index not found or already dropped');
    }
    
    try {
      await collection.dropIndex('userId_1_potenciaNominal_1');
      console.log('Dropped old power index');
    } catch (error) {
      console.log('Old power index not found or already dropped');
    }
    
    // Create new indexes with teamId
    await collection.createIndex(
      { teamId: 1, manufacturerId: 1, modelo: 1 }, 
      { unique: true }
    );
    console.log('Created new unique index with teamId');
    
    await collection.createIndex(
      { teamId: 1, potenciaNominal: 1 }
    );
    console.log('Created new power index with teamId');
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateSolarModules();