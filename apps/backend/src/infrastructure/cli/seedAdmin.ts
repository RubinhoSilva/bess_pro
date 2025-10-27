import mongoose from 'mongoose';
import { seedAdminUser } from '../database/migrations/002_seed_admin_user';

async function seedAdmin() {
  try {
    // Conectar ao MongoDB
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://admin:bess123456@mongodb:27017/bess_pro?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Executar seed
    await seedAdminUser();
    console.log('🎉 Admin seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAdmin();
}

export { seedAdmin };
