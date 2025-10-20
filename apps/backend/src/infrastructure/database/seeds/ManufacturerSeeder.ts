import { ManufacturerModel } from '../mongodb/schemas/ManufacturerSchema';
import { ManufacturerType } from '../../../domain/entities/Manufacturer';
import { getManufacturerId, ManufacturerKey } from './ManufacturerIds';
import { ObjectId } from 'mongodb';
import { SystemUsers } from '@/domain/constants/SystemUsers';

// Interface para estender o tipo do fabricante com _id
interface ManufacturerWithId {
  _id: ObjectId;
  name: string;
  type: ManufacturerType;
  isDefault: boolean;
  description: string;
  website: string;
  country: string;
  certifications: string[];
}

export class ManufacturerSeeder {
  static async seed(): Promise<void> {
    console.log('🌱 Starting manufacturer seeding with fixed UUIDs...');

    const manufacturers: ManufacturerWithId[] = [
      // Fabricantes de Módulos Fotovoltaicos
      {
        _id: getManufacturerId('JINKO_SOLAR' as ManufacturerKey),
        name: 'Jinko Solar',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Um dos maiores fabricantes de módulos solares do mundo',
        website: 'https://www.jinkosolar.com',
        country: 'China',
        certifications: ['IEC61215', 'IEC61730', 'TUV']
      },
      {
        _id: getManufacturerId('CANADIAN_SOLAR' as ManufacturerKey),
        name: 'Canadian Solar',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Fabricante global de módulos fotovoltaicos de alta qualidade',
        website: 'https://www.canadiansolar.com',
        country: 'Canadá',
        certifications: ['IEC61215', 'IEC61730', 'UL1703']
      },
      {
        _id: getManufacturerId('TRINA_SOLAR' as ManufacturerKey),
        name: 'Trina Solar',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Fabricante líder mundial em módulos fotovoltaicos',
        website: 'https://www.trinasolar.com',
        country: 'China',
        certifications: ['IEC61215', 'IEC61730', 'VDE']
      },
      {
        _id: getManufacturerId('LONGI_SOLAR' as ManufacturerKey),
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
        _id: getManufacturerId('SMA_SOLAR_TECHNOLOGY' as ManufacturerKey),
        name: 'SMA Solar Technology',
        type: ManufacturerType.INVERTER,
        isDefault: true,
        description: 'Líder mundial em tecnologia de inversores fotovoltaicos',
        website: 'https://www.sma.de',
        country: 'Alemanha',
        certifications: ['IEC62109', 'VDE', 'IEEE1547']
      },
      {
        _id: getManufacturerId('FRONIUS' as ManufacturerKey),
        name: 'Fronius',
        type: ManufacturerType.INVERTER,
        isDefault: true,
        description: 'Fabricante austríaco de inversores de alta qualidade',
        website: 'https://www.fronius.com',
        country: 'Áustria',
        certifications: ['IEC62109', 'VDE', 'AS4777']
      },
      {
        _id: getManufacturerId('HUAWEI' as ManufacturerKey),
        name: 'Huawei',
        type: ManufacturerType.INVERTER,
        isDefault: true,
        description: 'Soluções inteligentes de inversores fotovoltaicos',
        website: 'https://solar.huawei.com',
        country: 'China',
        certifications: ['IEC62109', 'VDE', 'UL1741']
      },
      {
        _id: getManufacturerId('SOLAREDGE' as ManufacturerKey),
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
        _id: getManufacturerId('GOODWE' as ManufacturerKey),
        name: 'GoodWe',
        type: ManufacturerType.BOTH,
        isDefault: true,
        description: 'Fabricante de inversores e soluções de armazenamento',
        website: 'https://www.goodwe.com',
        country: 'China',
        certifications: ['IEC62109', 'IEC61215', 'VDE']
      },
      {
        _id: getManufacturerId('GROWATT' as ManufacturerKey),
        name: 'Growatt',
        type: ManufacturerType.BOTH,
        isDefault: true,
        description: 'Fabricante de inversores e sistemas de energia solar',
        website: 'https://www.growatt.com',
        country: 'China',
        certifications: ['IEC62109', 'IEC61215', 'VDE']
      },
      {
        _id: getManufacturerId('CHINT' as ManufacturerKey),
        name: 'Chint',
        type: ManufacturerType.BOTH,
        isDefault: true,
        description: 'Fabricante global de equipamentos elétricos e soluções de energia',
        website: 'https://www.chint.com',
        country: 'China',
        certifications: ['IEC62109', 'IEC61215', 'VDE']
      },
      {
        _id: getManufacturerId('ODEX' as ManufacturerKey),
        name: 'Odex',
        type: ManufacturerType.SOLAR_MODULE,
        isDefault: true,
        description: 'Fabricante de módulos solares inovadores',
        website: 'https://www.odex.com',
        country: 'China',
        certifications: ['IEC61215', 'IEC61730', 'TUV']
      }
    ];

    console.log(`🌱 Processing ${manufacturers.length} default manufacturers...`);

    let createdCount = 0;
    let existingCount = 0;

    for (const manufacturerData of manufacturers) {
      try {
        // Verificar se o fabricante já existe pelo ID fixo
        const existing = await ManufacturerModel.findById(manufacturerData._id);

        if (existing) {
          existingCount++;
          console.log(`⏭️  Manufacturer already exists: ${manufacturerData.name} (ID: ${manufacturerData._id})`);
        } else {
          const manufacturerToCreate = {
            ...manufacturerData,
            teamId: SystemUsers.PUBLIC_EQUIPMENT // ID padrão para equipamentos públicos
          };

          await ManufacturerModel.create(manufacturerToCreate);
          createdCount++;
          console.log(`✅ Created manufacturer: ${manufacturerData.name} (ID: ${manufacturerData._id})`);
        }
      } catch (error: any) {
        console.error(`❌ Error processing manufacturer ${manufacturerData.name}:`, error.message);
      }
    }

    console.log(`🎉 Manufacturer seeding completed! Created: ${createdCount}, Already existed: ${existingCount}`);
    return;
  }

