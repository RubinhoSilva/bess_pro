import { IProjectRepository, ProjectSearchFilters, ProjectSummary } from '../../../../domain/repositories/IProjectRepository';
import { Project, ProjectType } from '../../../../domain/entities/Project';
import { ProjectId } from '../../../../domain/value-objects/ProjectId';
import { UserId } from '../../../../domain/value-objects/UserId';
import { Coordinates } from '../../../../domain/value-objects/Coordinates';
import { ProjectModel } from '../schemas/ProjectSchema';
import { ProjectDbMapper } from '../mappers/ProjectDbMapper';
import { Types } from 'mongoose';

export class MongoProjectRepository implements IProjectRepository {
  async save(project: Project): Promise<Project> {
    const dbData = ProjectDbMapper.toDbDocument(project);
    const doc = new ProjectModel(dbData);
    const savedDoc = await doc.save();
    return ProjectDbMapper.toDomain(savedDoc);
  }

  async update(project: Project): Promise<Project> {
    const updateData = ProjectDbMapper.toDbUpdate(project);
    const updatedDoc = await ProjectModel.findByIdAndUpdate(
      project.getId(),
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error('Projeto não encontrado para atualização');
    }

    return ProjectDbMapper.toDomain(updatedDoc);
  }

  async findById(id: string): Promise<Project | null> {
    const doc = await ProjectModel.findOne({ 
      _id: id, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    return doc ? ProjectDbMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async softDelete(id: string): Promise<void> {
    const result = await ProjectModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!result) {
      throw new Error('Projeto não encontrado para exclusão');
    }
  }

  async restore(id: string): Promise<void> {
    const result = await ProjectModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: false, 
        deletedAt: null,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!result) {
      throw new Error('Projeto não encontrado para restauração');
    }
  }

  async hardDelete(id: string): Promise<void> {
    const result = await ProjectModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Projeto não encontrado para exclusão permanente');
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await ProjectModel.countDocuments({ 
      _id: id, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    return count > 0;
  }

  async findByIdIncludingDeleted(id: string): Promise<Project | null> {
    const doc = await ProjectModel.findById(id);
    return doc ? ProjectDbMapper.toDomain(doc) : null;
  }

  async findAllIncludingDeleted(): Promise<Project[]> {
    const docs = await ProjectModel.find().sort({ createdAt: -1 });
    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async findDeleted(): Promise<Project[]> {
    const docs = await ProjectModel.find({ isDeleted: true }).sort({ deletedAt: -1 });
    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async isDeleted(id: string): Promise<boolean> {
    const doc = await ProjectModel.findById(id);
    return doc?.isDeleted || false;
  }

  async findByUserId(userId: UserId): Promise<Project[]> {
    const docs = await ProjectModel.find({ 
      userId: userId.getValue(), 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ savedAt: -1 });
    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async findByTypeAndUserId(projectType: ProjectType, userId: UserId): Promise<Project[]> {
    const docs = await ProjectModel.find({ 
      userId: userId.getValue(),
      projectType,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ savedAt: -1 });
    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async findByLeadId(leadId: string, userId: UserId): Promise<Project | null> {
    const doc = await ProjectModel.findOne({ 
      leadId, 
      userId: userId.getValue(),
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    return doc ? ProjectDbMapper.toDomain(doc) : null;
  }

  async findWithFilters(userId: UserId, filters: ProjectSearchFilters): Promise<Project[]> {
    const query: any = { 
      userId: userId.getValue(), 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };

    if (filters.projectType) {
      query.projectType = filters.projectType;
    }

    if (filters.hasLocation !== undefined) {
      if (filters.hasLocation) {
        query['projectData.location'] = { $exists: true, $ne: null };
      } else {
        query['projectData.location'] = { $exists: false };
      }
    }

    if (filters.hasLead !== undefined) {
      if (filters.hasLead) {
        query.leadId = { $exists: true, $ne: null };
      } else {
        query.leadId = { $exists: false };
      }
    }

    if (filters.searchTerm) {
      console.log('MongoProjectRepository - Applying searchTerm filter:', filters.searchTerm);
      
      // Criar variações do termo de busca para cobrir acentos
      const searchVariations = [
        filters.searchTerm,
        filters.searchTerm.replace(/[aáàâãä]/gi, '[aáàâãä]')
                          .replace(/[eéèêë]/gi, '[eéèêë]')
                          .replace(/[iíìîï]/gi, '[iíìîï]')
                          .replace(/[oóòôõö]/gi, '[oóòôõö]')
                          .replace(/[uúùûü]/gi, '[uúùûü]')
                          .replace(/[cç]/gi, '[cç]'),
        // Versão específica para testar Cópia/copia
        filters.searchTerm.toLowerCase() === 'copia' ? 'cópia' : filters.searchTerm,
        filters.searchTerm.toLowerCase() === 'cópia' ? 'copia' : filters.searchTerm
      ];
      
      console.log('MongoProjectRepository - Search variations:', searchVariations);
      
      const orConditions: any[] = [];
      searchVariations.forEach(variation => {
        orConditions.push(
          { projectName: { $regex: variation, $options: 'i' } },
          { address: { $regex: variation, $options: 'i' } }
        );
      });
      
      query.$or = orConditions;
    }

    if (filters.createdAfter) {
      query.createdAt = { $gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      if (query.createdAt) {
        query.createdAt.$lte = filters.createdBefore;
      } else {
        query.createdAt = { $lte: filters.createdBefore };
      }
    }

    console.log('MongoProjectRepository - Final query:', JSON.stringify(query, null, 2));
    
    // Debug: show all projects for this user first
    const allUserProjects = await ProjectModel.find({ 
      userId: userId.getValue(), 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ savedAt: -1 });
    console.log('MongoProjectRepository - All user projects:', allUserProjects.length);
    allUserProjects.forEach((doc, i) => {
      console.log(`MongoProjectRepository - All Project ${i}:`, { 
        id: doc._id, 
        projectName: doc.projectName, 
        projectType: doc.projectType,
        address: doc.address 
      });
    });
    
    const docs = await ProjectModel.find(query).sort({ savedAt: -1 });
    console.log('MongoProjectRepository - Found docs with filter:', docs.length);
    docs.forEach((doc, i) => {
      console.log(`MongoProjectRepository - Filtered Doc ${i}:`, { id: doc._id, projectName: doc.projectName, address: doc.address });
    });
    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async findSummariesByUserId(userId: UserId): Promise<ProjectSummary[]> {
    const docs = await ProjectModel.find(
      { 
        userId: userId.getValue(), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      },
      'projectName projectType address savedAt leadId projectData.location'
    ).sort({ savedAt: -1 });

    return docs.map(doc => ({
      id: doc._id?.toString().toString(),
      projectName: doc.projectName,
      projectType: doc.projectType as ProjectType,
      address: doc.address || '',
      savedAt: doc.savedAt,
      hasLocation: !!(doc.projectData && doc.projectData.location),
      leadId: doc.leadId?.toString(),
    }));
  }

  async findNearLocation(coordinates: Coordinates, radiusKm: number, userId?: UserId): Promise<Project[]> {
    const query: any = {
      'projectData.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [coordinates.getLongitude(), coordinates.getLatitude()]
          },
          $maxDistance: radiusKm * 1000 // Convert km to meters
        }
      }
    };

    if (userId) {
      query.userId = userId.getValue();
    }
    
    query.$or = [{ isDeleted: false }, { isDeleted: { $exists: false } }];

    const docs = await ProjectModel.find(query);
    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async findRecentlyModified(userId: UserId, daysAgo: number): Promise<Project[]> {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const docs = await ProjectModel.find({
      userId: userId.getValue(),
      updatedAt: { $gte: date },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ updatedAt: -1 });

    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async countByType(userId: UserId): Promise<Record<ProjectType, number>> {
    const pipeline = [
      { $match: { 
        userId: new Types.ObjectId(userId.getValue()), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      } },
      {
        $group: {
          _id: '$projectType',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await ProjectModel.aggregate(pipeline);
    const counts = { [ProjectType.PV]: 0, [ProjectType.BESS]: 0, [ProjectType.HYBRID]: 0 };
    
    for (const result of results) {
      counts[result._id as ProjectType] = result.count;
    }

    return counts;
  }

  async findByUserIdOrderedByPriority(userId: UserId): Promise<Project[]> {
    // MongoDB não tem a lógica de prioridade, então ordenamos por critérios
    const docs = await ProjectModel.find({ 
      userId: userId.getValue(), 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ 
      leadId: -1,  // Projetos com lead primeiro
      'projectData.location': -1,  // Com localização depois
      savedAt: -1  // Mais recentes por último
    });
    
    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async projectNameExists(projectName: string, userId: UserId, excludeProjectId?: ProjectId): Promise<boolean> {
    const query: any = {
      userId: userId.getValue(),
      projectName: { $regex: `^${projectName}$`, $options: 'i' },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };

    if (excludeProjectId) {
      query._id = { $ne: excludeProjectId.getValue() };
    }

    const count = await ProjectModel.countDocuments(query);
    return count > 0;
  }

  async findByRegion(userId: UserId, region: string): Promise<Project[]> {
    // Esta implementação dependeria de ter dados de região no projeto
    const docs = await ProjectModel.find({
      userId: userId.getValue(),
      'projectData.region': region,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ savedAt: -1 });

    return docs.map(doc => ProjectDbMapper.toDomain(doc));
  }

  async getProjectStats(userId: UserId): Promise<{
    total: number;
    byType: Record<ProjectType, number>;
    withLocation: number;
    withLead: number;
    avgPowerKWp: number;
    totalPowerKWp: number;
  }> {
    const pipeline = [
      { $match: { 
        userId: new Types.ObjectId(userId.getValue()), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pvCount: {
            $sum: { $cond: [{ $eq: ['$projectType', 'pv'] }, 1, 0] }
          },
          bessCount: {
            $sum: { $cond: [{ $eq: ['$projectType', 'bess'] }, 1, 0] }
          },
          withLocation: {
            $sum: { $cond: [{ $exists: '$projectData.location' }, 1, 0] }
          },
          withLead: {
            $sum: { $cond: [{ $exists: '$leadId' }, 1, 0] }
          },
          totalPower: {
            $sum: { $ifNull: ['$projectData.potenciaNominal', 0] }
          }
        }
      }
    ];

    const result = await ProjectModel.aggregate(pipeline);
    const stats = result[0] || {
      total: 0,
      pvCount: 0,
      bessCount: 0,
      withLocation: 0,
      withLead: 0,
      totalPower: 0
    };

    return {
      total: stats.total,
      byType: {
        [ProjectType.PV]: stats.pvCount,
        [ProjectType.BESS]: stats.bessCount,
        [ProjectType.HYBRID]: 0
      },
      withLocation: stats.withLocation,
      withLead: stats.withLead,
      avgPowerKWp: stats.total > 0 ? stats.totalPower / stats.total : 0,
      totalPowerKWp: stats.totalPower
    };
  }
}
