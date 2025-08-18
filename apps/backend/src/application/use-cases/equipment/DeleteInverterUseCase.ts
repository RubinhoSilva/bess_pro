import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { DeleteInverterCommand } from '../../dtos/input/equipment/DeleteInverterCommand';

export class DeleteInverterUseCase implements IUseCase<DeleteInverterCommand, Result<void>> {
  
  constructor(
    private inverterRepository: IInverterRepository
  ) {}

  async execute(command: DeleteInverterCommand): Promise<Result<void>> {
    try {
      const { userId, id } = command;
      
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