import { Manufacturer } from '../../domain/entities/Manufacturer';
import { Manufacturer as SharedManufacturer, ManufacturerContact, ManufacturerBusiness, ManufacturerMetadata, ManufacturerType as SharedManufacturerType } from '@bess-pro/shared';

export class ManufacturerMapper {
  static toSharedManufacturer(manufacturer: Manufacturer): SharedManufacturer {
    return {
      id: manufacturer.getId(),
      name: manufacturer.name,
      type: manufacturer.type as SharedManufacturerType,
      description: manufacturer.description,
      website: manufacturer.website,
      contact: {
        email: manufacturer.supportEmail,
        phone: manufacturer.supportPhone,
        supportEmail: manufacturer.supportEmail,
        supportPhone: manufacturer.supportPhone,
      } as ManufacturerContact,
      business: {
        foundedYear: undefined,
        headquarters: undefined,
        employeeCount: undefined,
        revenue: undefined,
        stockTicker: undefined,
        parentCompany: undefined,
        subsidiaries: undefined,
      } as ManufacturerBusiness, // Preencher se houver dados
      certifications: manufacturer.certifications || [],
      metadata: {
        logoUrl: manufacturer.logoUrl,
        specialties: [],
        markets: [],
        qualityStandards: [],
      } as ManufacturerMetadata,
      status: (manufacturer as any).isDeleted ? ('deleted' as const) : ('active' as const),
      isDefault: manufacturer.isDefault,
      createdAt: manufacturer.getCreatedAt(),
      updatedAt: manufacturer.getUpdatedAt(),
    };
  }

  static toResponseDto(manufacturer: Manufacturer): SharedManufacturer {
    return this.toSharedManufacturer(manufacturer);
  }

  static toResponseDtoList(manufacturers: Manufacturer[]): SharedManufacturer[] {
    return manufacturers.map(manufacturer => this.toResponseDto(manufacturer));
  }
}