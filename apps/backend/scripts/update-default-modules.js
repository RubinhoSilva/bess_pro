const { MongoClient } = require('mongodb');

async function updateDefaultModules() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://mongodb:27017/bess_pro');
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('solar_modules');
    
    console.log('Setting isDefault=true for existing modules...');
    
    // Set all existing modules as default since they were migrated from userId-based system
    const result = await collection.updateMany(
      { isDefault: { $ne: true } },
      { $set: { isDefault: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} modules to isDefault=true`);
    
    // Verify the update
    const count = await collection.countDocuments({ isDefault: true });
    console.log(`Total modules with isDefault=true: ${count}`);
    
    console.log('Update completed successfully!');
    
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await client.close();
  }
}

updateDefaultModules();