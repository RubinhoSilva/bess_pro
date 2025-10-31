import { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IKanbanColumnRepository } from '../../../domain/repositories/IKanbanColumnRepository';
import { ICompanyProfileRepository } from '../../../domain/repositories/ICompanyProfileRepository';
import { Team } from '../../../domain/entities/Team';
import { User } from '../../../domain/entities/User';
import { CompanyProfile } from '../../../domain/entities/CompanyProfile';
import { UserId } from '../../../domain/value-objects/UserId';
import { Email } from '../../../domain/value-objects/Email';
import { CreateTeamCommand } from '../../dtos/input/team/CreateTeamCommand';
import { TeamResponseDto } from '../../dtos/output/TeamResponseDto';
import { TeamMapper } from '../../mappers/TeamMapper';
import { KanbanColumnSeederService } from '../../../domain/services/KanbanColumnSeederService';
import { EmailInvitationService } from '../../../domain/services/EmailInvitationService';
import { InvitationTokenModel } from '../../../infrastructure/database/mongodb/schemas/InvitationTokenSchema';

export class CreateTeamUseCase {
  constructor(
    private teamRepository: ITeamRepository,
    private userRepository: IUserRepository,
    private kanbanColumnRepository: IKanbanColumnRepository,
    private kanbanColumnSeederService: KanbanColumnSeederService,
    private emailInvitationService: EmailInvitationService,
    private companyProfileRepository: ICompanyProfileRepository
  ) {}

  async execute(command: CreateTeamCommand): Promise<TeamResponseDto> {
    // Validar companyProfileId se fornecido
    if (command.companyProfileId) {
      const companyProfile = await this.companyProfileRepository.findById(command.companyProfileId);
      if (!companyProfile) {
        throw new Error('CompanyProfile não encontrado');
      }
      
      if (!companyProfile.getIsActive()) {
        throw new Error('CompanyProfile não está ativo');
      }
      
      const existingTeam = await this.teamRepository.findByCompanyProfileId(command.companyProfileId);
      if (existingTeam) {
        throw new Error('Este perfil de empresa já está vinculado a outro time');
      }
    }

    // Verificar se o owner já existe pelo email
    const ownerEmail = Email.create(command.ownerEmail);
    let owner = await this.userRepository.findByEmail(ownerEmail);
    
    if (!owner) {
      // Criar usuário sem senha - será definida via convite
      const ownerName = command.ownerEmail.split('@')[0]; // Nome temporário baseado no email
      owner = User.create({
        email: command.ownerEmail,
        name: ownerName,
        company: command.name, // Usar o nome do team como empresa
        role: 'team_owner'
      });
      owner = await this.userRepository.save(owner);
    }

    // Criar team
    const team = Team.create({
      name: command.name,
      description: command.description,
      ownerId: owner.getId(),
      ownerEmail: command.ownerEmail,
      planType: command.planType || 'basic',
      maxUsers: command.maxUsers || 10,
      companyProfileId: command.companyProfileId || null,
      isActive: true
    });

    const savedTeam = await this.teamRepository.save(team);

    // Criar colunas Kanban padrão para o team
    const defaultColumns = await this.kanbanColumnSeederService.createDefaultColumnsForTeam(savedTeam.getId());
    for (const columnData of defaultColumns) {
      const column = {
        teamId: columnData.teamId,
        name: columnData.name,
        key: columnData.key,
        position: columnData.position,
        isDefault: columnData.isDefault,
        isActive: columnData.isActive,
      };
      await this.kanbanColumnRepository.save(column);
    }

    // Atualizar o owner para TEAM_OWNER e associar ao team
    owner.changeRole('team_owner');
    owner.changeTeam(savedTeam.getId());
    await this.userRepository.update(owner);

    // Gerar token de convite e salvar
    const invitationToken = this.emailInvitationService.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas para expirar

    await InvitationTokenModel.create({
      token: invitationToken,
      email: command.ownerEmail,
      userId: owner.getId(),
      teamId: savedTeam.getId(),
      expiresAt,
      used: false
    });

    // Enviar email de boas-vindas
    try {
      await this.emailInvitationService.sendWelcomeEmail(owner, savedTeam, invitationToken);
    } catch (error) {
      console.error('Erro ao enviar email de convite:', error);
      // Não falhar a criação do team se o email falhar
    }

    return TeamMapper.toResponseDto(savedTeam, owner.getName().getValue(), 1, owner.getRole().getValue());
  }
}