  /**
   * Obtém ID do fabricante pelo nome usando o mapeamento fixo
   * Não precisa mais buscar no banco de dados
   */
  static getManufacturerIdByName(name: string): ObjectId | null {
    try {
      const nameToIdMap: Record<string, ObjectId> = {
        'Jinko Solar': getManufacturerId('JINKO_SOLAR' as ManufacturerKey),
        'Canadian Solar': getManufacturerId('CANADIAN_SOLAR' as ManufacturerKey),
        'Trina Solar': getManufacturerId('TRINA_SOLAR' as ManufacturerKey),
        'LONGi Solar': getManufacturerId('LONGI_SOLAR' as ManufacturerKey),
        'SMA Solar Technology': getManufacturerId('SMA_SOLAR_TECHNOLOGY' as ManufacturerKey),
        'Fronius': getManufacturerId('FRONIUS' as ManufacturerKey),
        'Huawei': getManufacturerId('HUAWEI' as ManufacturerKey),
        'SolarEdge': getManufacturerId('SOLAREDGE' as ManufacturerKey),
        'GoodWe': getManufacturerId('GOODWE' as ManufacturerKey),
        'Growatt': getManufacturerId('GROWATT' as ManufacturerKey),
        'Chint': getManufacturerId('CHINT' as ManufacturerKey)
      };
      
      return nameToIdMap[name] || null;
    } catch (error) {
      console.error(`Error getting manufacturer ID for ${name}:`, error);
      return null;
    }
  }

  /**
   * Obtém ID do fabricante pela chave (mais eficiente)
   */
  static getManufacturerIdByKey(key: ManufacturerKey): ObjectId {
    return getManufacturerId(key);
  }
}