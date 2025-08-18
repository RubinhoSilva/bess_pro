import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { User } from '../../../../domain/entities/User';
import { UserId } from '../../../../domain/value-objects/UserId';
import { Email } from '../../../../domain/value-objects/Email';
import { UserModel } from '../schemas/UserSchema';
import { UserDbMapper } from '../mappers/UserDbMapper';

export class MongoUserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    const dbData = UserDbMapper.toDbDocument(user);
    const doc = new UserModel(dbData);
    const savedDoc = await doc.save();
    return UserDbMapper.toDomain(savedDoc);
  }

  async createWithPassword(user: User, passwordHash: string): Promise<User> {
    const dbData = UserDbMapper.toDbInsert(user, passwordHash);
    const doc = new UserModel(dbData);
    const savedDoc = await doc.save();
    return UserDbMapper.toDomain(savedDoc);
  }

  async update(user: User): Promise<User> {
    const updateData = UserDbMapper.toDbUpdate(user);
    const updatedDoc = await UserModel.findByIdAndUpdate(
      user.getId(),
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error('Usuário não encontrado para atualização');
    }

    return UserDbMapper.toDomain(updatedDoc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findOne({ 
      _id: id, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    return doc ? UserDbMapper.toDomain(doc) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const doc = await UserModel.findOne({ 
      email: email.getValue(), 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    return doc ? UserDbMapper.toDomain(doc) : null;
  }

  async findByEmailWithPassword(email: Email): Promise<{ user: User; passwordHash: string } | null> {
    const doc = await UserModel.findOne({ 
      email: email.getValue(),
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    if (!doc) {
      return null;
    }
    
    return {
      user: UserDbMapper.toDomain(doc),
      passwordHash: doc.passwordHash
    };
  }

  async delete(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async softDelete(id: string): Promise<void> {
    const result = await UserModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!result) {
      throw new Error('Usuário não encontrado para exclusão');
    }
  }

  async restore(id: string): Promise<void> {
    const result = await UserModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: false, 
        deletedAt: null,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!result) {
      throw new Error('Usuário não encontrado para restauração');
    }
  }

  async hardDelete(id: string): Promise<void> {
    const result = await UserModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Usuário não encontrado para exclusão permanente');
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ 
      _id: id, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    return count > 0;
  }

  async findByIdIncludingDeleted(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    return doc ? UserDbMapper.toDomain(doc) : null;
  }

  async findAllIncludingDeleted(): Promise<User[]> {
    const docs = await UserModel.find().sort({ createdAt: -1 });
    return docs.map(doc => UserDbMapper.toDomain(doc));
  }

  async findDeleted(): Promise<User[]> {
    const docs = await UserModel.find({ isDeleted: true }).sort({ deletedAt: -1 });
    return docs.map(doc => UserDbMapper.toDomain(doc));
  }

  async isDeleted(id: string): Promise<boolean> {
    const doc = await UserModel.findById(id);
    return doc?.isDeleted || false;
  }

  async emailExists(email: Email): Promise<boolean> {
    const count = await UserModel.countDocuments({ 
      email: email.getValue(), 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    return count > 0;
  }

  async findAll(): Promise<User[]> {
    const docs = await UserModel.find({ 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ createdAt: -1 });
    return docs.map(doc => UserDbMapper.toDomain(doc));
  }

  async findByRole(role: string): Promise<User[]> {
    const docs = await UserModel.find({ 
      role, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ name: 1 });
    return docs.map(doc => UserDbMapper.toDomain(doc));
  }

  async findByCompany(company: string): Promise<User[]> {
    const docs = await UserModel.find({ 
      company: { $regex: company, $options: 'i' },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ name: 1 });
    return docs.map(doc => UserDbMapper.toDomain(doc));
  }

  async updateProfile(userId: UserId, data: {
    name?: string;
    company?: string;
    logoUrl?: string;
  }): Promise<void> {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.name) updateData.name = data.name;
    if (data.company) updateData.company = data.company;
    if (data.logoUrl) updateData.logoUrl = data.logoUrl;

    await UserModel.findOneAndUpdate(
      { 
        _id: userId.getValue(), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      },
      updateData
    );
  }

  async countByRole(): Promise<Record<string, number>> {
    const pipeline = [
      {
        $match: { 
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await UserModel.aggregate(pipeline);
    const counts: Record<string, number> = {};
    
    for (const result of results) {
      counts[result._id] = result.count;
    }

    return counts;
  }

  async findCreatedBetween(startDate: Date, endDate: Date): Promise<User[]> {
    const docs = await UserModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ createdAt: -1 });
    
    return docs.map(doc => UserDbMapper.toDomain(doc));
  }

  async findByTeamId(teamId: string): Promise<User[]> {
    const docs = await UserModel.find({ 
      teamId, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ createdAt: -1 });
    return docs.map(doc => UserDbMapper.toDomain(doc));
  }

  async findByTeamIdWithHistory(teamId: string): Promise<User[]> {
    // Buscar usuários atuais do team
    const currentUsers = await UserModel.find({ teamId }).sort({ createdAt: -1 });
    
    // Buscar usuários removidos que tinham este team (usando lastTeamId)
    const removedUsers = await UserModel.find({ 
      teamId: null,
      lastTeamId: teamId,
      status: 'removed'
    }).sort({ updatedAt: -1 });
    
    const allUsers = [...currentUsers, ...removedUsers];
    return allUsers.map(doc => UserDbMapper.toDomain(doc));
  }

  async updatePassword(userId: UserId, passwordHash: string): Promise<void> {
    await UserModel.findOneAndUpdate(
      { 
        _id: userId.getValue(), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      },
      { 
        passwordHash,
        updatedAt: new Date()
      },
      { runValidators: true }
    );
  }
}
