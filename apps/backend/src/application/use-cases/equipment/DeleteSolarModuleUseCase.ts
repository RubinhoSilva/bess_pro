import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { DeleteSolarModuleCommand } from '../../dtos/input/equipment/DeleteSolarModuleCommand';

export class DeleteSolarModuleUseCase implements IUseCase<DeleteSolarModuleCommand, Result<void>> {
  
  constructor(
    private solarModuleRepository: ISolarModuleRepository
  ) {}

  async execute(command: DeleteSolarModuleCommand): Promise<Result<void>> {
    try {
      const { userId, id } = command;
      
      // Verificar se o módulo existe e pertence ao usuário
      const existingModule = await this.solarModuleRepository.findById(id);
      if (!existingModule || existingModule.userId !== userId) {
        return Result.failure('Módulo solar não encontrado');
      }

      const deleted = await this.solarModuleRepository.delete(id);
      
      if (!deleted) {
        return Result.failure('Erro ao excluir módulo solar');
      }
      
      return Result.success(undefined);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao excluir módulo solar');
    }
  }
}