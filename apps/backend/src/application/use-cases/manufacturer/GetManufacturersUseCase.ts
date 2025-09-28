import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { ManufacturerResponseDto } from "@/application/dtos/output/ManufacturerResponseDto";
import { ManufacturerMapper } from "@/application/mappers/ManufacturerMapper";
import { ManufacturerType } from "@/domain/entities/Manufacturer";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export interface GetManufacturersCommand {
  teamId?: string;
  type?: ManufacturerType;
}

export class GetManufacturersUseCase implements IUseCase<GetManufacturersCommand, Result<ManufacturerResponseDto[]>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: GetManufacturersCommand): Promise<Result<ManufacturerResponseDto[]>> {
    try {
      let manufacturers;

      if (command.type) {
        manufacturers = await this.manufacturerRepository.findByType(command.type, command.teamId);
      } else {
        manufacturers = await this.manufacturerRepository.findAccessibleByTeam(command.teamId);
      }

      return Result.success(ManufacturerMapper.toResponseDtoList(manufacturers));
    } catch (error: any) {
      return Result.failure(`Erro ao buscar fabricantes: ${error.message}`);
    }
  }
}