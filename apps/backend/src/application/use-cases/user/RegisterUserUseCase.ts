import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { IKanbanColumnRepository } from '../../../domain/repositories/IKanbanColumnRepository';
import { User } from '../../../domain/entities/User';
import { Team } from '../../../domain/entities/Team';
import { Email } from '../../../domain/value-objects/Email';
import { UserMapper } from '../../mappers/UserMapper';
import { IUseCase } from '@/application/common/IUseCase';
import { Result } from '@/application/common/Result';
import { RegisterUserCommand } from '@/application/dtos/input/user/RegisterUserCommand';
import { UserResponseDto } from '@/application/dtos/output/UserResponseDto';
import { IPasswordHashService } from '../../services/IPasswordHashService';
import { IEmailService } from '../../services/IEmailService';
import { KanbanColumnSeederService } from '../../../domain/services/KanbanColumnSeederService';

export class RegisterUserUseCase implements IUseCase<RegisterUserCommand, Result<UserResponseDto>> {
  constructor(
    private userRepository: IUserRepository,
    private passwordHashService: IPasswordHashService,
    private emailService: IEmailService,
    private teamRepository: ITeamRepository,
    private kanbanColumnRepository: IKanbanColumnRepository,
    private kanbanColumnSeederService: KanbanColumnSeederService
  ) {}

  async execute(command: RegisterUserCommand): Promise<Result<UserResponseDto>> {
    try {
      // Validar se email já existe
      const email = Email.create(command.email);
      const existingUser = await this.userRepository.findByEmail(email);
      
      if (existingUser) {
        return Result.failure('Email já está sendo usado');
      }

      // Hash da senha
      const hashedPassword = await this.passwordHashService.hash(command.password);

      // Criar usuário
      const user = User.create({
        email: command.email,
        name: command.name,
        company: command.company,
        role: command.role || 'team_owner', // Usuário será owner de seu próprio team
      });

      // Salvar usuário com senha hash
      const savedUser = await this.userRepository.createWithPassword(user, hashedPassword);

      // Criar team automaticamente para o usuário
      const teamName = command.company || `${command.name}'s Team`;
      const team = Team.create({
        name: teamName,
        description: `Team de ${command.name}`,
        ownerId: savedUser.getId(),
        ownerEmail: command.email,
        planType: 'basic',
        maxUsers: 10,
        isActive: true
      });

      const savedTeam = await this.teamRepository.save(team);

      // Associar usuário ao team criado
      savedUser.changeTeam(savedTeam.getId());
      await this.userRepository.update(savedUser);

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

      // Enviar email de boas-vindas
      await this.emailService.sendWelcomeEmail(savedUser.getEmail().getValue(), savedUser.getName().getValue());

      return Result.success(UserMapper.toResponseDto(savedUser));
    } catch (error: any) {
      return Result.failure(`Erro ao registrar usuário: ${error.message}`);
    }
  }
}