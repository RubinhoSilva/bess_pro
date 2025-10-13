import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { UpdateManufacturerRequestBackend } from "@/application/dtos/input/manufacturer/UpdateManufacturerRequest";
import { ManufacturerResponseDto } from "@/application/dtos/output/ManufacturerResponseDto";
import { ManufacturerMapper } from "@/application/mappers/ManufacturerMapper";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export class UpdateManufacturerUseCase implements IUseCase<{id: string, data: UpdateManufacturerRequestBackend}, Result<ManufacturerResponseDto>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(data: UpdateManufacturerRequestBackend): Promise<Result<ManufacturerResponseDto>> {
    try {
      const { id, ...request } = data;

      // Buscar fabricante existente
      const existingManufacturer = await this.manufacturerRepository.findById(id);

      if (!existingManufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se é fabricante padrão e não pode ser alterado
      if (existingManufacturer.isDefault) {
        return Result.failure('Fabricantes padrão não podem ser alterados');
      }

      // Verificar se novo nome já existe (se nome foi alterado)
      if (request.name && request.name !== existingManufacturer.name) {
        const nameExists = await this.manufacturerRepository.exists(
          request.name,
          id,
          existingManufacturer.teamId
        );

        if (nameExists) {
          return Result.failure('Já existe um fabricante com este nome');
        }
      }

      // Atualizar fabricante (preservando teamId original)
      const updatedManufacturer = existingManufacturer.update({
        name: request.name,
        type: request.type,
        description: request.description,
        website: request.website,
        country: request.address?.country,
        logoUrl: request.logoUrl,
        supportEmail: request.supportEmail,
        supportPhone: request.supportPhone,
        certifications: request.certifications,
        teamId: existingManufacturer.teamId // Preservar teamId
      });

      // Salvar
      const savedManufacturer = await this.manufacturerRepository.update(id, updatedManufacturer);

      if (!savedManufacturer) {
        return Result.failure('Erro ao atualizar fabricante');
      }

      return Result.success(ManufacturerMapper.toResponseDto(savedManufacturer));
    } catch (error: any) {
      return Result.failure(`Erro ao atualizar fabricante: ${error.message}`);
    }
  }
}