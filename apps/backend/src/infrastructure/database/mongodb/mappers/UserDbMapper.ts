import { User } from '../../../../domain/entities/User';
import { UserDocument } from '../schemas/UserSchema';
import { Types } from 'mongoose';

export class UserDbMapper {
  static toDomain(doc: UserDocument): User {
    return User.create({
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      company: doc.company,
      role: doc.role,
      teamId: doc.teamId,
      lastTeamId: doc.lastTeamId,
      status: doc.status || 'pending',
      logoUrl: doc.logoUrl,
      isDeleted: doc.isDeleted || false,
      deletedAt: doc.deletedAt || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toDbDocument(user: User): Partial<UserDocument> {
    const userId = user.getId();
    return {
      _id: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(),
      email: user.getEmail().getValue(),
      name: user.getName().getValue(),
      company: user.getCompany(),
      role: user.getRole().getValue(),
      teamId: user.getTeamId() || undefined,
      lastTeamId: user.getLastTeamId() || undefined,
      status: user.getStatus(),
      logoUrl: user.getLogoUrl(),
      isDeleted: user.isDeleted(),
      deletedAt: user.getDeletedAt() || undefined,
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }

  static toDbInsert(user: User, passwordHash: string): Partial<UserDocument> {
    const userId = user.getId();
    const document: Partial<UserDocument> = {
      email: user.getEmail().getValue(),
      name: user.getName().getValue(),
      company: user.getCompany(),
      role: user.getRole().getValue(),
      teamId: user.getTeamId() || undefined,
      lastTeamId: user.getLastTeamId() || undefined,
      status: user.getStatus(),
      logoUrl: user.getLogoUrl(),
      passwordHash,
      isDeleted: user.isDeleted(),
      deletedAt: user.getDeletedAt() || undefined,
    };

    // Só inclui _id se for um ObjectId válido (caso de update ou ID específico)
    if (Types.ObjectId.isValid(userId)) {
      document._id = new Types.ObjectId(userId);
    }

    return document;
  }

  static toDbUpdate(user: User): Partial<UserDocument> {
    return {
      name: user.getName().getValue(),
      company: user.getCompany(),
      role: user.getRole().getValue(),
      teamId: user.getTeamId() || undefined,
      lastTeamId: user.getLastTeamId() || undefined,
      status: user.getStatus(),
      logoUrl: user.getLogoUrl(),
      isDeleted: user.isDeleted(),
      deletedAt: user.getDeletedAt() || undefined,
      updatedAt: new Date(),
    };
  }
}