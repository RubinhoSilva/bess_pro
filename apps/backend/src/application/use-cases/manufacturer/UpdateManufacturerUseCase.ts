import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { UpdateManufacturerCommand } from "@/application/dtos/input/manufacturer/UpdateManufacturerCommand";
import { ManufacturerResponseDto } from "@/application/dtos/output/ManufacturerResponseDto";
import { ManufacturerMapper } from "@/application/mappers/ManufacturerMapper";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export class UpdateManufacturerUseCase implements IUseCase<UpdateManufacturerCommand, Result<ManufacturerResponseDto>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: UpdateManufacturerCommand): Promise<Result<ManufacturerResponseDto>> {
    try {
      // Buscar fabricante existente
      const existingManufacturer = await this.manufacturerRepository.findById(command.id);

      if (!existingManufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se é fabricante padrão e não pode ser alterado
      if (existingManufacturer.isDefault) {
        return Result.failure('Fabricantes padrão não podem ser alterados');
      }

      // Verificar se novo nome já existe (se nome foi alterado)
      if (command.name && command.name !== existingManufacturer.name) {
        const nameExists = await this.manufacturerRepository.exists(
          command.name,
          command.id,
          existingManufacturer.teamId
        );

        if (nameExists) {
          return Result.failure('Já existe um fabricante com este nome');
        }
      }

      // Atualizar fabricante
      const updatedManufacturer = existingManufacturer.update({
        name: command.name,
        type: command.type,
        description: command.description,
        website: command.website,
        country: command.country,
        logoUrl: command.logoUrl,
        supportEmail: command.supportEmail,
        supportPhone: command.supportPhone,
        certifications: command.certifications
      });

      // Salvar
      const savedManufacturer = await this.manufacturerRepository.update(command.id, updatedManufacturer);

      if (!savedManufacturer) {
        return Result.failure('Erro ao atualizar fabricante');
      }

      return Result.success(ManufacturerMapper.toResponseDto(savedManufacturer));
    } catch (error: any) {
      return Result.failure(`Erro ao atualizar fabricante: ${error.message}`);
    }
  }
}