import { SolarModule } from '../../domain/entities/SolarModule';
import { ManufacturerType, SolarModule as SharedSolarModule, ModuleSpecifications, ModuleParameters, ModuleDimensions, ModuleMetadata, Manufacturer } from '@bess-pro/shared';
import { SolarModuleResponseDto, SolarModuleListResponseDto } from '../dtos/output/SolarModuleResponseDto';
import { SystemUsers } from '../../domain/constants/SystemUsers';

export class SolarModuleMapper {
  
  static toSharedSolarModule(module: SolarModule): SharedSolarModule {
    const areaM2 = module.calculateArea();
    
    // Criar um objeto manufacturer básico (em um sistema real, buscaríamos do repository)
    const manufacturer: Manufacturer = {
      id: module.manufacturerId,
      name: 'Fabricante', // Será preenchido posteriormente com busca ao repository
      type: ManufacturerType.SOLAR_MODULE,
      contact: {
        email: undefined,
        phone: undefined,
        supportEmail: undefined,
        supportPhone: undefined,
      },
      business: {
        foundedYear: undefined,
        headquarters: undefined,
        employeeCount: undefined,
        revenue: undefined,
        stockTicker: undefined,
        parentCompany: undefined,
        subsidiaries: undefined,
      },
      certifications: [],
      metadata: {
        specialties: [],
        markets: [],
        qualityStandards: [],
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      id: module.id!,
      manufacturer,
      model: module.modelo,
      nominalPower: module.potenciaNominal,
      specifications: {
        vmpp: module.vmpp,
        impp: module.impp,
        voc: module.voc,
        isc: module.isc,
        efficiency: module.eficiencia,
        cellType: module.tipoCelula as any,
        numberOfCells: module.numeroCelulas,
        technology: module.technology as any,
      } as ModuleSpecifications,
      parameters: {
        temperature: {
          tempCoeffPmax: module.tempCoefPmax,
          tempCoeffVoc: module.tempCoefVoc,
          tempCoeffIsc: module.tempCoefIsc,
        },
        diode: {
          aRef: module.aRef,
          iLRef: module.iLRef,
          iORef: module.iORef,
          rShRef: module.rShRef,
          rS: module.rS,
        },
        sapm: {
          a0: module.a0,
          a1: module.a1,
          a2: module.a2,
          a3: module.a3,
          a4: module.a4,
          b0: module.b0,
          b1: module.b1,
          b2: module.b2,
          b3: module.b3,
          b4: module.b4,
          b5: module.b5,
          fd: module.dtc,
        },
        spectral: {
          am: undefined,
          spectralResponse: undefined,
          material: module.material,
          technology: module.technology,
        },
        advanced: {
          alphaSc: module.alphaSc,
          betaOc: module.betaOc,
          gammaR: module.gammaR,
        },
      } as ModuleParameters,
      dimensions: {
        widthMm: module.larguraMm || 0,
        heightMm: module.alturaMm || 0,
        thicknessMm: module.espessuraMm || 0,
        weightKg: module.pesoKg || 0,
        areaM2: areaM2 ? Math.round(areaM2 * 100) / 100 : 0,
      } as ModuleDimensions,
      metadata: {
        datasheetUrl: module.datasheetUrl,
        certifications: module.certificacoes || [],
        warranty: module.garantiaAnos || 0,
        tolerance: module.tolerancia,
        userId: module.userId,
      } as ModuleMetadata,
      status: 'active',
      isPublic: module.userId === SystemUsers.PUBLIC_EQUIPMENT,
      createdAt: module.createdAt || new Date(),
      updatedAt: module.updatedAt || new Date(),
    };
  }

  static toResponseDto(module: SolarModule): SolarModuleResponseDto {
    return this.toSharedSolarModule(module);
  }

  static toListResponseDto(
    modules: SolarModule[], 
    total: number,
    page?: number,
    pageSize?: number
  ): SolarModuleListResponseDto {
    return {
      modules: modules.map(module => this.toResponseDto(module)),
      total,
      page,
      pageSize,
      totalPages: pageSize ? Math.ceil(total / pageSize) : undefined,
    };
  }

  static toResponseDtoList(modules: SolarModule[]): SolarModuleResponseDto[] {
    return modules.map(module => this.toResponseDto(module));
  }
}