import { Team } from "../../../../domain/entities/Team";
import { TeamDocument } from "../schemas/TeamSchema";

export class TeamDbMapper {
  static toDomain(doc: TeamDocument): Team {
    return Team.create({
      id: doc._id,
      name: doc.name,
      description: doc.description,
      ownerId: doc.ownerId,
      ownerEmail: doc.ownerEmail,
      isActive: doc.isActive,
      planType: doc.planType,
      maxUsers: doc.maxUsers,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  static toPersistence(team: Team): Partial<TeamDocument> {
    return {
      _id: team.getId(),
      name: team.getName().getValue(),
      description: team.getDescription(),
      ownerId: team.getOwnerId(),
      ownerEmail: team.getOwnerEmail().getValue(),
      isActive: team.getIsActive(),
      planType: team.getPlanType(),
      maxUsers: team.getMaxUsers(),
      createdAt: team.getCreatedAt(),
      updatedAt: team.getUpdatedAt()
    };
  }
}