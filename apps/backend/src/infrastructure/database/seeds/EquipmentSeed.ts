import { SolarModuleModel } from '../mongodb/schemas/SolarModuleSchema';
import { InverterModel } from '../mongodb/schemas/InverterSchema';

export class EquipmentSeed {
  
  private static solarModulesData = [
    {
      fabricante: 'Jinko Solar',
      modelo: 'JKM550M-7RL4-V',
      potenciaNominal: 550,
      larguraMm: 2278,
      alturaMm: 1134,
      espessuraMm: 35,
      vmpp: 41.8,
      impp: 13.16,
      voc: 49.7,
      isc: 13.98,
      tipoCelula: 'Monocristalino PERC',
      eficiencia: 21.2,
      numeroCelulas: 144,
      tempCoefPmax: -0.40,
      tempCoefVoc: -0.27,
      tempCoefIsc: 0.048,
      pesoKg: 27.5,
      certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC'],
      garantiaAnos: 25,
      tolerancia: '+5/-0%'
    },
    {
      fabricante: 'Canadian Solar',
      modelo: 'CS3W-540MS',
      potenciaNominal: 540,
      larguraMm: 2261,
      alturaMm: 1134,
      espessuraMm: 35,
      vmpp: 41.4,
      impp: 13.04,
      voc: 49.8,
      isc: 13.8,
      tipoCelula: 'Monocristalino PERC',
      eficiencia: 20.9,
      numeroCelulas: 144,
      tempCoefPmax: -0.37,
      tempCoefVoc: -0.26,
      tempCoefIsc: 0.05,
      pesoKg: 27.2,
      certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC'],
      garantiaAnos: 25,
      tolerancia: '+5/-0%'
    },
    {
      fabricante: 'Trina Solar',
      modelo: 'TSM-545DEG21C.20',
      potenciaNominal: 545,
      larguraMm: 2279,
      alturaMm: 1134,
      espessuraMm: 35,
      vmpp: 41.6,
      impp: 13.10,
      voc: 49.9,
      isc: 13.85,
      tipoCelula: 'Monocristalino PERC',
      eficiencia: 21.0,
      numeroCelulas: 144,
      tempCoefPmax: -0.35,
      tempCoefVoc: -0.25,
      tempCoefIsc: 0.045,
      pesoKg: 27.8,
      certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC'],
      garantiaAnos: 25,
      tolerancia: '+5/-0%'
    },
    {
      fabricante: 'Risen Energy',
      modelo: 'RSM144-8-550M',
      potenciaNominal: 550,
      larguraMm: 2278,
      alturaMm: 1134,
      espessuraMm: 35,
      vmpp: 41.7,
      impp: 13.19,
      voc: 49.8,
      isc: 13.95,
      tipoCelula: 'Monocristalino PERC',
      eficiencia: 21.3,
      numeroCelulas: 144,
      tempCoefPmax: -0.36,
      tempCoefVoc: -0.26,
      tempCoefIsc: 0.048,
      pesoKg: 27.6,
      certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC'],
      garantiaAnos: 25,
      tolerancia: '+5/-0%'
    },
    {
      fabricante: 'JA Solar',
      modelo: 'JAM72D30-550/MB',
      potenciaNominal: 550,
      larguraMm: 2279,
      alturaMm: 1134,
      espessuraMm: 35,
      vmpp: 41.9,
      impp: 13.13,
      voc: 50.1,
      isc: 13.88,
      tipoCelula: 'Monocristalino PERC',
      eficiencia: 21.1,
      numeroCelulas: 144,
      tempCoefPmax: -0.38,
      tempCoefVoc: -0.27,
      tempCoefIsc: 0.047,
      pesoKg: 27.9,
      certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC'],
      garantiaAnos: 25,
      tolerancia: '+5/-0%'
    },
    {
      fabricante: 'LONGi Solar',
      modelo: 'LR5-72HTH-545M',
      potenciaNominal: 545,
      larguraMm: 2278,
      alturaMm: 1134,
      espessuraMm: 35,
      vmpp: 41.5,
      impp: 13.13,
      voc: 49.6,
      isc: 13.92,
      tipoCelula: 'Monocristalino PERC',
      eficiencia: 21.0,
      numeroCelulas: 144,
      tempCoefPmax: -0.35,
      tempCoefVoc: -0.26,
      tempCoefIsc: 0.048,
      pesoKg: 27.4,
      certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC'],
      garantiaAnos: 25,
      tolerancia: '+5/-0%'
    }
  ];

