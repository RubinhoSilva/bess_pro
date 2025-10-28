import { Team } from "../../domain/entities/Team";
import { TeamResponseDto } from "../dtos/output/TeamResponseDto";

export class TeamMapper {
  static toResponseDto(team: Team, ownerName?: string, currentUsers?: number, ownerRole?: string): TeamResponseDto {
    return {
      id: team.getId(),
      name: team.getName().getValue(),
      description: team.getDescription(),
      ownerId: team.getOwnerId(),
      ownerEmail: team.getOwnerEmail().getValue(),
      ownerName,
      ownerRole,
      isActive: team.getIsActive(),
      planType: team.getPlanType(),
      maxUsers: team.getMaxUsers(),
      companyProfileId: team.getCompanyProfileId() || undefined,
      currentUsers,
      createdAt: team.getCreatedAt(),
      updatedAt: team.getUpdatedAt()
    };
  }

  static toResponseDtoList(teams: Team[]): TeamResponseDto[] {
    return teams.map(team => this.toResponseDto(team));
  }
}