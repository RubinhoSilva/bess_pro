import { Manufacturer } from '../../domain/entities/Manufacturer';
import { ManufacturerResponseDto } from '../dtos/output/ManufacturerResponseDto';

export class ManufacturerMapper {
  static toResponseDto(manufacturer: Manufacturer): ManufacturerResponseDto {
    return {
      id: manufacturer.getId(),
      name: manufacturer.name,
      type: manufacturer.type,
      teamId: manufacturer.teamId,
      isDefault: manufacturer.isDefault,
      description: manufacturer.description,
      website: manufacturer.website,
      country: manufacturer.country,
      logoUrl: manufacturer.logoUrl,
      supportEmail: manufacturer.supportEmail,
      supportPhone: manufacturer.supportPhone,
      certifications: manufacturer.certifications,
      createdAt: manufacturer.getCreatedAt(),
      updatedAt: manufacturer.getUpdatedAt(),
    };
  }

  static toResponseDtoList(manufacturers: Manufacturer[]): ManufacturerResponseDto[] {
    return manufacturers.map(manufacturer => this.toResponseDto(manufacturer));
  }
}