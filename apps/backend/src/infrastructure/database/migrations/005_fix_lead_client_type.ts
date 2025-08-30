import { LeadModel } from '../mongodb/schemas/LeadSchema';

export async function fixLeadClientType(): Promise<void> {
  console.log('🔧 Updating leads without clientType to default B2C...');
  
  try {
    // Update leads that don't have clientType field or have null/undefined/empty clientType
    const result = await LeadModel.updateMany(
      {
        $or: [
          { clientType: { $exists: false } },
          { clientType: null },
          { clientType: undefined },
          { clientType: '' }
        ]
      },
      {
        $set: {
          clientType: 'B2C', // Default to B2C as per domain entity
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} leads with default clientType: B2C`);
    
    // Log statistics for verification
    const totalLeads = await LeadModel.countDocuments();
    const b2bCount = await LeadModel.countDocuments({ clientType: 'B2B' });
    const b2cCount = await LeadModel.countDocuments({ clientType: 'B2C' });
    const undefinedCount = await LeadModel.countDocuments({
      $or: [
        { clientType: { $exists: false } },
        { clientType: null },
        { clientType: undefined },
        { clientType: '' }
      ]
    });
    
    console.log(`📊 Lead clientType distribution after migration:`);
    console.log(`   - Total leads: ${totalLeads}`);
    console.log(`   - B2B leads: ${b2bCount}`);
    console.log(`   - B2C leads: ${b2cCount}`);
    console.log(`   - Undefined leads: ${undefinedCount}`);
  } catch (error) {
    console.error('❌ Error fixing lead clientType:', error);
    throw error;
  }
}