import { ITeamRepository, TeamFilters } from '../../../domain/repositories/ITeamRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { TeamResponseDto } from '../../dtos/output/TeamResponseDto';
import { TeamMapper } from '../../mappers/TeamMapper';

export class GetTeamsUseCase {
  constructor(
    private teamRepository: ITeamRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(filters?: TeamFilters): Promise<TeamResponseDto[]> {
    const teams = await this.teamRepository.findAll(filters);
    
    // Buscar informações dos owners e contar usuários de cada team
    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        const ownerId = UserId.create(team.getOwnerId());
        const owner = await this.userRepository.findById(ownerId.getValue());
        const teamUsers = await this.userRepository.findByTeamId(team.getId());
        
        return TeamMapper.toResponseDto(
          team,
          owner?.getName().getValue(),
          teamUsers.length,
          owner?.getRole().getValue()
        );
      })
    );

    return teamsWithDetails;
  }
}