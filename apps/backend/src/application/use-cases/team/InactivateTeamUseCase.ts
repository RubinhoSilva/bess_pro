import { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { TeamResponseDto } from '../../dtos/output/TeamResponseDto';
import { TeamMapper } from '../../mappers/TeamMapper';

export class InactivateTeamUseCase {
  constructor(
    private teamRepository: ITeamRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(teamId: string): Promise<TeamResponseDto> {
    const team = await this.teamRepository.findById(teamId);
    
    if (!team) {
      throw new Error('Team não encontrado');
    }

    if (!team.getIsActive()) {
      throw new Error('Team já está inativo');
    }

    // Buscar o owner do team para verificar se é super_admin
    const ownerId = UserId.create(team.getOwnerId());
    const owner = await this.userRepository.findById(ownerId.getValue());
    
    if (!owner) {
      throw new Error('Owner do team não encontrado');
    }

    // Proteger team do super_admin
    if (owner.getRole().isSuperAdmin()) {
      throw new Error('Não é possível inativar o team do super admin');
    }

    // Inativar o team
    team.deactivate();
    
    // Salvar as alterações
    const updatedTeam = await this.teamRepository.update(teamId, team);
    
    return TeamMapper.toResponseDto(updatedTeam, owner.getName().getValue(), 0, owner.getRole().getValue());
  }
}