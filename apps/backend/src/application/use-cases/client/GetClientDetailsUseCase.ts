import { IClientRepository } from "../../../domain/repositories/IClientRepository";
import { Result } from "../../common/Result";
import { ClientResponseDto } from "../../dtos/output/ClientResponseDto";
import { ClientMapper } from "../../mappers/ClientMapper";
import { UserId } from "../../../domain/value-objects/UserId";

export class GetClientDetailsUseCase {
  constructor(
    private clientRepository: IClientRepository
  ) {}

  async execute(clientId: string, userId: string): Promise<Result<ClientResponseDto>> {
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

      const responseDto = ClientMapper.toResponseDto(client);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}