import { EnergyCompanyModel } from '../mongodb/schemas/EnergyCompanySchema';

export class EnergyCompanySeeder {
  static async seed(): Promise<void> {
    const existingCount = await EnergyCompanyModel.countDocuments();
    
    if (existingCount > 0) {
      console.log('✅ Concessionárias já existem no banco. Pulando seed...');
      return;
    }

    const energyCompanies = [
      // Região Sudeste
      {
        name: 'Companhia Paulista de Força e Luz',
        acronym: 'CPFL',
        region: 'Sudeste',
        states: ['SP'],
        tariffB1: 0.82,
        tariffB3: 0.71,
        tariffC: 0.89,
        wireB: 0.45,
        distributionCharge: 0.15,
        isActive: true
      },
      {
        name: 'Enel Distribuição São Paulo',
        acronym: 'ENEL-SP',
        region: 'Sudeste',
        states: ['SP'],
        tariffB1: 0.85,
        tariffB3: 0.74,
        tariffC: 0.92,
        wireB: 0.47,
        distributionCharge: 0.16,
        isActive: true
      },
      {
        name: 'Light Serviços de Eletricidade',
        acronym: 'LIGHT',
        region: 'Sudeste',
        states: ['RJ'],
        tariffB1: 0.88,
        tariffB3: 0.76,
        tariffC: 0.95,
        wireB: 0.49,
        distributionCharge: 0.18,
        isActive: true
      },
      {
        name: 'Cemig Distribuição',
        acronym: 'CEMIG',
        region: 'Sudeste',
        states: ['MG'],
        tariffB1: 0.79,
        tariffB3: 0.69,
        tariffC: 0.86,
        wireB: 0.43,
        distributionCharge: 0.14,
        isActive: true
      },
      {
        name: 'Espírito Santo Centrais Elétricas',
        acronym: 'ESCELSA',
        region: 'Sudeste',
        states: ['ES'],
        tariffB1: 0.81,
        tariffB3: 0.70,
        tariffC: 0.88,
        wireB: 0.44,
        distributionCharge: 0.15,
        isActive: true
      },

      // Região Sul
      {
        name: 'Companhia Paranaense de Energia',
        acronym: 'COPEL',
        region: 'Sul',
        states: ['PR'],
        tariffB1: 0.75,
        tariffB3: 0.65,
        tariffC: 0.82,
        wireB: 0.41,
        distributionCharge: 0.13,
        isActive: true
      },
      {
        name: 'Companhia Estadual de Energia Elétrica',
        acronym: 'CEEE',
        region: 'Sul',
        states: ['RS'],
        tariffB1: 0.77,
        tariffB3: 0.67,
        tariffC: 0.84,
        wireB: 0.42,
        distributionCharge: 0.13,
        isActive: true
      },
      {
        name: 'Centrais Elétricas de Santa Catarina',
        acronym: 'CELESC',
        region: 'Sul',
        states: ['SC'],
        tariffB1: 0.76,
        tariffB3: 0.66,
        tariffC: 0.83,
        wireB: 0.41,
        distributionCharge: 0.13,
        isActive: true
      },

      // Região Nordeste
      {
        name: 'Companhia Energética do Ceará',
        acronym: 'COELCE',
        region: 'Nordeste',
        states: ['CE'],
        tariffB1: 0.73,
        tariffB3: 0.63,
        tariffC: 0.80,
        wireB: 0.39,
        distributionCharge: 0.12,
        isActive: true
      },
      {
        name: 'Companhia Energética de Pernambuco',
        acronym: 'CELPE',
        region: 'Nordeste',
        states: ['PE'],
        tariffB1: 0.74,
        tariffB3: 0.64,
        tariffC: 0.81,
        wireB: 0.40,
        distributionCharge: 0.12,
        isActive: true
      },
      {
        name: 'Companhia de Eletricidade da Bahia',
        acronym: 'COELBA',
        region: 'Nordeste',
        states: ['BA'],
        tariffB1: 0.72,
        tariffB3: 0.62,
        tariffC: 0.79,
        wireB: 0.38,
        distributionCharge: 0.12,
        isActive: true
      },
      {
        name: 'Companhia Energética do Rio Grande do Norte',
        acronym: 'COSERN',
        region: 'Nordeste',
        states: ['RN'],
        tariffB1: 0.75,
        tariffB3: 0.65,
        tariffC: 0.82,
        wireB: 0.41,
        distributionCharge: 0.13,
        isActive: true
      },

      // Região Centro-Oeste
      {
        name: 'Companhia Energética de Brasília',
        acronym: 'CEB',
        region: 'Centro-Oeste',
        states: ['DF'],
        tariffB1: 0.78,
        tariffB3: 0.68,
        tariffC: 0.85,
        wireB: 0.42,
        distributionCharge: 0.14,
        isActive: true
      },
      {
        name: 'Centrais Elétricas Matogrossenses',
        acronym: 'CEMAT',
        region: 'Centro-Oeste',
        states: ['MT'],
        tariffB1: 0.76,
        tariffB3: 0.66,
        tariffC: 0.83,
        wireB: 0.41,
        distributionCharge: 0.13,
        isActive: true
      },
      {
        name: 'Companhia Energética de Goiás',
        acronym: 'CELG',
        region: 'Centro-Oeste',
        states: ['GO'],
        tariffB1: 0.77,
        tariffB3: 0.67,
        tariffC: 0.84,
        wireB: 0.42,
        distributionCharge: 0.13,
        isActive: true
      },

      // Região Norte
      {
        name: 'Centrais Elétricas do Pará',
        acronym: 'CELPA',
        region: 'Norte',
        states: ['PA'],
        tariffB1: 0.80,
        tariffB3: 0.70,
        tariffC: 0.87,
        wireB: 0.44,
        distributionCharge: 0.15,
        isActive: true
      },
      {
        name: 'Companhia de Eletricidade do Amazonas',
        acronym: 'CEA',
        region: 'Norte',
        states: ['AM'],
        tariffB1: 0.79,
        tariffB3: 0.69,
        tariffC: 0.86,
        wireB: 0.43,
        distributionCharge: 0.14,
        isActive: true
      },

      // Concessionárias Multi-Estados
      {
        name: 'Energisa Grupo',
        acronym: 'ENERGISA',
        region: 'Multi-Regional',
        states: ['MS', 'MT', 'RO', 'AC', 'TO', 'SE', 'PB', 'RN'],
        tariffB1: 0.78,
        tariffB3: 0.68,
        tariffC: 0.85,
        wireB: 0.42,
        distributionCharge: 0.14,
        isActive: true
      },
      {
        name: 'Equatorial Energia',
        acronym: 'EQUATORIAL',
        region: 'Multi-Regional',
        states: ['MA', 'PI', 'AL', 'PA'],
        tariffB1: 0.74,
        tariffB3: 0.64,
        tariffC: 0.81,
        wireB: 0.40,
        distributionCharge: 0.12,
        isActive: true
      }
    ];

    try {
      await EnergyCompanyModel.insertMany(energyCompanies);
      console.log(`✅ ${energyCompanies.length} concessionárias de energia criadas com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao criar concessionárias:', error);
      throw error;
    }
  }
}