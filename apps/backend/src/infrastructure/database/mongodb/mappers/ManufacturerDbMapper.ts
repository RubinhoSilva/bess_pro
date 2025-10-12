import { Manufacturer } from '../../../../domain/entities/Manufacturer';
import { IManufacturerDocument } from '../schemas/ManufacturerSchema';
import { RepositoryMapper } from '../repositories/base/MongoBaseRepository';

export class ManufacturerDbMapper implements RepositoryMapper<Manufacturer, IManufacturerDocument> {
  
  toDomain(doc: IManufacturerDocument): Manufacturer {
    const obj = doc.toObject();
    return new Manufacturer({
      ...obj,
      id: doc._id?.toString()
    });
  }

  toPersistence(entity: Manufacturer): Partial<IManufacturerDocument> {
    return entity.toJSON();
  }

  toUpdate(entity: Manufacturer): Partial<IManufacturerDocument> {
    const data = entity.toJSON();
    
    // Remover campos que não devem ser atualizados
    const { id, createdAt, ...updateData } = data;
    
    return {
      ...updateData,
      updatedAt: new Date()
    } as Partial<IManufacturerDocument>;
  }
}