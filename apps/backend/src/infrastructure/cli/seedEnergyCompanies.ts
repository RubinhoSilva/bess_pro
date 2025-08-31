#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { EnergyCompanySeeder } from '../database/seeds/EnergyCompanySeeder';

async function seedEnergyCompanies() {
  try {
    // Conectar ao MongoDB
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/bess-pro';
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