  private static invertersData = [
    {
      fabricante: 'Fronius',
      modelo: 'Primo 8.2-1',
      potenciaSaidaCA: 8200,
      tipoRede: 'Monofásico',
      potenciaFvMax: 12300,
      tensaoCcMax: 1000,
      numeroMppt: 2,
      stringsPorMppt: 2,
      faixaMppt: '200-800V',
      correnteEntradaMax: 16,
      potenciaAparenteMax: 8200,
      correnteSaidaMax: 36.1,
      tensaoSaidaNominal: '220V',
      frequenciaNominal: 60,
      eficienciaMax: 96.8,
      eficienciaEuropeia: 96.3,
      eficienciaMppt: 99.5,
      protecoes: ['Sobretensão AC/DC', 'Subtensão AC/DC', 'Sobrefrequência', 'Subfrequência', 'Anti-ilhamento'],
      certificacoes: ['IEC 62109-1', 'IEC 62109-2', 'ABNT NBR 16149'],
      grauProtecao: 'IP65',
      dimensoes: {
        larguraMm: 645,
        alturaMm: 431,
        profundidadeMm: 204
      },
      pesoKg: 22.0,
      temperaturaOperacao: '-25°C a +60°C',
      garantiaAnos: 5,
      tipoFase: 'monofásico' as const
    },
    {
      fabricante: 'SMA',
      modelo: 'Sunny Boy 8.0-1 AV-40',
      potenciaSaidaCA: 8000,
      tipoRede: 'Monofásico',
      potenciaFvMax: 12000,
      tensaoCcMax: 1000,
      numeroMppt: 2,
      stringsPorMppt: 2,
      faixaMppt: '175-800V',
      correnteEntradaMax: 15,
      potenciaAparenteMax: 8000,
      correnteSaidaMax: 34.8,
      tensaoSaidaNominal: '230V',
      frequenciaNominal: 50,
      eficienciaMax: 97.1,
      eficienciaEuropeia: 96.6,
      eficienciaMppt: 99.5,
      protecoes: ['Sobretensão AC/DC', 'Subtensão AC/DC', 'Sobrefrequência', 'Subfrequência', 'Anti-ilhamento'],
      certificacoes: ['IEC 62109-1', 'IEC 62109-2', 'ABNT NBR 16149'],
      grauProtecao: 'IP65',
      dimensoes: {
        larguraMm: 460,
        alturaMm: 610,
        profundidadeMm: 190
      },
      pesoKg: 24.5,
      temperaturaOperacao: '-25°C a +60°C',
      garantiaAnos: 5,
      tipoFase: 'monofásico' as const
    },
    {
      fabricante: 'ABB',
      modelo: 'UNO-DM-8.0-TL-PLUS',
      potenciaSaidaCA: 8000,
      tipoRede: 'Monofásico',
      potenciaFvMax: 12000,
      tensaoCcMax: 1000,
      numeroMppt: 2,
      stringsPorMppt: 1,
      faixaMppt: '200-800V',
      correnteEntradaMax: 20,
      potenciaAparenteMax: 8000,
      correnteSaidaMax: 34.8,
      tensaoSaidaNominal: '230V',
      frequenciaNominal: 50,
      eficienciaMax: 96.5,
      eficienciaEuropeia: 96.1,
      eficienciaMppt: 99.4,
      protecoes: ['Sobretensão AC/DC', 'Subtensão AC/DC', 'Sobrefrequência', 'Subfrequência', 'Anti-ilhamento'],
      certificacoes: ['IEC 62109-1', 'IEC 62109-2', 'ABNT NBR 16149'],
      grauProtecao: 'IP65',
      dimensoes: {
        larguraMm: 580,
        alturaMm: 445,
        profundidadeMm: 205
      },
      pesoKg: 25.8,
      temperaturaOperacao: '-40°C a +70°C',
      garantiaAnos: 5,
      tipoFase: 'monofásico' as const
    },
    {
      fabricante: 'Growatt',
      modelo: 'MIN 10000TL-X',
      potenciaSaidaCA: 10000,
      tipoRede: 'Trifásico',
      potenciaFvMax: 15000,
      tensaoCcMax: 1000,
      numeroMppt: 2,
      stringsPorMppt: 2,
      faixaMppt: '200-850V',
      correnteEntradaMax: 12.5,
      potenciaAparenteMax: 10000,
      correnteSaidaMax: 14.5,
      tensaoSaidaNominal: '380V',
      frequenciaNominal: 60,
      eficienciaMax: 98.4,
      eficienciaEuropeia: 97.8,
      eficienciaMppt: 99.9,
      protecoes: ['Sobretensão AC/DC', 'Subtensão AC/DC', 'Sobrefrequência', 'Subfrequência', 'Anti-ilhamento', 'Monitoramento de isolamento'],
      certificacoes: ['IEC 62109-1', 'IEC 62109-2', 'ABNT NBR 16149'],
      grauProtecao: 'IP65',
      dimensoes: {
        larguraMm: 430,
        alturaMm: 490,
        profundidadeMm: 185
      },
      pesoKg: 18.5,
      temperaturaOperacao: '-25°C a +60°C',
      garantiaAnos: 10,
      tipoFase: 'trifásico' as const
    },
    {
      fabricante: 'Huawei',
      modelo: 'SUN2000-10KTL-M1',
      potenciaSaidaCA: 10000,
      tipoRede: 'Trifásico',
      potenciaFvMax: 15000,
      tensaoCcMax: 1100,
      numeroMppt: 4,
      stringsPorMppt: 2,
      faixaMppt: '200-950V',
      correnteEntradaMax: 11,
      potenciaAparenteMax: 10000,
      correnteSaidaMax: 14.5,
      tensaoSaidaNominal: '380V',
      frequenciaNominal: 60,
      eficienciaMax: 98.6,
      eficienciaEuropeia: 98.1,
      eficienciaMppt: 99.9,
      protecoes: ['Sobretensão AC/DC', 'Subtensão AC/DC', 'Sobrefrequência', 'Subfrequência', 'Anti-ilhamento', 'Arc Fault Detection'],
      certificacoes: ['IEC 62109-1', 'IEC 62109-2', 'ABNT NBR 16149'],
      grauProtecao: 'IP65',
      dimensoes: {
        larguraMm: 365,
        alturaMm: 560,
        profundidadeMm: 156
      },
      pesoKg: 17.0,
      temperaturaOperacao: '-25°C a +60°C',
      garantiaAnos: 10,
      tipoFase: 'trifásico' as const
    }
  ];

