import { InverterModel } from '../mongodb/schemas/InverterSchema';
import { ManufacturerSeeder } from './ManufacturerSeeder';
import { SystemUsers } from '../../../domain/constants/SystemUsers';

export class InverterSeeder {
  static async seed(): Promise<void> {
    console.log('🌱 Iniciando criação de inversores...');

    const invertersData = [
      // SMA Solar Technology
      {
        fabricante: 'SMA Solar Technology',
        modelo: 'STP 60-10',
        tipo: 'String',
        potenciaNominal: 60000,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 60000,
        potenciaMaxima: 66000,
        tensaoMppMin: 580,
        tensaoMppMax: 1000,
        tensaoMppNominal: 760,
        correnteMppMax: 84,
        tensaoEntradaMax: 1100,
        correnteEntradaMax: 33,
        numeroMppts: 6,
        stringsPorMppt: 2,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 87,
        eficienciaMaxima: 98.4,
        eficienciaEuropeia: 98.1,
        consumoNoturno: 1,
        protecaoIp: 'IP65',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'VDE', 'IEEE1547'],
        pesoKg: 61,
        dimensoes: '665 x 460 x 245 mm',
        garantiaAnos: 10,
        monitoramento: true,
        comunicacao: ['Ethernet', 'RS485']
      },
      {
        fabricante: 'SMA Solar Technology',
        modelo: 'STP 25000TL-30',
        tipo: 'String',
        potenciaNominal: 25000,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 25000,
        potenciaMaxima: 27500,
        tensaoMppMin: 390,
        tensaoMppMax: 800,
        tensaoMppNominal: 600,
        correnteMppMax: 33,
        tensaoEntradaMax: 1000,
        correnteEntradaMax: 33,
        numeroMppts: 3,
        stringsPorMppt: 2,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 36.2,
        eficienciaMaxima: 98.4,
        eficienciaEuropeia: 98.1,
        consumoNoturno: 1,
        protecaoIp: 'IP65',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'VDE', 'IEEE1547'],
        pesoKg: 55,
        dimensoes: '665 x 460 x 245 mm',
        garantiaAnos: 10,
        monitoramento: true,
        comunicacao: ['Ethernet', 'RS485']
      },

