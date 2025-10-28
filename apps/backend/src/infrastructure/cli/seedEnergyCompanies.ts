#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { EnergyCompanySeeder } from '../database/seeds/EnergyCompanySeeder';

async function seedEnergyCompanies() {
  try {
    // Conectar ao MongoDB
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://admin:bess123456@mongodb:27017/bess_pro?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Executar seed
    await EnergyCompanySeeder.seed();

    console.log('🎉 Energy companies seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding energy companies:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedEnergyCompanies();
}

export { seedEnergyCompanies };
