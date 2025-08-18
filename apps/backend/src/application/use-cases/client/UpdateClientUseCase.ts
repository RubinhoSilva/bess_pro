import { IClientRepository } from "../../../domain/repositories/IClientRepository";
import { Result } from "../../common/Result";
import { UpdateClientCommand } from "../../dtos/input/client/UpdateClientCommand";
import { ClientResponseDto } from "../../dtos/output/ClientResponseDto";
import { ClientMapper } from "../../mappers/ClientMapper";
import { UserId } from "../../../domain/value-objects/UserId";

export class UpdateClientUseCase {
  constructor(
    private clientRepository: IClientRepository
  ) {}

  async execute(clientId: string, command: UpdateClientCommand, userId: string): Promise<Result<ClientResponseDto>> {
    try {
      const client = await this.clientRepository.findById(clientId);

      if (!client) {
        return Result.failure('Cliente não encontrado');
      }

      // Verificar se o cliente pertence ao usuário
      const userIdVO = UserId.create(userId);
      if (!client.isOwnedBy(userIdVO)) {
        return Result.failure('Acesso negado');
      }

      // Verificar se está tentando alterar o email para um que já existe
      if (command.email && command.email !== client.getEmail().getValue()) {
        const existingClient = await this.clientRepository.findByEmail(command.email);
        if (existingClient && existingClient.getId() !== clientId && existingClient.isOwnedBy(userIdVO)) {
          return Result.failure('Já existe um cliente com este email');
        }
      }

      // Aplicar as mudanças
      ClientMapper.applyUpdateCommand(client, command);

      // Salvar as mudanças
      await this.clientRepository.update(client);

      // Retornar a resposta
      const responseDto = ClientMapper.toResponseDto(client);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}