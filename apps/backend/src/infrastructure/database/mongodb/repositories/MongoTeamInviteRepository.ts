import { ITeamInviteRepository } from '../../../../domain/repositories/ITeamInviteRepository';
import { TeamInvite, CreateTeamInviteRequest } from '../../../../domain/entities/TeamInvite';
import { TeamInviteModel, TeamInviteDocument } from '../schemas/TeamInviteSchema';
import { TeamInviteDbMapper } from '../mappers/TeamInviteDbMapper';

export class MongoTeamInviteRepository implements ITeamInviteRepository {
  async create(
    teamId: string, 
    invitedBy: string, 
    data: CreateTeamInviteRequest, 
    token: string, 
    expiresAt: Date
  ): Promise<TeamInvite> {
    const document = new TeamInviteModel({
      teamId,
      invitedBy,
      token,
      expiresAt,
      ...data,
    });

    const savedDocument = await document.save();
    return TeamInviteDbMapper.toDomain(savedDocument);
  }

  async findById(id: string): Promise<TeamInvite | null> {
    const document = await TeamInviteModel.findById(id);
    return document ? TeamInviteDbMapper.toDomain(document) : null;
  }

  async findByToken(token: string): Promise<TeamInvite | null> {
    const document = await TeamInviteModel.findOne({ token });
    return document ? TeamInviteDbMapper.toDomain(document) : null;
  }

  async findByTeamId(teamId: string): Promise<TeamInvite[]> {
    const documents = await TeamInviteModel.find({ teamId }).sort({ createdAt: -1 });
    return documents.map(TeamInviteDbMapper.toDomain);
  }

  async findPendingByEmail(email: string): Promise<TeamInvite[]> {
    const documents = await TeamInviteModel.find({ 
      email: email.toLowerCase(),
      status: 'PENDING',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    return documents.map(TeamInviteDbMapper.toDomain);
  }

  async update(id: string, data: Partial<TeamInvite>): Promise<TeamInvite | null> {
    const document = await TeamInviteModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );
    
    return document ? TeamInviteDbMapper.toDomain(document) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await TeamInviteModel.findByIdAndDelete(id);
    return result !== null;
  }

  async expireOldInvites(): Promise<number> {
    const result = await TeamInviteModel.updateMany(
      { 
        status: 'PENDING',
        expiresAt: { $lt: new Date() }
      },
      { status: 'EXPIRED' }
    );
    
    return result.modifiedCount;
  }
}