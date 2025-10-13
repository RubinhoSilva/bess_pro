import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { ManufacturerResponseDto } from "@/application/dtos/output/ManufacturerResponseDto";
import { ManufacturerMapper } from "@/application/mappers/ManufacturerMapper";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export interface GetManufacturerByIdCommand {
  id: string;
  teamId?: string;
}

export class GetManufacturerByIdUseCase implements IUseCase<GetManufacturerByIdCommand, Result<ManufacturerResponseDto>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: GetManufacturerByIdCommand): Promise<Result<ManufacturerResponseDto>> {
    try {
      const manufacturer = await this.manufacturerRepository.findById(command.id);

      if (!manufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se o fabricante é acessível pelo time
      if (!manufacturer.isAccessibleByTeam(command.teamId)) {
        return Result.failure('Fabricante não encontrado');
      }

      return Result.success(ManufacturerMapper.toResponseDto(manufacturer));
    } catch (error: any) {
      return Result.failure(`Erro ao buscar fabricante: ${error.message}`);
    }
  }
}