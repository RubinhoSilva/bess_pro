import { IInverterRepository } from '../../../../domain/repositories/IInverterRepository';
import { Inverter, InverterData } from '../../../../domain/entities/Inverter';
import { InverterModel } from '../schemas/InverterSchema';

export class MongoInverterRepository implements IInverterRepository {

  private toInverter(doc: any): Inverter {
    const obj = doc.toObject();
    return new Inverter({
      ...obj,
      id: doc._id?.toString().toString(),
      manufacturerId: obj.manufacturerId || ''
    });
  }

  async create(inverterData: InverterData): Promise<Inverter> {
    const inverterDoc = new InverterModel(inverterData);
    const savedDoc = await inverterDoc.save();
    
    return this.toInverter(savedDoc);
  }

  async findById(id: string): Promise<Inverter | null> {
    const doc = await InverterModel.findById(id);
    if (!doc) return null;
    
    return this.toInverter(doc);
  }

  async findByUserId(
    userId: string, 
    options?: {
      searchTerm?: string;
      fabricante?: string;
      potenciaMin?: number;
      potenciaMax?: number;
      tipoRede?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ inverters: Inverter[]; total: number }> {
    
    // Permitir acesso aos equipamentos do usuário E aos equipamentos públicos
    const filter: any = { 
      $or: [
        { userId: 'public-equipment-system' }
      ]
    };
    
    // Se o usuário estiver logado, incluir seus inversores também
    if (userId) {
      filter.$or.push({ userId: userId });
    }
    
    // Build search filters
    if (options?.fabricante) {
      filter.fabricante = new RegExp(options.fabricante, 'i');
    }
    
    if (options?.tipoRede) {
      filter.tipoRede = new RegExp(options.tipoRede, 'i');
    }
    
    if (options?.potenciaMin || options?.potenciaMax) {
      filter.potenciaSaidaCA = {};
      if (options.potenciaMin) filter.potenciaSaidaCA.$gte = options.potenciaMin;
      if (options.potenciaMax) filter.potenciaSaidaCA.$lte = options.potenciaMax;
    }
    
    if (options?.searchTerm) {
      filter.$or = [
        { fabricante: new RegExp(options.searchTerm, 'i') },
        { modelo: new RegExp(options.searchTerm, 'i') },
        { tipoRede: new RegExp(options.searchTerm, 'i') }
      ];
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [docs, total] = await Promise.all([
      InverterModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset),
      InverterModel.countDocuments(filter)
    ]);

    const inverters = docs.map(doc => this.toInverter(doc));

    return { inverters, total };
  }

  async update(id: string, updates: Partial<InverterData>): Promise<Inverter> {
    const doc = await InverterModel.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!doc) {
      throw new Error('Inversor não encontrado');
    }

    return this.toInverter(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await InverterModel.findByIdAndDelete(id);
    return !!result;
  }

  async findByFabricanteModelo(
    fabricante: string, 
    modelo: string, 
    userId: string
  ): Promise<Inverter | null> {
    const doc = await InverterModel.findOne({
      userId,
      fabricante: new RegExp(`^${fabricante}$`, 'i'),
      modelo: new RegExp(`^${modelo}$`, 'i')
    });

    if (!doc) return null;

    return this.toInverter(doc);
  }

  async getMostUsedInverters(userId: string, limit: number = 10): Promise<Inverter[]> {
    // This would typically join with project/dimensioning data
    // For now, return most recently created
    const docs = await InverterModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map(doc => this.toInverter(doc));
  }

  async getInvertersByPowerRange(
    userId: string, 
    minPower: number, 
    maxPower: number
  ): Promise<Inverter[]> {
    const docs = await InverterModel.find({
      userId,
      potenciaSaidaCA: {
        $gte: minPower,
        $lte: maxPower
      }
    }).sort({ potenciaSaidaCA: 1 });

    return docs.map(doc => this.toInverter(doc));
  }

  async getCompatibleInverters(
    userId: string, 
    modulePower: number, 
    totalModules: number
  ): Promise<Inverter[]> {
    const totalSystemPower = modulePower * totalModules;
    const minInverterPower = totalSystemPower * 0.8; // 20% undersizing
    const maxInverterPower = totalSystemPower * 1.2; // 20% oversizing

    const docs = await InverterModel.find({
      userId,
      potenciaSaidaCA: {
        $gte: minInverterPower,
        $lte: maxInverterPower
      }
    }).sort({ potenciaSaidaCA: 1 });

    const inverters = docs.map(doc => this.toInverter(doc));

    // Filter by compatibility using business logic
    return inverters.filter(inverter => {
      const maxModulesSupported = inverter.calculateMaxModules(modulePower);
      return !maxModulesSupported || totalModules <= maxModulesSupported;
    });
  }

  async searchInverters(userId: string, searchTerm: string): Promise<Inverter[]> {
    const docs = await InverterModel.find({
      userId,
      $text: { $search: searchTerm }
    }, {
      score: { $meta: 'textScore' }
    }).sort({
      score: { $meta: 'textScore' }
    }).limit(20);

    return docs.map(doc => this.toInverter(doc));
  }

  async getInvertersByPhaseType(
    userId: string, 
    phaseType: 'monofásico' | 'bifásico' | 'trifásico'
  ): Promise<Inverter[]> {
    let regexPattern: string;
    
    switch (phaseType) {
      case 'monofásico':
        regexPattern = 'monofás|mono';
        break;
      case 'bifásico':
        regexPattern = 'bifás|bi';
        break;
      case 'trifásico':
        regexPattern = 'trifás|tri';
        break;
    }

    const docs = await InverterModel.find({
      userId,
      tipoRede: new RegExp(regexPattern, 'i')
    }).sort({ potenciaSaidaCA: 1 });

    return docs.map(doc => this.toInverter(doc));
  }

  async findByFilters(filters: {
    userId: string;
    search?: string;
    fabricante?: string;
    tipoRede?: string;
    potenciaMin?: number;
    potenciaMax?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ inverters: Inverter[]; total: number }> {
    const { 
      userId, 
      search, 
      fabricante, 
      tipoRede, 
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
    
    // Se o usuário estiver logado, incluir seus inversores também
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
          { tipoRede: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Filtros específicos
    if (fabricante) {
      query.$and.push({ fabricante: { $regex: fabricante, $options: 'i' } });
    }

    if (tipoRede) {
      query.$and.push({ tipoRede: { $regex: tipoRede, $options: 'i' } });
    }

    if (potenciaMin !== undefined || potenciaMax !== undefined) {
      const potenciaFilter: any = {};
      if (potenciaMin !== undefined) {
        potenciaFilter.$gte = potenciaMin;
      }
      if (potenciaMax !== undefined) {
        potenciaFilter.$lte = potenciaMax;
      }
      query.$and.push({ potenciaSaidaCA: potenciaFilter });
    }

    const skip = (page - 1) * pageSize;

    const [docs, total] = await Promise.all([
      InverterModel.find(query).skip(skip).limit(pageSize).exec(),
      InverterModel.countDocuments(query)
    ]);

    const inverters = docs.map(doc => new Inverter({
      ...doc.toObject(),
      id: doc._id?.toString()
    }));

    return { inverters, total };
  }
}