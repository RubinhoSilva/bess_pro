import { SolarModuleModel } from '../mongodb/schemas/SolarModuleSchema';
import { ManufacturerSeeder } from './ManufacturerSeeder';
import { SystemUsers } from '../../../domain/constants/SystemUsers';

export class SolarModuleSeeder {
  static async seed(): Promise<void> {
    console.log('🌱 Iniciando criação de módulos solares...');

    const solarModulesData = [
      // Jinko Solar
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
        tolerancia: '+5/-0%',
        material: 'c-Si',
        technology: 'mono-Si',
        aRef: 1.8,
        iLRef: 13.91,
        iORef: 3.712e-12,
        rS: 0.348,
        rShRef: 381.68,
        alphaSc: 0.0004,
        betaOc: -0.0028,
        gammaR: -0.0044,
        a0: -3.56, a1: -0.075, a2: 0.0, a3: 0.0, a4: 0.0,
        b0: 0.0, b1: 0.0, b2: 0.0, b3: 0.0, b4: 0.0, b5: 0.0,
        dtc: 3.0
      },
      {
        fabricante: 'Jinko Solar',
        modelo: 'JKM570M-7RL4-V',
        potenciaNominal: 570,
        larguraMm: 2278,
        alturaMm: 1134,
        espessuraMm: 35,
        vmpp: 43.2,
        impp: 13.20,
        voc: 51.4,
        isc: 14.02,
        tipoCelula: 'Monocristalino PERC',
        eficiencia: 22.0,
        numeroCelulas: 144,
        tempCoefPmax: -0.38,
        tempCoefVoc: -0.26,
        tempCoefIsc: 0.045,
        pesoKg: 28.0,
        certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703'],
        garantiaAnos: 25,
        tolerancia: '+5/-0%',
        material: 'c-Si',
        technology: 'mono-Si',
        aRef: 1.75,
        iLRef: 14.05,
        iORef: 2.85e-12,
        rS: 0.325,
        rShRef: 395.2,
        alphaSc: 0.00045,
        betaOc: -0.0026,
        gammaR: -0.0038,
        a0: -3.65, a1: -0.080, a2: 0.0, a3: 0.0, a4: 0.0,
        b0: 0.0, b1: 0.0, b2: 0.0, b3: 0.0, b4: 0.0, b5: 0.0,
        dtc: 3.2
      },

      // Canadian Solar
      {
        fabricante: 'Canadian Solar',
        modelo: 'CS6W-550MS',
        potenciaNominal: 550,
        larguraMm: 2261,
        alturaMm: 1134,
        espessuraMm: 35,
        vmpp: 41.7,
        impp: 13.19,
        voc: 49.8,
        isc: 13.95,
        tipoCelula: 'Monocristalino PERC',
        eficiencia: 21.4,
        numeroCelulas: 144,
        tempCoefPmax: -0.37,
        tempCoefVoc: -0.28,
        tempCoefIsc: 0.052,
        pesoKg: 27.8,
        certificacoes: ['IEC 61215', 'IEC 61730', 'UL 1703'],
        garantiaAnos: 25,
        tolerancia: '+5/-0%',
        material: 'c-Si',
        technology: 'mono-Si',
        aRef: 1.82,
        iLRef: 13.98,
        iORef: 3.5e-12,
        rS: 0.340,
        rShRef: 375.5,
        alphaSc: 0.00052,
        betaOc: -0.0028,
        gammaR: -0.0037,
        a0: -3.48, a1: -0.072, a2: 0.0, a3: 0.0, a4: 0.0,
        b0: 0.0, b1: 0.0, b2: 0.0, b3: 0.0, b4: 0.0, b5: 0.0,
        dtc: 2.9
      },

      // Trina Solar
      {
        fabricante: 'Trina Solar',
        modelo: 'TSM-550NEG9R.28',
        potenciaNominal: 550,
        larguraMm: 2187,
        alturaMm: 1102,
        espessuraMm: 35,
        vmpp: 41.8,
        impp: 13.16,
        voc: 49.6,
        isc: 13.92,
        tipoCelula: 'Monocristalino PERC',
        eficiencia: 22.8,
        numeroCelulas: 144,
        tempCoefPmax: -0.34,
        tempCoefVoc: -0.25,
        tempCoefIsc: 0.048,
        pesoKg: 26.8,
        certificacoes: ['IEC 61215', 'IEC 61730', 'VDE'],
        garantiaAnos: 25,
        tolerancia: '+5/-0%',
        material: 'c-Si',
        technology: 'mono-Si',
        aRef: 1.78,
        iLRef: 13.95,
        iORef: 2.9e-12,
        rS: 0.315,
        rShRef: 412.3,
        alphaSc: 0.00048,
        betaOc: -0.0025,
        gammaR: -0.0034,
        a0: -3.72, a1: -0.078, a2: 0.0, a3: 0.0, a4: 0.0,
        b0: 0.0, b1: 0.0, b2: 0.0, b3: 0.0, b4: 0.0, b5: 0.0,
        dtc: 3.1
      },

      // LONGi Solar
      {
        fabricante: 'LONGi Solar',
        modelo: 'LR5-72HIH-550M',
        potenciaNominal: 550,
        larguraMm: 2256,
        alturaMm: 1133,
        espessuraMm: 35,
        vmpp: 42.0,
        impp: 13.10,
        voc: 50.0,
        isc: 13.90,
        tipoCelula: 'Monocristalino PERC',
        eficiencia: 21.5,
        numeroCelulas: 144,
        tempCoefPmax: -0.35,
        tempCoefVoc: -0.26,
        tempCoefIsc: 0.050,
        pesoKg: 27.2,
        certificacoes: ['IEC 61215', 'IEC 61730', 'PVEL'],
        garantiaAnos: 25,
        tolerancia: '+3/-0%',
        material: 'c-Si',
        technology: 'mono-Si',
        aRef: 1.85,
        iLRef: 13.93,
        iORef: 3.2e-12,
        rS: 0.330,
        rShRef: 398.7,
        alphaSc: 0.00050,
        betaOc: -0.0026,
        gammaR: -0.0035,
        a0: -3.58, a1: -0.074, a2: 0.0, a3: 0.0, a4: 0.0,
        b0: 0.0, b1: 0.0, b2: 0.0, b3: 0.0, b4: 0.0, b5: 0.0,
        dtc: 3.0
      }
    ];