      // Fronius
      {
        fabricante: 'Fronius',
        modelo: 'Eco 25.0-3-S',
        tipo: 'String',
        potenciaNominal: 25000,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 25000,
        potenciaMaxima: 25000,
        tensaoMppMin: 200,
        tensaoMppMax: 800,
        tensaoMppNominal: 580,
        correnteMppMax: 42,
        tensaoEntradaMax: 1000,
        correnteEntradaMax: 22,
        numeroMppts: 2,
        stringsPorMppt: 2,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 36.1,
        eficienciaMaxima: 98.1,
        eficienciaEuropeia: 97.9,
        consumoNoturno: 1,
        protecaoIp: 'IP66',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'VDE', 'AS4777'],
        pesoKg: 35,
        dimensoes: '725 x 510 x 225 mm',
        garantiaAnos: 5,
        monitoramento: true,
        comunicacao: ['Ethernet', 'WLAN', 'Modbus']
      },
      {
        fabricante: 'Fronius',
        modelo: 'Primo 15.0-1',
        tipo: 'String',
        potenciaNominal: 15000,
        tipoRede: 'Monofásica',
        potenciaSaidaCA: 15000,
        potenciaMaxima: 15000,
        tensaoMppMin: 200,
        tensaoMppMax: 800,
        tensaoMppNominal: 580,
        correnteMppMax: 26,
        tensaoEntradaMax: 1000,
        correnteEntradaMax: 15,
        numeroMppts: 2,
        stringsPorMppt: 1,
        tensaoSaidaNominal: 230,
        correnteSaidaNominal: 65.2,
        eficienciaMaxima: 97.0,
        eficienciaEuropeia: 96.5,
        consumoNoturno: 0.8,
        protecaoIp: 'IP66',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'VDE', 'AS4777'],
        pesoKg: 22,
        dimensoes: '645 x 431 x 206 mm',
        garantiaAnos: 5,
        monitoramento: true,
        comunicacao: ['Ethernet', 'WLAN']
      },

      // Huawei
      {
        fabricante: 'Huawei',
        modelo: 'SUN2000-60KTL-M0',
        tipo: 'String',
        potenciaNominal: 60000,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 60000,
        potenciaMaxima: 66000,
        tensaoMppMin: 560,
        tensaoMppMax: 1000,
        tensaoMppNominal: 720,
        correnteMppMax: 110,
        tensaoEntradaMax: 1100,
        correnteEntradaMax: 22,
        numeroMppts: 6,
        stringsPorMppt: 2,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 86.5,
        eficienciaMaxima: 98.65,
        eficienciaEuropeia: 98.3,
        consumoNoturno: 1,
        protecaoIp: 'IP66',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'VDE', 'UL1741'],
        pesoKg: 46,
        dimensoes: '620 x 530 x 240 mm',
        garantiaAnos: 10,
        monitoramento: true,
        comunicacao: ['4G', 'Ethernet', 'RS485']
      },
      {
        fabricante: 'Huawei',
        modelo: 'SUN2000-20KTL-M0',
        tipo: 'String',
        potenciaNominal: 20000,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 20000,
        potenciaMaxima: 22000,
        tensaoMppMin: 560,
        tensaoMppMax: 1000,
        tensaoMppNominal: 720,
        correnteMppMax: 36.5,
        tensaoEntradaMax: 1100,
        correnteEntradaMax: 12.5,
        numeroMppts: 4,
        stringsPorMppt: 1,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 28.9,
        eficienciaMaxima: 98.65,
        eficienciaEuropeia: 98.3,
        consumoNoturno: 1,
        protecaoIp: 'IP66',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'VDE', 'UL1741'],
        pesoKg: 28,
        dimensoes: '365 x 365 x 156 mm',
        garantiaAnos: 10,
        monitoramento: true,
        comunicacao: ['4G', 'Ethernet', 'RS485']
      },

      // SolarEdge
      {
        fabricante: 'SolarEdge',
        modelo: 'SE27.6K-RW000BNU4',
        tipo: 'String com Otimizadores',
        potenciaNominal: 27600,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 27600,
        potenciaMaxima: 30000,
        tensaoMppMin: 350,
        tensaoMppMax: 750,
        tensaoMppNominal: 600,
        correnteMppMax: 50,
        tensaoEntradaMax: 800,
        correnteEntradaMax: 15,
        numeroMppts: 3,
        stringsPorMppt: 1,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 40,
        eficienciaMaxima: 99.0,
        eficienciaEuropeia: 98.8,
        consumoNoturno: 2.5,
        protecaoIp: 'IP65',
        faixaTemperatura: '-40 a +60°C',
        certificacoes: ['IEC62109', 'UL1741', 'IEEE1547'],
        pesoKg: 38,
        dimensoes: '656 x 466 x 207 mm',
        garantiaAnos: 12,
        monitoramento: true,
        comunicacao: ['Ethernet', 'ZigBee', '4G']
      },

      // GoodWe (Fabricante BOTH)
      {
        fabricante: 'GoodWe',
        modelo: 'GW25K-MT',
        tipo: 'String',
        potenciaNominal: 25000,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 25000,
        potenciaMaxima: 27500,
        tensaoMppMin: 200,
        tensaoMppMax: 1000,
        tensaoMppNominal: 620,
        correnteMppMax: 22,
        tensaoEntradaMax: 1100,
        correnteEntradaMax: 16,
        numeroMppts: 2,
        stringsPorMppt: 2,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 36.2,
        eficienciaMaxima: 98.4,
        eficienciaEuropeia: 98.0,
        consumoNoturno: 1,
        protecaoIp: 'IP66',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'IEC61215', 'VDE'],
        pesoKg: 32,
        dimensoes: '525 x 470 x 185 mm',
        garantiaAnos: 10,
        monitoramento: true,
        comunicacao: ['WiFi', 'Ethernet', 'RS485']
      },

      // Growatt (Fabricante BOTH)
      {
        fabricante: 'Growatt',
        modelo: 'MAX 50KTL3 LV',
        tipo: 'String',
        potenciaNominal: 50000,
        tipoRede: 'Trifásica',
        potenciaSaidaCA: 50000,
        potenciaMaxima: 55000,
        tensaoMppMin: 260,
        tensaoMppMax: 800,
        tensaoMppNominal: 620,
        correnteMppMax: 12.5,
        tensaoEntradaMax: 1000,
        correnteEntradaMax: 16,
        numeroMppts: 4,
        stringsPorMppt: 2,
        tensaoSaidaNominal: 400,
        correnteSaidaNominal: 72.2,
        eficienciaMaxima: 98.75,
        eficienciaEuropeia: 98.3,
        consumoNoturno: 1,
        protecaoIp: 'IP66',
        faixaTemperatura: '-25 a +60°C',
        certificacoes: ['IEC62109', 'IEC61215', 'VDE'],
        pesoKg: 58,
        dimensoes: '800 x 430 x 330 mm',
        garantiaAnos: 10,
        monitoramento: true,
        comunicacao: ['WiFi', 'Ethernet', 'RS485', '4G']
      }
    ];

    console.log(`🌱 Verificando ${invertersData.length} inversores padrão...`);

    let createdCount = 0;
    let existingCount = 0;

    for (const inverterData of invertersData) {
      try {
        // Buscar o ID do fabricante
        const manufacturerId = await ManufacturerSeeder.getManufacturerIdByName(inverterData.fabricante);

        if (!manufacturerId) {
          console.error(`❌ Fabricante '${inverterData.fabricante}' não encontrado para o inversor ${inverterData.modelo}`);
          continue;
        }

        // Verificar se o inversor padrão já existe
        const existing = await InverterModel.findOne({
          modelo: inverterData.modelo,
          manufacturerId,
          teamId: SystemUsers.PUBLIC_EQUIPMENT
        });

        if (existing) {
          existingCount++;
          console.log(`⏭️  Inversor já existe: ${inverterData.fabricante} ${inverterData.modelo}`);
        } else {
          // Criar o inversor com o manufacturerId e teamId padrão
          const inverterToCreate = {
            ...inverterData,
            manufacturerId,
            teamId: SystemUsers.PUBLIC_EQUIPMENT // ID padrão para equipamentos públicos
          };

          await InverterModel.create(inverterToCreate);
          createdCount++;
          console.log(`✅ Inversor criado: ${inverterData.fabricante} ${inverterData.modelo}`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar inversor ${inverterData.modelo}:`, error.message);
      }
    }

    console.log(`🎉 Inverter seeding completed! Created: ${createdCount}, Already existed: ${existingCount}`);
  }
}