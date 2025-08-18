import { IClientRepository } from "../../../domain/repositories/IClientRepository";
import { Result } from "../../common/Result";
import { CreateClientCommand } from "../../dtos/input/client/CreateClientCommand";
import { ClientResponseDto } from "../../dtos/output/ClientResponseDto";
import { ClientMapper } from "../../mappers/ClientMapper";
import { UserId } from "../../../domain/value-objects/UserId";

export class CreateClientUseCase {
  constructor(
    private clientRepository: IClientRepository
  ) {}

  async execute(command: CreateClientCommand, userId: string): Promise<Result<ClientResponseDto>> {
    try {
      // Verificar se já existe um cliente com o mesmo email para o usuário
      const existingClient = await this.clientRepository.findByEmail(command.email);
      if (existingClient && existingClient.isOwnedBy(UserId.create(userId))) {
        return Result.failure('Já existe um cliente com este email');
      }

      // Criar o cliente
      const client = ClientMapper.createCommandToDomain(command, userId);

      // Salvar no repositório
      await this.clientRepository.save(client);

      // Retornar a resposta
      const responseDto = ClientMapper.toResponseDto(client);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}