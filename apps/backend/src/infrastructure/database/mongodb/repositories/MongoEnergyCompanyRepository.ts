import { IEnergyCompanyRepository } from '../../../../domain/repositories/IEnergyCompanyRepository';
import { EnergyCompany } from '../../../../domain/entities/EnergyCompany';
import { EnergyCompanyModel } from '../schemas/EnergyCompanySchema';

export class MongoEnergyCompanyRepository implements IEnergyCompanyRepository {
  async findAll(): Promise<EnergyCompany[]> {
    const companies = await EnergyCompanyModel.find().sort({ name: 1 }).exec();
    return companies.map(this.toDomainEntity);
  }

  async findActiveCompanies(): Promise<EnergyCompany[]> {
    const companies = await EnergyCompanyModel.find({ isActive: true }).sort({ name: 1 }).exec();
    return companies.map(this.toDomainEntity);
  }

  async findById(id: string): Promise<EnergyCompany | null> {
    const company = await EnergyCompanyModel.findById(id).exec();
    return company ? this.toDomainEntity(company) : null;
  }

  async findByAcronym(acronym: string): Promise<EnergyCompany | null> {
    const company = await EnergyCompanyModel.findOne({ acronym: acronym.toUpperCase() }).exec();
    return company ? this.toDomainEntity(company) : null;
  }

  async findByState(state: string): Promise<EnergyCompany[]> {
    const companies = await EnergyCompanyModel.find({
      states: { $in: [state.toUpperCase()] },
      isActive: true
    }).sort({ name: 1 }).exec();
    return companies.map(this.toDomainEntity);
  }

  async create(data: Omit<EnergyCompany, 'id' | 'createdAt' | 'updatedAt'>): Promise<EnergyCompany> {
    const company = new EnergyCompanyModel({
      name: data.name,
      acronym: data.acronym,
      region: data.region,
      states: data.states,
      tariffB1: data.tariffB1,
      tariffB3: data.tariffB3,
      tariffC: data.tariffC,
      wireB: data.wireB,
      distributionCharge: data.distributionCharge,
      isActive: data.isActive
    });

    const savedCompany = await company.save();
    return this.toDomainEntity(savedCompany);
  }

  async update(id: string, data: Partial<EnergyCompany>): Promise<EnergyCompany | null> {
    const updatedCompany = await EnergyCompanyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name,
          acronym: data.acronym,
          region: data.region,
          states: data.states,
          tariffB1: data.tariffB1,
          tariffB3: data.tariffB3,
          tariffC: data.tariffC,
          wireB: data.wireB,
          distributionCharge: data.distributionCharge,
          isActive: data.isActive,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).exec();

    return updatedCompany ? this.toDomainEntity(updatedCompany) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await EnergyCompanyModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  private toDomainEntity(model: any): EnergyCompany {
    return {
      id: model._id.toString(),
      name: model.name,
      acronym: model.acronym,
      region: model.region,
      states: model.states,
      tariffB1: model.tariffB1,
      tariffB3: model.tariffB3,
      tariffC: model.tariffC,
      wireB: model.wireB,
      distributionCharge: model.distributionCharge,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    };
  }
}