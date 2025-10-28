import { CompanyProfile } from "../../domain/entities/CompanyProfile";
import { CreateCompanyProfileCommand } from "../dtos/input/company-profile/CreateCompanyProfileCommand";
import { UpdateCompanyProfileCommand } from "../dtos/input/company-profile/UpdateCompanyProfileCommand";
import { CompanyProfileResponseDto, CompanyProfileListResponseDto } from "../dtos/output/CompanyProfileResponseDto";
import type {
  CompanyProfile as SharedCompanyProfile,
  CompanyProfileProps as SharedCompanyProfileProps,
  CompanyProfileResponse as SharedCompanyProfileResponse,
  CompanyProfileListResponse as SharedCompanyProfileListResponse
} from "@bess-pro/shared";

export class CompanyProfileMapper {
  static createCommandToDomain(command: CreateCompanyProfileCommand): CompanyProfile {
    return CompanyProfile.create({
      companyName: command.companyName,
      tradingName: command.tradingName,
      taxId: command.taxId,
      stateRegistration: command.stateRegistration,
      municipalRegistration: command.municipalRegistration,
      phone: command.phone,
      email: command.email,
      logoUrl: command.logoUrl,
      logoPath: command.logoPath,
      website: command.website,
      address: command.address,
      city: command.city,
      state: command.state,
      zipCode: command.zipCode,
      country: command.country,
      isActive: command.isActive
    });
  }

  // New method to convert domain to shared type
  static domainToShared(companyProfile: CompanyProfile): SharedCompanyProfile {
    return {
      id: companyProfile.getId(),
      companyName: companyProfile.getCompanyName(),
      tradingName: companyProfile.getTradingName(),
      taxId: companyProfile.getTaxId(),
      stateRegistration: companyProfile.getStateRegistration(),
      municipalRegistration: companyProfile.getMunicipalRegistration(),
      phone: companyProfile.getPhone(),
      email: companyProfile.getEmail(),
      logoUrl: companyProfile.getLogoUrl(),
      logoPath: companyProfile.getLogoPath(),
      website: companyProfile.getWebsite(),
      address: companyProfile.getAddress(),
      city: companyProfile.getCity(),
      state: companyProfile.getState(),
      zipCode: companyProfile.getZipCode(),
      country: companyProfile.getCountry(),
      isActive: companyProfile.getIsActive(),
      createdAt: companyProfile.getCreatedAt(),
      updatedAt: companyProfile.getUpdatedAt(),
      deletedAt: companyProfile.getDeletedAt(),
      isDeleted: companyProfile.getDeletedAt() !== null
    };
  }

  // New method to convert shared type to domain
  static sharedToDomain(shared: SharedCompanyProfile): CompanyProfile {
    return CompanyProfile.create({
      id: shared.id,
      companyName: shared.companyName,
      tradingName: shared.tradingName,
      taxId: shared.taxId,
      stateRegistration: shared.stateRegistration,
      municipalRegistration: shared.municipalRegistration,
      phone: shared.phone,
      email: shared.email,
      logoUrl: shared.logoUrl,
      logoPath: shared.logoPath,
      website: shared.website,
      address: shared.address,
      city: shared.city,
      state: shared.state,
      zipCode: shared.zipCode,
      country: shared.country,
      isActive: shared.isActive,
      createdAt: shared.createdAt,
      updatedAt: shared.updatedAt,
      deletedAt: shared.deletedAt,
      isDeleted: shared.deletedAt !== null
    });
  }

