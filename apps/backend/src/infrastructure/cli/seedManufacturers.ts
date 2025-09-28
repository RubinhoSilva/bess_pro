#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { ManufacturerSeeder } from '../database/seeds/ManufacturerSeeder';

async function seedManufacturers() {
  try {
    // Conectar ao MongoDB
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/bess-pro';
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