import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export interface DeleteManufacturerCommand {
  id: string;
}

export class DeleteManufacturerUseCase implements IUseCase<DeleteManufacturerCommand, Result<boolean>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: DeleteManufacturerCommand): Promise<Result<boolean>> {
    try {
      // Buscar fabricante existente
      const existingManufacturer = await this.manufacturerRepository.findById(command.id);

      if (!existingManufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se é fabricante padrão e não pode ser removido
      if (existingManufacturer.isDefault) {
        return Result.failure('Fabricantes padrão não podem ser removidos');
      }

      // Verificar se não é deletável por outros motivos
      if (!existingManufacturer.isDeletable()) {
        return Result.failure('Este fabricante não pode ser removido');
      }

      // Executar deleção
      const deleted = await this.manufacturerRepository.delete(command.id);

      if (!deleted) {
        return Result.failure('Erro ao remover fabricante');
      }

      return Result.success(true);
    } catch (error: any) {
      return Result.failure(`Erro ao remover fabricante: ${error.message}`);
    }
  }
}