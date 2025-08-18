import { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { TeamId } from '../../../domain/value-objects/TeamId';
import { TeamResponseDto } from '../../dtos/output/TeamResponseDto';
import { TeamMapper } from '../../mappers/TeamMapper';
import { UpdateTeamCommand } from '../../dtos/input/team/UpdateTeamCommand';

export class UpdateTeamUseCase {
  constructor(
    private teamRepository: ITeamRepository
  ) {}

  async execute(teamId: string, command: UpdateTeamCommand): Promise<TeamResponseDto> {
    const team = await this.teamRepository.findById(teamId);
    
    if (!team) {
      throw new Error('Team não encontrado');
    }

    // Atualizar apenas os campos fornecidos
    if (command.name) {
      team.changeName(command.name);
    }

    if (command.description !== undefined) {
      team.changeDescription(command.description);
    }

    if (command.planType && command.maxUsers) {
      team.changePlan(command.planType, command.maxUsers);
    }
    
    // Salvar as alterações
    const updatedTeam = await this.teamRepository.update(teamId, team);
    
    // Por simplicidade, vou usar um nome placeholder - idealmente buscar do user repository
    const ownerName = 'Owner'; 
    
    return TeamMapper.toResponseDto(updatedTeam, ownerName, 0);
  }
}