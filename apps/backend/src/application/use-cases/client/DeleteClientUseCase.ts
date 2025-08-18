import { IClientRepository } from "../../../domain/repositories/IClientRepository";
import { Result } from "../../common/Result";
import { UserId } from "../../../domain/value-objects/UserId";

export class DeleteClientUseCase {
  constructor(
    private clientRepository: IClientRepository
  ) {}

  async execute(clientId: string, userId: string): Promise<Result<boolean>> {
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

      // Deletar o cliente
      await this.clientRepository.delete(clientId);

      return Result.success(true);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}