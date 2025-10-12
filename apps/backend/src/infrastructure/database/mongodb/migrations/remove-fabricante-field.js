/**
 * Migration Script: Remove 'fabricante' field and use only 'manufacturerId'
 * 
 * This script performs the following operations:
 * 1. Creates manufacturer records for unique fabricante names if they don't exist
 * 2. Populates manufacturerId based on fabricante name matching
 * 3. Removes the fabricante field from all documents
 * 4. Updates indexes to remove fabricante references
 * 5. Updates unique constraint from {userId, fabricante, modelo} to {userId, manufacturerId, modelo}
 * 
 * IMPORTANT: 
 * - Run this script with proper database backup
 * - Test in development environment first
 * - Monitor for any data inconsistencies
 */

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bess-pro';
const DATABASE_NAME = 'bess-pro';

async function migrateSolarModules() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Starting migration: Remove fabricante field from solar_modules');
    
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const solarModulesCollection = db.collection('solar_modules');
    const manufacturersCollection = db.collection('manufacturers');
    
    // Step 1: Create backup of current data
    console.log('📦 Creating backup...');
    const backup = await solarModulesCollection.find({}).toArray();
    await db.collection('solar_modules_backup_' + new Date().toISOString()).insertMany(backup);
    console.log(`✅ Backup created with ${backup.length} documents`);
    
    // Step 2: Get unique fabricante names from solar_modules
    console.log('🔍 Finding unique fabricante names...');
    const uniqueFabricantes = await solarModulesCollection.distinct('fabricante');
    console.log(`📋 Found ${uniqueFabricantes.length} unique fabricante names:`, uniqueFabricantes);
    
    // Step 3: Create manufacturer records for unique fabricante names if they don't exist
    console.log('🏭 Creating manufacturer records...');
    let createdManufacturers = 0;
    
    for (const fabricanteName of uniqueFabricantes) {
      if (!fabricanteName || fabricanteName.trim() === '') continue;
      
      const existingManufacturer = await manufacturersCollection.findOne({
        name: { $regex: new RegExp(`^${fabricanteName}$`, 'i') }
      });
      
      if (!existingManufacturer) {
        const newManufacturer = {
          name: fabricanteName.trim(),
          type: 'SOLAR_MODULE',
          contact: {
            email: null,
            phone: null,
            supportEmail: null,
            supportPhone: null
          },
          business: {
            foundedYear: null,
            headquarters: null,
            employeeCount: null,
            revenue: null,
            stockTicker: null,
            parentCompany: null,
            subsidiaries: null
          },
          certifications: [],
          metadata: {
            specialties: [],
            markets: [],
            qualityStandards: []
          },
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await manufacturersCollection.insertOne(newManufacturer);
        console.log(`✅ Created manufacturer: ${fabricanteName} (ID: ${result.insertedId})`);
        createdManufacturers++;
      } else {
        console.log(`ℹ️  Manufacturer already exists: ${fabricanteName} (ID: ${existingManufacturer._id})`);
      }
    }
    
    console.log(`🏭 Created ${createdManufacturers} new manufacturer records`);
    
    // Step 4: Populate manufacturerId based on fabricante name matching
    console.log('🔄 Populating manufacturerId field...');
    let updatedModules = 0;
    let failedUpdates = 0;
    
    const modulesToUpdate = await solarModulesCollection.find({
      fabricante: { $exists: true, $ne: null, $ne: '' }
    }).toArray();
    
    for (const module of modulesToUpdate) {
      try {
        const manufacturer = await manufacturersCollection.findOne({
          name: { $regex: new RegExp(`^${module.fabricante}$`, 'i') }
        });
        
        if (manufacturer) {
          await solarModulesCollection.updateOne(
            { _id: module._id },
            { 
              $set: { 
                manufacturerId: manufacturer._id.toString(),
                updatedAt: new Date()
              }
            }
          );
          updatedModules++;
        } else {
          console.warn(`⚠️  No manufacturer found for fabricante: ${module.fabricante}`);
          failedUpdates++;
        }
      } catch (error) {
        console.error(`❌ Error updating module ${module._id}:`, error);
        failedUpdates++;
      }
    }
    
    console.log(`✅ Updated ${updatedModules} modules with manufacturerId`);
    if (failedUpdates > 0) {
      console.warn(`⚠️  Failed to update ${failedUpdates} modules`);
    }
    
    // Step 5: Verify all modules have manufacturerId
    console.log('🔍 Verifying manufacturerId population...');
    const modulesWithoutManufacturerId = await solarModulesCollection.countDocuments({
      manufacturerId: { $exists: false }
    });
    
    if (modulesWithoutManufacturerId > 0) {
      throw new Error(`❌ ${modulesWithoutManufacturerId} modules still without manufacturerId. Migration cannot proceed.`);
    }
    
    console.log('✅ All modules have manufacturerId populated');
    
    // Step 6: Drop old indexes
    console.log('🗑️  Dropping old indexes...');
    try {
      await solarModulesCollection.dropIndex('userId_1_fabricante_1_modelo_1');
      console.log('✅ Dropped unique index: userId_1_fabricante_1_modelo_1');
    } catch (error) {
      console.log('ℹ️  Index userId_1_fabricante_1_modelo_1 not found or already dropped');
    }
    
    try {
      await solarModulesCollection.dropIndex('fabricante_text_modelo_text_tipoCelula_text');
      console.log('✅ Dropped text index: fabricante_text_modelo_text_tipoCelula_text');
    } catch (error) {
      console.log('ℹ️  Text index not found or already dropped');
    }
    
    // Step 7: Remove fabricante field from all documents
    console.log('🗑️  Removing fabricante field from documents...');
    const removeResult = await solarModulesCollection.updateMany(
      {},
      { $unset: { fabricante: "" } }
    );
    console.log(`✅ Removed fabricante field from ${removeResult.modifiedCount} documents`);
    
    // Step 8: Create new indexes
    console.log('📝 Creating new indexes...');
    
    // Unique index on userId, manufacturerId, modelo
    await solarModulesCollection.createIndex(
      { userId: 1, manufacturerId: 1, modelo: 1 },
      { unique: true, name: 'userId_1_manufacturerId_1_modelo_1_unique' }
    );
    console.log('✅ Created unique index: userId_1_manufacturerId_1_modelo_1_unique');
    
    // Text index on modelo and tipoCelula (removed fabricante)
    await solarModulesCollection.createIndex(
      { 
        modelo: 'text', 
        tipoCelula: 'text' 
      },
      { 
        weights: {
          modelo: 3,
          tipoCelula: 1
        },
        name: 'modelo_text_tipoCelula_text'
      }
    );
    console.log('✅ Created text index: modelo_text_tipoCelula_text');
    
    // Step 9: Final verification
    console.log('🔍 Final verification...');
    const totalModules = await solarModulesCollection.countDocuments();
    const modulesWithManufacturerId = await solarModulesCollection.countDocuments({
      manufacturerId: { $exists: true, $ne: null, $ne: '' }
    });
    const modulesWithFabricante = await solarModulesCollection.countDocuments({
      fabricante: { $exists: true }
    });
    
    console.log(`📊 Final stats:`);
    console.log(`   Total modules: ${totalModules}`);
    console.log(`   Modules with manufacturerId: ${modulesWithManufacturerId}`);
    console.log(`   Modules still with fabricante field: ${modulesWithFabricante}`);
    
    if (modulesWithManufacturerId === totalModules && modulesWithFabricante === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      throw new Error('❌ Migration verification failed. Please check the data.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 You can restore from backup collection: solar_modules_backup_' + new Date().toISOString());
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateSolarModules()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateSolarModules };