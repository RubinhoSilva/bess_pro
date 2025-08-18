import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { UpdateProfileCommand } from "@/application/dtos/input/user/UpdateProfileCommand";
import { UserResponseDto } from "@/application/dtos/output/UserResponseDto";
import { UserMapper } from "@/application/mappers/UserMapper";
import { IUserRepository } from "@/domain/repositories";
import { UserId } from "@/domain/value-objects/UserId";

export class UpdateProfileUseCase implements IUseCase<UpdateProfileCommand, Result<UserResponseDto>> {
  constructor(private userRepository: IUserRepository) {}

  async execute(command: UpdateProfileCommand): Promise<Result<UserResponseDto>> {
    try {
      // Buscar usuário
      const userId = UserId.create(command.userId);
      const user = await this.userRepository.findById(userId.getValue());

      if (!user) {
        return Result.failure('Usuário não encontrado');
      }

      // Atualizar dados
      if (command.name) {
        user.changeName(command.name);
      }

      if (command.company) {
        user.changeCompany(command.company);
      }

      if (command.logoUrl) {
        user.changeLogo(command.logoUrl);
      }

      // Salvar
      const updatedUser = await this.userRepository.update(user);

      return Result.success(UserMapper.toResponseDto(updatedUser));
    } catch (error: any) {
      return Result.failure(`Erro ao atualizar perfil: ${error.message}`);
    }
  }
}
