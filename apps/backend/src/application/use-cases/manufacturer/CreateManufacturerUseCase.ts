import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { CreateManufacturerCommand } from "@/application/dtos/input/manufacturer/CreateManufacturerCommand";
import { ManufacturerResponseDto } from "@/application/dtos/output/ManufacturerResponseDto";
import { ManufacturerMapper } from "@/application/mappers/ManufacturerMapper";
import { Manufacturer } from "@/domain/entities/Manufacturer";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export class CreateManufacturerUseCase implements IUseCase<CreateManufacturerCommand, Result<ManufacturerResponseDto>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: CreateManufacturerCommand): Promise<Result<ManufacturerResponseDto>> {
    try {
      // Verificar se nome já existe
      const nameExists = await this.manufacturerRepository.exists(
        command.name,
        undefined,
        command.teamId
      );

      if (nameExists) {
        return Result.failure('Já existe um fabricante com este nome');
      }

      // Criar fabricante
      const manufacturer = new Manufacturer({
        name: command.name,
        type: command.type,
        teamId: command.teamId,
        isDefault: false, // Fabricantes criados por usuários nunca são padrão
        description: command.description,
        website: command.website,
        country: command.country,
        logoUrl: command.logoUrl,
        supportEmail: command.supportEmail,
        supportPhone: command.supportPhone,
        certifications: command.certifications,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Salvar
      const savedManufacturer = await this.manufacturerRepository.create(manufacturer);

      return Result.success(ManufacturerMapper.toResponseDto(savedManufacturer));
    } catch (error: any) {
      return Result.failure(`Erro ao criar fabricante: ${error.message}`);
    }
  }
}