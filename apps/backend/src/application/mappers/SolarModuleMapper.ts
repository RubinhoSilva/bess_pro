import { SolarModule } from '../../domain/entities/SolarModule';
import { ManufacturerType, SolarModule as SharedSolarModule, ModuleSpecifications, ModuleParameters, ModuleDimensions, ModuleMetadata, Manufacturer } from '@bess-pro/shared';
import { SolarModuleResponseDto, SolarModuleListResponseDto } from '../dtos/output/SolarModuleResponseDto';
import { SystemUsers } from '../../domain/constants/SystemUsers';

export class SolarModuleMapper {
  
  static toSharedSolarModule(module: SolarModule, manufacturerName?: string): SharedSolarModule {
    const areaM2 = module.calculateArea();
    
    // Criar um objeto manufacturer básico
    const manufacturer: Manufacturer = {
      id: module.manufacturerId,
      name: manufacturerName || module.manufacturerName || 'Fabricante não encontrado',
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
      } as ModuleMetadata,
      status: 'active',
      isPublic: module.teamId === SystemUsers.PUBLIC_EQUIPMENT,
      createdAt: module.createdAt || new Date(),
      updatedAt: module.updatedAt || new Date(),
    };
  }

  static toResponseDto(module: SolarModule, manufacturerName?: string): SolarModuleResponseDto {
    return this.toSharedSolarModule(module, manufacturerName);
  }

  static toListResponseDto(
    modules: SolarModule[],
    total: number,
    page?: number,
    pageSize?: number,
    manufacturerMap?: Map<string, string>
  ): SolarModuleListResponseDto {
    return {
      modules: modules.map(module => {
        const manufacturerName = manufacturerMap?.get(module.manufacturerId);
        return this.toResponseDto(module, manufacturerName);
      }),
      pagination: {
        page: page || 1,
        limit: pageSize || 20,
        total,
        totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
        hasNext: page && pageSize ? page * pageSize < total : false,
        hasPrev: page ? page > 1 : false,
      }
    };
  }

  static toResponseDtoList(modules: SolarModule[], manufacturerMap?: Map<string, string>): SolarModuleResponseDto[] {
    return modules.map(module => {
      const manufacturerName = manufacturerMap?.get(module.manufacturerId);
      return this.toResponseDto(module, manufacturerName);
    });
  }
}