  static async seedSolarModules(userId?: string): Promise<void> {
    console.log('🌱 Seeding solar modules...');
    
    // Se não especificar userId, usar um ID especial para equipamentos públicos
    const targetUserId = userId || 'public-equipment-system';
    
    for (const moduleData of this.solarModulesData) {
      const existingModule = await SolarModuleModel.findOne({
        fabricante: moduleData.fabricante,
        modelo: moduleData.modelo,
        userId: targetUserId
      });

      if (!existingModule) {
        const newModule = new SolarModuleModel({
          ...moduleData,
          userId: targetUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await newModule.save();
        console.log(`✅ Created solar module: ${moduleData.fabricante} ${moduleData.modelo}`);
      } else {
        console.log(`⏭️  Solar module already exists: ${moduleData.fabricante} ${moduleData.modelo}`);
      }
    }
  }

  static async seedInverters(userId?: string): Promise<void> {
    console.log('🌱 Seeding inverters...');
    
    // Se não especificar userId, usar um ID especial para equipamentos públicos
    const targetUserId = userId || 'public-equipment-system';
    
    for (const inverterData of this.invertersData) {
      const existingInverter = await InverterModel.findOne({
        fabricante: inverterData.fabricante,
        modelo: inverterData.modelo,
        userId: targetUserId
      });

      if (!existingInverter) {
        const newInverter = new InverterModel({
          ...inverterData,
          userId: targetUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await newInverter.save();
        console.log(`✅ Created inverter: ${inverterData.fabricante} ${inverterData.modelo}`);
      } else {
        console.log(`⏭️  Inverter already exists: ${inverterData.fabricante} ${inverterData.modelo}`);
      }
    }
  }

  static async seedAll(userId?: string): Promise<void> {
    console.log('🚀 Starting equipment seeding...');
    try {
      await this.seedSolarModules(userId);
      await this.seedInverters(userId);
      console.log('✅ Equipment seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error seeding equipment:', error);
      throw error;
    }
  }
}