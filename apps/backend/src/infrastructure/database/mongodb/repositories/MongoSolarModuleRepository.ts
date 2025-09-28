import { ISolarModuleRepository } from '../../../../domain/repositories/ISolarModuleRepository';
import { SolarModule, SolarModuleData } from '../../../../domain/entities/SolarModule';
import { SolarModuleModel } from '../schemas/SolarModuleSchema';

export class MongoSolarModuleRepository implements ISolarModuleRepository {
  
  async create(moduleData: SolarModuleData): Promise<SolarModule> {
    const moduleDoc = new SolarModuleModel(moduleData);
    const savedDoc = await moduleDoc.save();
    
    const obj = savedDoc.toObject();
    return new SolarModule({
      ...obj,
      id: savedDoc._id?.toString().toString(),
      manufacturerId: obj.manufacturerId || ''
    });
  }

  async findById(id: string): Promise<SolarModule | null> {
    const doc = await SolarModuleModel.findById(id);
    if (!doc) return null;
    
    const obj = doc.toObject();
    return new SolarModule({
      ...obj,
      id: doc._id?.toString().toString(),
      manufacturerId: obj.manufacturerId || ''
    });
  }

  async findByUserId(
    userId: string, 
    options?: {
      searchTerm?: string;
      fabricante?: string;
      potenciaMin?: number;
      potenciaMax?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ modules: SolarModule[]; total: number }> {
    
    // Permitir acesso aos equipamentos do usuário E aos equipamentos públicos
    const filter: any = { 
      $or: [
        { userId: 'public-equipment-system' }
      ]
    };
    
    // Se o usuário estiver logado, incluir seus módulos também
    if (userId) {
      filter.$or.push({ userId: userId });
    }
    
    // Build search filters
    if (options?.fabricante) {
      filter.fabricante = new RegExp(options.fabricante, 'i');
    }
    
    if (options?.potenciaMin || options?.potenciaMax) {
      filter.potenciaNominal = {};
      if (options.potenciaMin) filter.potenciaNominal.$gte = options.potenciaMin;
      if (options.potenciaMax) filter.potenciaNominal.$lte = options.potenciaMax;
    }
    
    if (options?.searchTerm) {
      filter.$or = [
        { fabricante: new RegExp(options.searchTerm, 'i') },
        { modelo: new RegExp(options.searchTerm, 'i') },
        { tipoCelula: new RegExp(options.searchTerm, 'i') }
      ];
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [docs, total] = await Promise.all([
      SolarModuleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset),
      SolarModuleModel.countDocuments(filter)
    ]);

    const modules = docs.map(doc => {
      const obj = doc.toObject();
      return new SolarModule({
        ...obj,
        id: doc._id?.toString().toString(),
        manufacturerId: obj.manufacturerId || ''
      });
    });

    return { modules, total };
  }

  async update(id: string, updates: Partial<SolarModuleData>): Promise<SolarModule> {
    const doc = await SolarModuleModel.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!doc) {
      throw new Error('Módulo não encontrado');
    }

    const obj = doc.toObject();
    return new SolarModule({
      ...obj,
      id: doc._id?.toString().toString(),
      manufacturerId: obj.manufacturerId || ''
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await SolarModuleModel.findByIdAndDelete(id);
    return !!result;
  }

  async findByFabricanteModelo(
    fabricante: string, 
    modelo: string, 
    userId: string
  ): Promise<SolarModule | null> {
    const doc = await SolarModuleModel.findOne({
      userId,
      fabricante: new RegExp(`^${fabricante}$`, 'i'),
      modelo: new RegExp(`^${modelo}$`, 'i')
    });

    if (!doc) return null;

    const obj = doc.toObject();
    return new SolarModule({
      ...obj,
      id: doc._id?.toString().toString(),
      manufacturerId: obj.manufacturerId || ''
    });
  }

  async getMostUsedModules(userId: string, limit: number = 10): Promise<SolarModule[]> {
    // This would typically join with project/dimensioning data
    // For now, return most recently created
    const docs = await SolarModuleModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map(doc => {
      const obj = doc.toObject();
      return new SolarModule({
        ...obj,
        id: doc._id?.toString().toString(),
        manufacturerId: obj.manufacturerId || ''
      });
    });
  }

  async getModulesByPowerRange(
    userId: string, 
    minPower: number, 
    maxPower: number
  ): Promise<SolarModule[]> {
    const docs = await SolarModuleModel.find({
      userId,
      potenciaNominal: {
        $gte: minPower,
        $lte: maxPower
      }
    }).sort({ potenciaNominal: 1 });

    return docs.map(doc => {
      const obj = doc.toObject();
      return new SolarModule({
        ...obj,
        id: doc._id?.toString().toString(),
        manufacturerId: obj.manufacturerId || ''
      });
    });
  }

  async searchModules(userId: string, searchTerm: string): Promise<SolarModule[]> {
    const docs = await SolarModuleModel.find({
      userId,
      $text: { $search: searchTerm }
    }, {
      score: { $meta: 'textScore' }
    }).sort({
      score: { $meta: 'textScore' }
    }).limit(20);

    return docs.map(doc => {
      const obj = doc.toObject();
      return new SolarModule({
        ...obj,
        id: doc._id?.toString().toString(),
        manufacturerId: obj.manufacturerId || ''
      });
    });
  }

  async findByFilters(filters: {
    userId: string;
    search?: string;
    fabricante?: string;
    tipoCelula?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ modules: SolarModule[]; total: number }> {
    const { 
      userId, 
      search, 
      fabricante, 
      tipoCelula, 
      potenciaMin, 
      potenciaMax, 
      page = 1, 
      pageSize = 20 
    } = filters;

    // Permitir acesso aos equipamentos do usuário E aos equipamentos públicos
    const baseQuery: any = { 
      $or: [
        { userId: 'public-equipment-system' }
      ]
    };
    
    // Se o usuário estiver logado, incluir seus módulos também
    if (userId) {
      baseQuery.$or.push({ userId: userId });
    }

    const query: any = { $and: [baseQuery] };

    // Filtro de busca geral
    if (search) {
      query.$and.push({
        $or: [
          { fabricante: { $regex: search, $options: 'i' } },
          { modelo: { $regex: search, $options: 'i' } },
          { tipoCelula: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Filtros específicos
    if (fabricante) {
      query.$and.push({ fabricante: { $regex: fabricante, $options: 'i' } });
    }

    if (tipoCelula) {
      query.$and.push({ tipoCelula: { $regex: tipoCelula, $options: 'i' } });
    }

    if (potenciaMin !== undefined || potenciaMax !== undefined) {
      const potenciaFilter: any = {};
      if (potenciaMin !== undefined) {
        potenciaFilter.$gte = potenciaMin;
      }
      if (potenciaMax !== undefined) {
        potenciaFilter.$lte = potenciaMax;
      }
      query.$and.push({ potenciaNominal: potenciaFilter });
    }

    const skip = (page - 1) * pageSize;

    const [docs, total] = await Promise.all([
      SolarModuleModel.find(query).skip(skip).limit(pageSize).exec(),
      SolarModuleModel.countDocuments(query)
    ]);

    const modules = docs.map(doc => {
      const obj = doc.toObject();
      return new SolarModule({
        ...obj,
        id: doc._id?.toString(),
        manufacturerId: obj.manufacturerId || ''
      });
    });

    return { modules, total };
  }
}