    console.log(`🌱 Verificando ${solarModulesData.length} módulos solares padrão...`);

    let createdCount = 0;
    let existingCount = 0;

    for (const moduleData of solarModulesData) {
      try {
        // Buscar o ID do fabricante
        const manufacturerId = await ManufacturerSeeder.getManufacturerIdByName(moduleData.fabricante);

        if (!manufacturerId) {
          console.error(`❌ Fabricante '${moduleData.fabricante}' não encontrado para o módulo ${moduleData.modelo}`);
          continue;
        }

        // Verificar se o módulo padrão já existe
        const existing = await SolarModuleModel.findOne({
          modelo: moduleData.modelo,
          manufacturerId,
          userId: SystemUsers.PUBLIC_EQUIPMENT
        });

        if (existing) {
          existingCount++;
          console.log(`⏭️  Módulo já existe: ${moduleData.fabricante} ${moduleData.modelo}`);
        } else {
          // Criar o módulo com o manufacturerId e userId padrão
          const moduleToCreate = {
            ...moduleData,
            manufacturerId,
            userId: SystemUsers.PUBLIC_EQUIPMENT, // ID padrão para equipamentos públicos
            // Corrigir gammaR para estar dentro dos limites (-0.001 a 0)
            gammaR: Math.max(-0.001, moduleData.gammaR || -0.001)
          };

          await SolarModuleModel.create(moduleToCreate);
          createdCount++;
          console.log(`✅ Módulo criado: ${moduleData.fabricante} ${moduleData.modelo}`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar módulo ${moduleData.modelo}:`, error.message);
      }
    }

    console.log(`🎉 Solar module seeding completed! Created: ${createdCount}, Already existed: ${existingCount}`);
  }
}