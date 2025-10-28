#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { EquipmentSeed } from '../database/seeds/EquipmentSeed';

async function seedEquipment() {
  try {
    // Conectar ao MongoDB
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://admin:bess123456@mongodb:27017/bess_pro?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Executar seed
    const userId = process.argv[2]; // Opcional: passar userId como argumento
    await EquipmentSeed.seedAll(userId);

    console.log('🎉 Equipment seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding equipment:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedEquipment();
}

export { seedEquipment };
