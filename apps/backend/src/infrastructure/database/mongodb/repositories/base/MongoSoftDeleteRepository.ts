import { Model, Document } from 'mongoose';

export abstract class MongoSoftDeleteRepository<TDomain, TDocument extends Document> {
  protected model: Model<TDocument>;

  constructor(model: Model<TDocument>) {
    this.model = model;
  }

  protected abstract toDomain(doc: TDocument): TDomain;
  protected abstract toPersistence(entity: TDomain): Partial<TDocument>;

  async create(entity: TDomain): Promise<TDomain> {
    const persistenceData = this.toPersistence(entity);
    const doc = new this.model(persistenceData);
    const savedDoc = await doc.save();
    return this.toDomain(savedDoc);
  }

  async findById(id: string): Promise<TDomain | null> {
    const doc = await this.model.findOne({
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    } as any);
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<TDomain[]> {
    const docs = await this.model.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    } as any);
    return docs.map(doc => this.toDomain(doc));
  }

  async update(id: string, updateData: Partial<TDomain>): Promise<TDomain | null> {
    const persistenceData = updateData as any;
    persistenceData.updatedAt = new Date();
    
    const updatedDoc = await this.model.findOneAndUpdate(
      {
        _id: id,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      } as any,
      persistenceData,
      { new: true, runValidators: true }
    );

    return updatedDoc ? this.toDomain(updatedDoc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findOneAndUpdate(
      {
        _id: id,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      } as any,
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );

    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async count(filters: any = {}): Promise<number> {
    const query = {
      ...filters,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };
    return this.model.countDocuments(query);
  }

  async exists(id: string): Promise<boolean> {
    const doc = await this.model.findOne({
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    } as any);
    return !!doc;
  }
}