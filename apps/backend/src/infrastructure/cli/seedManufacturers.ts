#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { ManufacturerSeeder } from '../database/seeds/ManufacturerSeeder';

async function seedManufacturers() {
  try {
    // Conectar ao MongoDB
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://admin:bess123456@mongodb:27017/bess_pro?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Executar seed
    await ManufacturerSeeder.seed();

    console.log('🎉 Manufacturers seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding manufacturers:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedManufacturers();
}

export { seedManufacturers };
