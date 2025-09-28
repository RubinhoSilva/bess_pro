import { ManufacturerModel } from '../mongodb/schemas/ManufacturerSchema';
import { ManufacturerType } from '../../../domain/entities/Manufacturer';

export class ManufacturerSeeder {
  static async seed(): Promise<void> {
    console.log('🌱 Starting manufacturer seeding...');
    
    // Clear existing manufacturers
    await ManufacturerModel.deleteMany({});
    console.log('🗑️ Cleared existing manufacturers');

    const manufacturers = [
      // Fabricantes de Módulos Fotovoltaicos
      {
        name: 'Jinko Solar',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Um dos maiores fabricantes de módulos solares do mundo',
        website: 'https://www.jinkosolar.com',
        country: 'China',
        certifications: ['IEC61215', 'IEC61730', 'TUV']
      },
      {
        name: 'Canadian Solar',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Fabricante global de módulos fotovoltaicos de alta qualidade',
        website: 'https://www.canadiansolar.com',
        country: 'Canadá',
        certifications: ['IEC61215', 'IEC61730', 'UL1703']
      },
      {
        name: 'Trina Solar',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Fabricante líder mundial em módulos fotovoltaicos',
        website: 'https://www.trinasolar.com',
        country: 'China',
        certifications: ['IEC61215', 'IEC61730', 'VDE']
      },
      {
        name: 'LONGi Solar',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Líder mundial em tecnologia monocristalina',
        website: 'https://www.longi.com',
        country: 'China',
        certifications: ['IEC61215', 'IEC61730', 'PVEL']
      },

      // Fabricantes de Inversores
      {
        name: 'SMA Solar Technology',
        type: ManufacturerType.INVERTER,
        isDefault: true,
        description: 'Líder mundial em tecnologia de inversores fotovoltaicos',
        website: 'https://www.sma.de',
        country: 'Alemanha',
        certifications: ['IEC62109', 'VDE', 'IEEE1547']
      },
      {
        name: 'Fronius',
        type: ManufacturerType.INVERTER,
        isDefault: true,
        description: 'Fabricante austríaco de inversores de alta qualidade',
        website: 'https://www.fronius.com',
        country: 'Áustria',
        certifications: ['IEC62109', 'VDE', 'AS4777']
      },
      {
        name: 'Huawei',
        type: ManufacturerType.INVERTER,
        isDefault: true,
        description: 'Soluções inteligentes de inversores fotovoltaicos',
        website: 'https://solar.huawei.com',
        country: 'China',
        certifications: ['IEC62109', 'VDE', 'UL1741']
      },
      {
        name: 'SolarEdge',
        type: ManufacturerType.INVERTER,
        isDefault: true,
        description: 'Líder em otimizadores de potência e inversores inteligentes',
        website: 'https://www.solaredge.com',
        country: 'Israel',
        certifications: ['IEC62109', 'UL1741', 'IEEE1547']
      },

      // Fabricantes que produzem ambos
      {
        name: 'GoodWe',
        type: ManufacturerType.BOTH,
        isDefault: true,
        description: 'Fabricante de inversores e soluções de armazenamento',
        website: 'https://www.goodwe.com',
        country: 'China',
        certifications: ['IEC62109', 'IEC61215', 'VDE']
      },
      {
        name: 'Growatt',
        type: ManufacturerType.BOTH,
        isDefault: true,
        description: 'Fabricante de inversores e sistemas de energia solar',
        website: 'https://www.growatt.com',
        country: 'China',
        certifications: ['IEC62109', 'IEC61215', 'VDE']
      }
    ];

    console.log(`🌱 Creating ${manufacturers.length} manufacturers...`);
    
    const createdManufacturers = [];
    for (const manufacturerData of manufacturers) {
      try {
        const manufacturer = await ManufacturerModel.create(manufacturerData);
        createdManufacturers.push(manufacturer);
        console.log(`✅ Created manufacturer: ${manufacturerData.name}`);
      } catch (error: any) {
        console.error(`❌ Error creating manufacturer ${manufacturerData.name}:`, error.message);
      }
    }

    console.log(`🎉 Successfully created ${createdManufacturers.length} manufacturers!`);
    return;
  }

  static async getManufacturerIdByName(name: string): Promise<string | null> {
    try {
      const manufacturer = await ManufacturerModel.findOne({ name });
      return manufacturer?.id || null;
    } catch (error) {
      console.error(`Error finding manufacturer ${name}:`, error);
      return null;
    }
  }
}