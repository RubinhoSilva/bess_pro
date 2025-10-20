import { InverterModel } from '../mongodb/schemas/InverterSchema';
import { MANUFACTURER_IDS, getManufacturerId, ManufacturerKey } from './ManufacturerIds';
import { SystemUsers } from '../../../domain/constants/SystemUsers';

export class InverterSeeder {
  static async seed(): Promise<void> {
    console.log('🌱 Iniciando criação de inversores...');

    const invertersData = [
      {
        manufacturerId: getManufacturerId('CHINT' as ManufacturerKey),
        modelo: 'CPS SCA3.6KTL-PS2/EU',
        tipoRede: 'bifasico-220v',
        potenciaSaidaCA: 6120, //Potência Nominal CA (W)
        potenciaMaxima: 6120, //Potência FV Max (W)
        correnteEntradaMax: 20, //Corrente Entrada Máx (A)
        numeroMppt: 1, //Número de MPPTs
        stringsPorMppt: 1, //Strings por MPPT
        tensaoCcMax: 500, // Tensão CC Máx (V)
        eficienciaMaxima: 97.3,
        potenciaAparenteMax: 3600, //Potência Aparente Máx (VA)
      },
      {
        manufacturerId: getManufacturerId('CHINT' as ManufacturerKey),
        modelo: 'CPS SCA7.5KTL-PSM/EU',
        tipoRede: 'bifasico-220v',
        potenciaSaidaCA: 7500, //Potência Nominal CA (W)
        potenciaMaxima: 12750, //Potência FV Max (W)
        correnteEntradaMax: 40, //Corrente Entrada Máx (A)
        numeroMppt: 2, //Número de MPPTs
        stringsPorMppt: 2, //Strings por MPPT
        tensaoCcMax: 550, // Tensão CC Máx (V)
        eficienciaMaxima: 97.7,
        potenciaAparenteMax: 7500, //Potência Aparente Máx (VA)
      },
      {
        manufacturerId: getManufacturerId('CHINT' as ManufacturerKey),
        modelo: 'SCA75K-T-SA',
        tipoRede: 'bifasico-220v',
        potenciaSaidaCA: 75000, //Potência Nominal CA (W)
        potenciaMaxima: 150000, //Potência FV Max (W)
        correnteEntradaMax: 45, //Corrente Entrada Máx (A)
        numeroMppt: 9, //Número de MPPTs
        stringsPorMppt: 2, //Strings por MPPT
        tensaoCcMax: 1100, // Tensão CC Máx (V)
        eficienciaMaxima: 98.41,
        potenciaAparenteMax: 75000, //Potência Aparente Máx (VA)
      },
    ];

    console.log(`🌱 Verificando ${invertersData.length} inversores padrão...`);

    let createdCount = 0;
    let existingCount = 0;

    for (const inverterData of invertersData) {
      try {
        // ✅ Não precisa mais buscar por nome - ID já está disponível diretamente!
        const manufacturerId = inverterData.manufacturerId;

        // Verificar se o inversor padrão já existe
        const existing = await InverterModel.findOne({
          modelo: inverterData.modelo,
          manufacturerId,
          teamId: SystemUsers.PUBLIC_EQUIPMENT
        });

        if (existing) {
          existingCount++;
          console.log(`⏭️  Inversor já existe: ${inverterData.modelo} ${inverterData.modelo} (Manufacturer ID: ${manufacturerId})`);
        } else {
          // Criar o inversor com o manufacturerId e teamId padrão
          const inverterToCreate = {
            ...inverterData,
            teamId: SystemUsers.PUBLIC_EQUIPMENT // ID padrão para equipamentos públicos
          };

          await InverterModel.create(inverterToCreate);
          createdCount++;
          console.log(`✅ Inversor criado: ${inverterData.modelo} ${inverterData.modelo} (Manufacturer ID: ${manufacturerId})`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar inversor ${inverterData.modelo}:`, error.message);
      }
    }

    console.log(`🎉 Inverter seeding completed! Created: ${createdCount}, Already existed: ${existingCount}`);
  }
}