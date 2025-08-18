import { ITeamRepository, TeamFilters } from "../../../../domain/repositories/ITeamRepository";
import { Team } from "../../../../domain/entities/Team";
import { TeamModel, TeamDocument } from "../schemas/TeamSchema";
import { TeamDbMapper } from "../mappers/TeamDbMapper";

export class MongoTeamRepository implements ITeamRepository {
  async save(team: Team): Promise<Team> {
    const teamDoc = TeamDbMapper.toPersistence(team);
    const savedDoc = await TeamModel.create(teamDoc);
    return TeamDbMapper.toDomain(savedDoc);
  }

  async findById(id: string): Promise<Team | null> {
    const doc = await TeamModel.findById(id);
    if (!doc) return null;
    return TeamDbMapper.toDomain(doc);
  }

  async findByOwnerId(ownerId: string): Promise<Team[]> {
    const docs = await TeamModel.find({ ownerId }).sort({ createdAt: -1 });
    return docs.map(doc => TeamDbMapper.toDomain(doc));
  }

  async findAll(filters?: TeamFilters): Promise<Team[]> {
    const query: any = {};
    
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters?.ownerId) {
      query.ownerId = filters.ownerId;
    }
    if (filters?.planType) {
      query.planType = filters.planType;
    }

    const docs = await TeamModel.find(query).sort({ createdAt: -1 });
    return docs.map(doc => TeamDbMapper.toDomain(doc));
  }

  async update(id: string, team: Team): Promise<Team> {
    const teamDoc = TeamDbMapper.toPersistence(team);
    const updatedDoc = await TeamModel.findByIdAndUpdate(
      id,
      { ...teamDoc, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedDoc) {
      throw new Error('Team não encontrado');
    }
    
    return TeamDbMapper.toDomain(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    const result = await TeamModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Team não encontrado');
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await TeamModel.countDocuments({ _id: id });
    return count > 0;
  }
}