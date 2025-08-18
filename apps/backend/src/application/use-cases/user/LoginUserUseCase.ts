import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { LoginUserCommand } from "@/application/dtos/input/user/LoginUserCommand";
import { UserResponseDto } from "@/application/dtos/output/UserResponseDto";
import { UserMapper } from "@/application/mappers/UserMapper";
import { IUserRepository } from "@/domain/repositories";
import { Email } from "@/domain/value-objects/Email";
import { IPasswordHashService } from "../../services/IPasswordHashService";
import { ITokenService } from "../../services/ITokenService";

export class LoginUserUseCase implements IUseCase<LoginUserCommand, Result<{ user: UserResponseDto; token: string }>> {
  constructor(
    private userRepository: IUserRepository,
    private passwordHashService: IPasswordHashService,
    private tokenService: ITokenService
  ) {}

  async execute(command: LoginUserCommand): Promise<Result<{ user: UserResponseDto; token: string }>> {
    try {
      // Buscar usuário com senha
      const email = Email.create(command.email);
      const userWithPassword = await this.userRepository.findByEmailWithPassword(email);

      if (!userWithPassword) {
        return Result.failure('Credenciais inválidas');
      }

      // Verificar senha
      const isValidPassword = await this.passwordHashService.verify(command.password, userWithPassword.passwordHash);

      if (!isValidPassword) {
        return Result.failure('Credenciais inválidas');
      }

      // Gerar token
      const token = await this.tokenService.generateToken({
        userId: userWithPassword.user.getId(),
        email: userWithPassword.user.getEmail().getValue(),
        role: userWithPassword.user.getRole().getValue(),
      });

      return Result.success({
        user: UserMapper.toResponseDto(userWithPassword.user),
        token,
      });
    } catch (error: any) {
      return Result.failure(`Erro ao fazer login: ${error.message}`);
    }
  }
}