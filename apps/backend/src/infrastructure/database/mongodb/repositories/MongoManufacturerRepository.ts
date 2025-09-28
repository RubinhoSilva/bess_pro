import { IManufacturerRepository } from '../../../../domain/repositories/IManufacturerRepository';
import { Manufacturer, ManufacturerData, ManufacturerType } from '../../../../domain/entities/Manufacturer';
import { ManufacturerModel } from '../schemas/ManufacturerSchema';

export class MongoManufacturerRepository implements IManufacturerRepository {
  
  async create(manufacturer: Manufacturer): Promise<Manufacturer> {
    const manufacturerDoc = new ManufacturerModel(manufacturer.toJSON());
    const savedDoc = await manufacturerDoc.save();
    
    return new Manufacturer({
      ...savedDoc.toObject(),
      id: savedDoc._id?.toString()
    });
  }

  async findById(id: string): Promise<Manufacturer | null> {
    const doc = await ManufacturerModel.findById(id);
    if (!doc) return null;
    
    return new Manufacturer({
      ...doc.toObject(),
      id: doc._id?.toString()
    });
  }

  async findByName(name: string, teamId?: string): Promise<Manufacturer | null> {
    const filter: any = {
      name: new RegExp(`^${name}$`, 'i')
    };

    // Se teamId for fornecido, buscar apenas fabricantes padrão ou do time específico
    if (teamId) {
      filter.$or = [
        { isDefault: true },
        { teamId: teamId }
      ];
    } else {
      // Se não há teamId, buscar apenas fabricantes padrão
      filter.isDefault = true;
    }

    const doc = await ManufacturerModel.findOne(filter);
    if (!doc) return null;

    return new Manufacturer({
      ...doc.toObject(),
      id: doc._id?.toString()
    });
  }

  async findByType(type: ManufacturerType, teamId?: string): Promise<Manufacturer[]> {
    const filter: any = {
      $or: [
        { type: type },
        { type: ManufacturerType.BOTH }
      ]
    };

    // Construir filtro de acesso baseado no time
    if (teamId) {
      filter.$and = [{
        $or: [
          { isDefault: true },
          { teamId: teamId }
        ]
      }];
    } else {
      filter.isDefault = true;
    }

    const docs = await ManufacturerModel.find(filter).sort({ name: 1 });

    return docs.map(doc => new Manufacturer({
      ...doc.toObject(),
      id: doc._id?.toString()
    }));
  }

  async findAccessibleByTeam(teamId?: string): Promise<Manufacturer[]> {
    const filter: any = {};

    if (teamId) {
      filter.$or = [
        { isDefault: true },
        { teamId: teamId }
      ];
    } else {
      filter.isDefault = true;
    }

    const docs = await ManufacturerModel.find(filter).sort({ name: 1 });

    return docs.map(doc => new Manufacturer({
      ...doc.toObject(),
      id: doc._id?.toString()
    }));
  }

  async findDefaults(): Promise<Manufacturer[]> {
    const docs = await ManufacturerModel.find({ isDefault: true }).sort({ name: 1 });

    return docs.map(doc => new Manufacturer({
      ...doc.toObject(),
      id: doc._id?.toString()
    }));
  }

  async update(id: string, manufacturer: Manufacturer): Promise<Manufacturer | null> {
    const doc = await ManufacturerModel.findByIdAndUpdate(
      id,
      { ...manufacturer.toJSON(), updatedAt: new Date() },
      { new: true }
    );
    
    if (!doc) return null;

    return new Manufacturer({
      ...doc.toObject(),
      id: doc._id?.toString()
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await ManufacturerModel.findByIdAndDelete(id);
    return !!result;
  }

  async exists(name: string, excludeId?: string, teamId?: string): Promise<boolean> {
    const filter: any = {
      name: new RegExp(`^${name}$`, 'i')
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    // Verificar existência considerando o escopo do time
    if (teamId) {
      filter.$or = [
        { isDefault: true },
        { teamId: teamId }
      ];
    } else {
      filter.isDefault = true;
    }

    const count = await ManufacturerModel.countDocuments(filter);
    return count > 0;
  }
}