import { ICompanyProfileRepository } from '../../../../domain/repositories/ICompanyProfileRepository';
import { CompanyProfile } from '../../../../domain/entities/CompanyProfile';
import { CompanyProfileModel, ICompanyProfileDocument } from '../schemas/CompanyProfileSchema';
import { Types } from 'mongoose';

export class MongoCompanyProfileRepository implements ICompanyProfileRepository {
  async save(companyProfile: CompanyProfile): Promise<CompanyProfile> {
    const companyProfileDoc = this.toDbInsert(companyProfile);
    const createdDoc = await CompanyProfileModel.create(companyProfileDoc);
    return this.toDomain(createdDoc);
  }

  async create(companyProfile: CompanyProfile): Promise<CompanyProfile> {
    return this.save(companyProfile);
  }

  async findById(id: string): Promise<CompanyProfile | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const doc = await CompanyProfileModel.findOne({ _id: id, isDeleted: { $ne: true } });
    return doc ? this.toDomain(doc) : null;
  }

  async findByCompanyName(companyName: string): Promise<CompanyProfile | null> {
    const doc = await CompanyProfileModel.findOne({ 
      companyName: new RegExp(`^${companyName}$`, 'i'), 
      isDeleted: { $ne: true } 
    });
    return doc ? this.toDomain(doc) : null;
  }

  async findByTaxId(taxId: string): Promise<CompanyProfile | null> {
    const doc = await CompanyProfileModel.findOne({ 
      taxId, 
      isDeleted: { $ne: true } 
    });
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<CompanyProfile | null> {
    const doc = await CompanyProfileModel.findOne({
      email: email.toLowerCase(),
      isDeleted: { $ne: true }
    });
    return doc ? this.toDomain(doc) : null;
  }

  async findByTeamId(teamId: string): Promise<CompanyProfile | null> {
    const doc = await CompanyProfileModel.findOne({
      teamId,
      isDeleted: { $ne: true }
    });
    return doc ? this.toDomain(doc) : null;
  }


  async update(companyProfile: CompanyProfile): Promise<CompanyProfile> {
    const companyProfileId = companyProfile.getId();
    const updateData = this.toDbUpdate(companyProfile);
    
    const updatedDoc = await CompanyProfileModel.findByIdAndUpdate(
      companyProfileId,
      updateData,
      { new: true }
    );
    
    if (!updatedDoc) {
      throw new Error(`CompanyProfile with ID ${companyProfileId} not found`);
    }
    
    return this.toDomain(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    // Default delete is now soft delete
    await this.softDelete(id);
  }

  async softDelete(id: string): Promise<void> {
    const result = await CompanyProfileModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      throw new Error(`CompanyProfile with ID ${id} not found`);
    }
  }

  async restore(id: string): Promise<void> {
    const result = await CompanyProfileModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      throw new Error(`CompanyProfile with ID ${id} not found`);
    }
  }


  async exists(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const count = await CompanyProfileModel.countDocuments({ _id: id, isDeleted: { $ne: true } });
    return count > 0;
  }

  async existsByTaxId(taxId: string): Promise<boolean> {
    const count = await CompanyProfileModel.countDocuments({ taxId, isDeleted: { $ne: true } });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await CompanyProfileModel.countDocuments({ 
      email: email.toLowerCase(), 
      isDeleted: { $ne: true } 
    });
    return count > 0;
  }


  // Soft Delete Operations
  async findByIdIncludingDeleted(id: string): Promise<CompanyProfile | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const doc = await CompanyProfileModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findAllIncludingDeleted(): Promise<CompanyProfile[]> {
    const docs = await CompanyProfileModel.find().sort({ companyName: 1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findDeleted(): Promise<CompanyProfile[]> {
    const docs = await CompanyProfileModel.find({ isDeleted: true }).sort({ deletedAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async hardDelete(id: string): Promise<void> {
    const result = await CompanyProfileModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error(`CompanyProfile with ID ${id} not found`);
    }
  }

  async isDeleted(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const doc = await CompanyProfileModel.findById(id, 'isDeleted');
    return doc?.isDeleted || false;
  }

  // Private helper methods
  private toDomain(doc: ICompanyProfileDocument): CompanyProfile {
    return CompanyProfile.create({
      id: doc._id?.toString(),
      companyName: doc.companyName,
      tradingName: doc.tradingName,
      taxId: doc.taxId,
      stateRegistration: doc.stateRegistration,
      municipalRegistration: doc.municipalRegistration,
      phone: doc.phone,
      email: doc.email,
      logoUrl: doc.logoUrl,
      logoPath: doc.logoPath,
      website: doc.website,
      address: doc.address,
      city: doc.city,
      state: doc.state,
      zipCode: doc.zipCode,
      country: doc.country,
      isActive: doc.isActive,
      teamId: doc.teamId,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      mission: doc.mission,
      foundedYear: doc.foundedYear,
      completedProjectsCount: doc.completedProjectsCount,
      totalInstalledPower: doc.totalInstalledPower,
      satisfiedClientsCount: doc.satisfiedClientsCount,
      companyNotes: doc.companyNotes
    });
  }

  private toDbInsert(companyProfile: CompanyProfile): Partial<ICompanyProfileDocument> {
    return {
      domainId: companyProfile.getId(),
      companyName: companyProfile.getCompanyName(),
      tradingName: companyProfile.getTradingName(),
      taxId: companyProfile.getTaxId(),
      stateRegistration: companyProfile.getStateRegistration(),
      municipalRegistration: companyProfile.getMunicipalRegistration(),
      phone: companyProfile.getPhone(),
      email: companyProfile.getEmail(),
      logoUrl: companyProfile.getLogoUrl(),
      logoPath: companyProfile.getLogoPath(),
      website: companyProfile.getWebsite(),
      address: companyProfile.getAddress(),
      city: companyProfile.getCity(),
      state: companyProfile.getState(),
      zipCode: companyProfile.getZipCode(),
      country: companyProfile.getCountry(),
      isActive: companyProfile.getIsActive(),
      teamId: companyProfile.getTeamId(),
      isDeleted: companyProfile.isDeleted(),
      deletedAt: companyProfile.getDeletedAt(),
      createdAt: companyProfile.getCreatedAt(),
      updatedAt: companyProfile.getUpdatedAt(),
      mission: companyProfile.getMission(),
      foundedYear: companyProfile.getFoundedYear(),
      completedProjectsCount: companyProfile.getCompletedProjectsCount(),
      totalInstalledPower: companyProfile.getTotalInstalledPower(),
      satisfiedClientsCount: companyProfile.getSatisfiedClientsCount(),
      companyNotes: companyProfile.getCompanyNotes()
    };
  }

  private toDbUpdate(companyProfile: CompanyProfile): Partial<ICompanyProfileDocument> {
    return {
      companyName: companyProfile.getCompanyName(),
      tradingName: companyProfile.getTradingName(),
      taxId: companyProfile.getTaxId(),
      stateRegistration: companyProfile.getStateRegistration(),
      municipalRegistration: companyProfile.getMunicipalRegistration(),
      phone: companyProfile.getPhone(),
      email: companyProfile.getEmail(),
      logoUrl: companyProfile.getLogoUrl(),
      logoPath: companyProfile.getLogoPath(),
      website: companyProfile.getWebsite(),
      address: companyProfile.getAddress(),
      city: companyProfile.getCity(),
      state: companyProfile.getState(),
      zipCode: companyProfile.getZipCode(),
      country: companyProfile.getCountry(),
      isActive: companyProfile.getIsActive(),
      updatedAt: companyProfile.getUpdatedAt(),
      mission: companyProfile.getMission(),
      foundedYear: companyProfile.getFoundedYear(),
      completedProjectsCount: companyProfile.getCompletedProjectsCount(),
      totalInstalledPower: companyProfile.getTotalInstalledPower(),
      satisfiedClientsCount: companyProfile.getSatisfiedClientsCount(),
      companyNotes: companyProfile.getCompanyNotes()
    };
  }
}