  static applyUpdateCommand(companyProfile: CompanyProfile, command: UpdateCompanyProfileCommand): void {
    if (command.companyName !== undefined) {
      companyProfile.updateCompanyName(command.companyName);
    }
    if (command.tradingName !== undefined) {
      companyProfile.updateTradingName(command.tradingName);
    }
    if (command.taxId !== undefined) {
      companyProfile.updateTaxId(command.taxId);
    }
    if (command.stateRegistration !== undefined) {
      companyProfile.updateStateRegistration(command.stateRegistration);
    }
    if (command.municipalRegistration !== undefined) {
      companyProfile.updateMunicipalRegistration(command.municipalRegistration);
    }
    if (command.phone !== undefined) {
      companyProfile.updatePhone(command.phone);
    }
    if (command.email !== undefined) {
      companyProfile.updateEmail(command.email);
    }
    if (command.logoUrl !== undefined) {
      companyProfile.updateLogoUrl(command.logoUrl);
    }
    if (command.logoPath !== undefined) {
      companyProfile.updateLogoPath(command.logoPath);
    }
    if (command.website !== undefined) {
      companyProfile.updateWebsite(command.website);
    }
    if (command.address !== undefined) {
      companyProfile.updateAddress(command.address);
    }
    if (command.city !== undefined) {
      companyProfile.updateCity(command.city);
    }
    if (command.state !== undefined) {
      companyProfile.updateState(command.state);
    }
    if (command.zipCode !== undefined) {
      companyProfile.updateZipCode(command.zipCode);
    }
    if (command.country !== undefined) {
      companyProfile.updateCountry(command.country);
    }
    if (command.isActive !== undefined) {
      if (command.isActive) {
        companyProfile.activate();
      } else {
        companyProfile.deactivate();
      }
    }
  }

  static toResponseDto(companyProfile: CompanyProfile): CompanyProfileResponseDto {
    return {
      id: companyProfile.getId(),
      companyName: companyProfile.getCompanyName(),
      tradingName: companyProfile.getTradingName(),
      taxId: companyProfile.getTaxId(),
      stateRegistration: companyProfile.getStateRegistration(),
      municipalRegistration: companyProfile.getMunicipalRegistration(),
      phone: companyProfile.getPhone(),
      email: companyProfile.getEmail(),
      logoUrl: companyProfile.getLogoUrl(),
      logoPath: companyProfile.getLogoPath(),
      website: companyProfile.getWebsite(),
      address: companyProfile.getAddress(),
      city: companyProfile.getCity(),
      state: companyProfile.getState(),
      zipCode: companyProfile.getZipCode(),
      country: companyProfile.getCountry(),
      isActive: companyProfile.getIsActive(),
      createdAt: companyProfile.getCreatedAt(),
      updatedAt: companyProfile.getUpdatedAt()
    };
  }

  // New method to convert domain to shared response type
  static toSharedResponse(companyProfile: CompanyProfile): SharedCompanyProfileResponse {
    return {
      id: companyProfile.getId(),
      companyName: companyProfile.getCompanyName(),
      tradingName: companyProfile.getTradingName(),
      taxId: companyProfile.getTaxId(),
      stateRegistration: companyProfile.getStateRegistration(),
      municipalRegistration: companyProfile.getMunicipalRegistration(),
      phone: companyProfile.getPhone(),
      email: companyProfile.getEmail(),
      logoUrl: companyProfile.getLogoUrl(),
      logoPath: companyProfile.getLogoPath(),
      website: companyProfile.getWebsite(),
      address: companyProfile.getAddress(),
      city: companyProfile.getCity(),
      state: companyProfile.getState(),
      zipCode: companyProfile.getZipCode(),
      country: companyProfile.getCountry(),
      isActive: companyProfile.getIsActive(),
      createdAt: companyProfile.getCreatedAt(),
      updatedAt: companyProfile.getUpdatedAt()
    };
  }

  static toListResponseDto(
    companyProfiles: CompanyProfile[],
    total: number,
    page: number,
    pageSize: number
  ): CompanyProfileListResponseDto {
    return {
      companyProfiles: companyProfiles.map(cp => this.toResponseDto(cp)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // New method to convert domain list to shared response type
  static toSharedListResponse(
    companyProfiles: CompanyProfile[],
    total: number,
    page: number,
    pageSize: number
  ): SharedCompanyProfileListResponse {
    return {
      companyProfiles: companyProfiles.map(cp => this.toSharedResponse(cp)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}