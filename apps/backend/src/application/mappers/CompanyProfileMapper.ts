import { CompanyProfile } from "../../domain/entities/CompanyProfile";
import { UpdateCompanyProfileCommand } from "../dtos/input/company-profile/UpdateCompanyProfileCommand";
import { CompanyProfileResponseDto, CompanyProfileListResponseDto } from "../dtos/output/CompanyProfileResponseDto";
import type {
  CompanyProfile as SharedCompanyProfile,
  CompanyProfileProps as SharedCompanyProfileProps,
  CompanyProfileResponse as SharedCompanyProfileResponse,
  CompanyProfileListResponse as SharedCompanyProfileListResponse
} from "@bess-pro/shared";

export class CompanyProfileMapper {
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
      teamId: companyProfile.getTeamId(),
      createdAt: companyProfile.getCreatedAt(),
      updatedAt: companyProfile.getUpdatedAt(),
      deletedAt: companyProfile.getDeletedAt(),
      isDeleted: companyProfile.getDeletedAt() !== null,
      mission: companyProfile.getMission(),
      foundedYear: companyProfile.getFoundedYear(),
      completedProjectsCount: companyProfile.getCompletedProjectsCount(),
      totalInstalledPower: companyProfile.getTotalInstalledPower(),
      satisfiedClientsCount: companyProfile.getSatisfiedClientsCount(),
      companyNotes: companyProfile.getCompanyNotes()
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
      teamId: shared.teamId,
      createdAt: shared.createdAt,
      updatedAt: shared.updatedAt,
      deletedAt: shared.deletedAt,
      isDeleted: shared.deletedAt !== null,
      mission: shared.mission,
      foundedYear: shared.foundedYear,
      completedProjectsCount: shared.completedProjectsCount,
      totalInstalledPower: shared.totalInstalledPower,
      satisfiedClientsCount: shared.satisfiedClientsCount,
      companyNotes: shared.companyNotes
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
    if (command.mission !== undefined) {
      companyProfile.updateMission(command.mission);
    }
    if (command.foundedYear !== undefined) {
      companyProfile.updateFoundedYear(command.foundedYear);
    }
    if (command.completedProjectsCount !== undefined) {
      companyProfile.updateCompletedProjectsCount(command.completedProjectsCount);
    }
    if (command.totalInstalledPower !== undefined) {
      companyProfile.updateTotalInstalledPower(command.totalInstalledPower);
    }
    if (command.satisfiedClientsCount !== undefined) {
      companyProfile.updateSatisfiedClientsCount(command.satisfiedClientsCount);
    }
    if (command.companyNotes !== undefined) {
      companyProfile.updateCompanyNotes(command.companyNotes);
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
      updatedAt: companyProfile.getUpdatedAt(),
      mission: companyProfile.getMission(),
      foundedYear: companyProfile.getFoundedYear(),
      completedProjectsCount: companyProfile.getCompletedProjectsCount(),
      totalInstalledPower: companyProfile.getTotalInstalledPower(),
      satisfiedClientsCount: companyProfile.getSatisfiedClientsCount(),
      companyNotes: companyProfile.getCompanyNotes()
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
      updatedAt: companyProfile.getUpdatedAt(),
      mission: companyProfile.getMission(),
      foundedYear: companyProfile.getFoundedYear(),
      completedProjectsCount: companyProfile.getCompletedProjectsCount(),
      totalInstalledPower: companyProfile.getTotalInstalledPower(),
      satisfiedClientsCount: companyProfile.getSatisfiedClientsCount(),
      companyNotes: companyProfile.getCompanyNotes()
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