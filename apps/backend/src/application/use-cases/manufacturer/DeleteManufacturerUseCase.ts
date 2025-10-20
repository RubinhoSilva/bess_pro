import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export interface DeleteManufacturerCommand {
  id: string;
  teamId?: string;
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

      // Verificar se o fabricante é acessível pelo time
      if (!existingManufacturer.isAccessibleByTeam(command.teamId)) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se é fabricante padrão e não pode ser removido
      if (existingManufacturer.isPublic) {
        return Result.failure('Fabricantes padrão não podem ser removidos');
      }

      // Verificar se há equipamentos associados a este fabricante
      const hasEquipment = await this.manufacturerRepository.hasEquipment(command.id);
      if (hasEquipment) {
        return Result.failure('Não é possível remover fabricante com equipamentos associados');
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