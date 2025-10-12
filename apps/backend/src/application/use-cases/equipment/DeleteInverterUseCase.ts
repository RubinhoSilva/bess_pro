import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { DeleteInverterRequest } from '@bess-pro/shared';

export class DeleteInverterUseCase implements IUseCase<DeleteInverterRequest & { userId: string }, Result<void>> {
  
  constructor(
    private inverterRepository: IInverterRepository
  ) {}

  async execute(request: DeleteInverterRequest & { userId: string }): Promise<Result<void>> {
    try {
      const { userId, id } = request;
      
      // Verificar se o inversor existe e pertence ao usuário
      const existingInverter = await this.inverterRepository.findById(id);
      if (!existingInverter || existingInverter.userId !== userId) {
        return Result.failure('Inversor não encontrado');
      }

      const deleted = await this.inverterRepository.delete(id);
      
      if (!deleted) {
        return Result.failure('Erro ao excluir inversor');
      }
      
      return Result.success(undefined);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao excluir inversor');
    }
  }
}