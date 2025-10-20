import { SolarModuleModel } from '../mongodb/schemas/SolarModuleSchema';
import { getManufacturerId, ManufacturerKey } from './ManufacturerIds';
import { SystemUsers } from '../../../domain/constants/SystemUsers';

export class SolarModuleSeeder {
  static async seed(): Promise<void> {
    console.log('🌱 Iniciando criação de módulos solares...');

    const solarModulesData = [
      {
        manufacturerId: getManufacturerId('ODEX' as ManufacturerKey),
        modelo: 'ODE100585',
        potenciaNominal: 585,
        larguraMm: 1134,
        alturaMm: 2278,
        espessuraMm: 30,
        pesoKg: 32,
        garantiaAnos: 25,
        tipoCelula: 'Monocristalino',
        numeroCelulas: 144,
        vmpp: 42.52,
        impp: 13.76,
        voc: 51.16,
        isc: 14.55,
        aRef: 1.8, // Fator de idealidade
        iLRef: 14.55, //Corrente de Luz Fotogerada (A)
        iORef: 3.5e-12, // Corrente de Saturação do Diodo (A)
        rS: 0.25, // Resistência série (Ohms)
        rShRef: 450, // Resistência de shunt (Ohms)
        eficiencia: 22.6,
        tempCoefPmax: -0.29,
        tempCoefVoc: -0.25,
        tempCoefIsc: 0.041,
      },
      {
        manufacturerId: getManufacturerId('LONGI_SOLAR' as ManufacturerKey),
        modelo: 'LR7-72HVD-645M',
        potenciaNominal: 645,
        larguraMm: 1134,
        alturaMm: 2382,
        espessuraMm: 30,
        pesoKg: 33.5,
        garantiaAnos: 30,
        tipoCelula: 'Monocristalino',
        numeroCelulas: 144,
        vmpp: 44.56,
        impp: 14.48,
        voc: 53.70,
        isc: 15.17,
        aRef: 1.8, // Fator de idealidade
        iLRef: 15.17, //Corrente de Luz Fotogerada (A)
        iORef: 2.5e-12, // Corrente de Saturação do Diodo (A)
        rS: 0.25, // Resistência série (Ohms)
        rShRef: 450, // Resistência de shunt (Ohms)
        eficiencia: 23.9,
        tempCoefPmax: -0.26,
        tempCoefVoc: -0.20,
        tempCoefIsc: 0.050,
      },
    ];

    console.log(`🌱 Verificando ${solarModulesData.length} módulos solares padrão...`);

    let createdCount = 0;
    let existingCount = 0;

    for (const moduleData of solarModulesData) {
      try {
        // ✅ Não precisa mais buscar por nome - ID já está disponível diretamente!
        const manufacturerId = moduleData.manufacturerId;

        // Verificar se o módulo padrão já existe
        const existing = await SolarModuleModel.findOne({
          modelo: moduleData.modelo,
          manufacturerId,
          teamId: SystemUsers.PUBLIC_EQUIPMENT
        });

        if (existing) {
          existingCount++;
          console.log(`⏭️  Módulo já existe: ${moduleData.modelo} ${moduleData.modelo} (Manufacturer ID: ${manufacturerId})`);
        } else {
          // Criar o módulo com o manufacturerId e teamId padrão
          const moduleToCreate = {
            ...moduleData,
            teamId: SystemUsers.PUBLIC_EQUIPMENT, // ID padrão para equipamentos públicos
          };

          await SolarModuleModel.create(moduleToCreate);
          createdCount++;
          console.log(`✅ Módulo criado: ${moduleData.modelo} ${moduleData.modelo} (Manufacturer ID: ${manufacturerId})`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar módulo ${moduleData.modelo}:`, error.message);
      }
    }

    console.log(`🎉 Solar module seeding completed! Created: ${createdCount}, Already existed: ${existingCount}`);
  }
}