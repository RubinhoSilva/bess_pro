import { SolarModule } from '../../../../domain/entities/SolarModule';
import { ISolarModuleDocument } from '../schemas/SolarModuleSchema';
import { RepositoryMapper } from '../repositories/base/MongoBaseRepository';

export class SolarModuleDbMapper implements RepositoryMapper<SolarModule, ISolarModuleDocument> {
  
  toDomain(doc: ISolarModuleDocument): SolarModule {
    const obj = doc.toObject();
    return new SolarModule({
      ...obj,
      id: doc._id?.toString(),
      manufacturerId: obj.manufacturerId
    });
  }

  toPersistence(entity: SolarModule): Partial<ISolarModuleDocument> {
    return entity.toJSON();
  }

  toUpdate(entity: SolarModule): Partial<ISolarModuleDocument> {
    const data = entity.toJSON();
    
    // Remover campos que não devem ser atualizados
    const { id, createdAt, userId, ...updateData } = data;
    
    return {
      ...updateData,
      updatedAt: new Date()
    } as Partial<ISolarModuleDocument>;
  }
}