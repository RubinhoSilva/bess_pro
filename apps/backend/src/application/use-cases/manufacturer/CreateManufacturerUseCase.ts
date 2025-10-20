import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { CreateManufacturerRequestBackend } from "@/application/dtos/input/manufacturer/CreateManufacturerRequest";
import { ManufacturerResponseDto } from "@/application/dtos/output/ManufacturerResponseDto";
import { ManufacturerMapper } from "@/application/mappers/ManufacturerMapper";
import { Manufacturer } from "@/domain/entities/Manufacturer";
import { IManufacturerRepository } from "@/domain/repositories/IManufacturerRepository";

export class CreateManufacturerUseCase implements IUseCase<CreateManufacturerRequestBackend, Result<ManufacturerResponseDto>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(request: CreateManufacturerRequestBackend): Promise<Result<ManufacturerResponseDto>> {
    try {
      // Validar teamId obrigatório
      if (!request.teamId) {
        return Result.failure('TeamId é obrigatório');
      }

      // Verificar se nome já existe
      const nameExists = await this.manufacturerRepository.exists(
        request.name,
        undefined,
        request.teamId
      );

      if (nameExists) {
        return Result.failure('Já existe um fabricante com este nome');
      }

      // Criar fabricante
      const manufacturer = new Manufacturer({
        name: request.name,
        type: request.type,
        teamId: request.teamId,
        isPublic: false, // Fabricantes criados por usuários nunca são padrão
        description: request.description,
        website: request.website,
        country: request.address?.country,
        logoUrl: request.logoUrl,
        supportEmail: request.supportEmail,
        supportPhone: request.supportPhone,
        certifications: request.certifications,
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