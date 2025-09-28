import { ManufacturerSeeder } from './ManufacturerSeeder';
import { SolarModuleSeeder } from './SolarModuleSeeder';
import { InverterSeeder } from './InverterSeeder';

export class EquipmentSeed {
  static async seedAll(userId?: string): Promise<void> {
    console.log('🚀 Iniciando processo completo de seeding de equipamentos...');
    
    try {
      // 1. Criar fabricantes primeiro (eles são necessários para os equipamentos)
      console.log('\n📋 Passo 1: Criando fabricantes...');
      await ManufacturerSeeder.seed();
      
      // 2. Criar módulos solares
      console.log('\n🔆 Passo 2: Criando módulos solares...');
      await SolarModuleSeeder.seed();
      
      // 3. Criar inversores
      console.log('\n⚡ Passo 3: Criando inversores...');
      await InverterSeeder.seed();
      
      console.log('\n🎉 Processo de seeding completo! Todos os equipamentos foram criados com sucesso.');
      console.log('📊 Resumo:');
      console.log('  ✅ Fabricantes padrão criados');
      console.log('  ✅ Módulos solares associados aos fabricantes');
      console.log('  ✅ Inversores associados aos fabricantes');
      
    } catch (error: any) {
      console.error('❌ Erro durante o processo de seeding:', error.message);
      throw error;
    }
  }

  // Método para seed individual de cada tipo
  static async seedManufacturers(): Promise<void> {
    console.log('🏭 Executando seed apenas dos fabricantes...');
    await ManufacturerSeeder.seed();
  }

  static async seedSolarModules(): Promise<void> {
    console.log('🔆 Executando seed apenas dos módulos solares...');
    await SolarModuleSeeder.seed();
  }

  static async seedInverters(): Promise<void> {
    console.log('⚡ Executando seed apenas dos inversores...');
    await InverterSeeder.seed();
  }
}