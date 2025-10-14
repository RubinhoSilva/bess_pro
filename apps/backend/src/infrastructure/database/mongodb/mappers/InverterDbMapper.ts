import { Inverter } from '../../../../domain/entities/Inverter';
import { IInverterDocument } from '../schemas/InverterSchema';
import { RepositoryMapper } from '../repositories/base/MongoBaseRepository';

export class InverterDbMapper implements RepositoryMapper<Inverter, IInverterDocument> {
  
  toDomain(doc: IInverterDocument): Inverter {
    const obj = doc.toObject();
    return new Inverter({
      ...obj,
      id: doc._id?.toString(),
      manufacturerId: obj.manufacturerId || ''
    });
  }

  toPersistence(entity: Inverter): Partial<IInverterDocument> {
    return entity.toJSON();
  }

  toUpdate(entity: Inverter): Partial<IInverterDocument> {
    const data = entity.toJSON();
    
    // Remover campos que não devem ser atualizados
    const { id, createdAt, teamId, ...updateData } = data;
    
    return {
      ...updateData,
      updatedAt: new Date()
    } as Partial<IInverterDocument>;
  }
}