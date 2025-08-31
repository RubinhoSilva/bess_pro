import { IEnergyCompanyRepository } from '../../../domain/repositories/IEnergyCompanyRepository';
import { EnergyCompany } from '../../../domain/entities/EnergyCompany';

export interface CreateEnergyCompanyInput {
  name: string;
  acronym: string;
  region: string;
  states: string[];
  tariffB1?: number;
  tariffB3?: number;
  tariffC?: number;
  wireB?: number;
  distributionCharge?: number;
  isActive?: boolean;
}

export class CreateEnergyCompanyUseCase {
  constructor(private energyCompanyRepository: IEnergyCompanyRepository) {}

  async execute(input: CreateEnergyCompanyInput): Promise<EnergyCompany> {
    // Verificar se já existe uma concessionária com o mesmo acrônimo
    const existingCompany = await this.energyCompanyRepository.findByAcronym(input.acronym);
    if (existingCompany) {
      throw new Error(`Já existe uma concessionária com o acrônimo ${input.acronym}`);
    }

    // Validar estados (formato: SP, RJ, MG, etc.)
    const validStates = input.states.every(state => /^[A-Z]{2}$/.test(state.toUpperCase()));
    if (!validStates) {
      throw new Error('Estados devem ser informados no formato de 2 letras (ex: SP, RJ, MG)');
    }

    const energyCompanyData = {
      name: input.name.trim(),
      acronym: input.acronym.toUpperCase().trim(),
      region: input.region.trim(),
      states: input.states.map(state => state.toUpperCase().trim()),
      tariffB1: input.tariffB1,
      tariffB3: input.tariffB3,
      tariffC: input.tariffC,
      wireB: input.wireB,
      distributionCharge: input.distributionCharge,
      isActive: input.isActive !== undefined ? input.isActive : true
    };

    return await this.energyCompanyRepository.create(energyCompanyData);
  }
}