import { Inverter } from '../../domain/entities/Inverter';
import { Inverter as SharedInverter, InverterPower, MPPTConfiguration, ElectricalSpecifications, InverterDimensions, InverterMetadata, SandiaParameters, Manufacturer, GridType, ManufacturerType } from '@bess-pro/shared';
import { InverterResponseDto, InverterListResponseDto } from '../dtos/output/InverterResponseDto';
import { SystemUsers } from '../../domain/constants/SystemUsers';

export class InverterMapper {
  
  static toSharedInverter(inverter: Inverter, manufacturerName?: string): SharedInverter {
    // Criar um objeto manufacturer básico
    const manufacturer: Manufacturer = {
      id: inverter.manufacturerId || '',
      name: manufacturerName || inverter.fabricante || 'Fabricante não encontrado',
      type: ManufacturerType.INVERTER,
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
      id: inverter.id!,
      manufacturer,
      model: inverter.modelo,
      power: {
        ratedACPower: inverter.potenciaSaidaCA,
        maxPVPower: inverter.potenciaMaxima,
        ratedDCPower: undefined,
        shortCircuitVoltageMax: inverter.tensaoCcMax || 0,
        maxInputCurrent: inverter.correnteEntradaMax || 0,
        maxApparentPower: inverter.potenciaAparenteMax || 0,
        maxDCVoltage: inverter.tensaoCcMax,
        maxOutputCurrent: inverter.correnteSaidaMax,
      } as InverterPower,
      mppt: {
        numberOfMppts: inverter.numeroMppt || 0,
        stringsPerMppt: inverter.stringsPorMppt || 0,
        mpptRange: inverter.faixaMppt,
        maxInputCurrentPerMppt: inverter.correnteEntradaMax,
      } as MPPTConfiguration,
      electrical: {
        maxEfficiency: inverter.eficienciaMaxima,
        europeanEfficiency: inverter.eficienciaEuropeia,
        mpptEfficiency: inverter.eficienciaMppt,
        gridType: inverter.tipoRede as GridType,
        ratedVoltage: inverter.tensaoSaidaNominal,
        frequency: inverter.frequenciaNominal,
        powerFactor: undefined,
      } as ElectricalSpecifications,
      dimensions: inverter.dimensoes ? {
        widthMm: inverter.dimensoes.larguraMm,
        heightMm: inverter.dimensoes.alturaMm,
        depthMm: inverter.dimensoes.profundidadeMm,
        weightKg: inverter.pesoKg || 0,
      } as InverterDimensions : undefined,
      metadata: {
        datasheetUrl: inverter.datasheetUrl,
        certifications: inverter.certificacoes || [],
        warranty: inverter.garantiaAnos || 0,
        connectionType: 'on-grid', // Default, poderia ser inferido
        protections: inverter.protecoes,
        protectionRating: inverter.grauProtecao,
        operatingTemperature: inverter.temperaturaOperacao,
        teamId: inverter.teamId,
        sandiaParameters: {
          vdco: inverter.vdco,
          pso: inverter.pso,
          c0: inverter.c0,
          c1: inverter.c1,
          c2: inverter.c2,
          c3: inverter.c3,
          pnt: inverter.pnt,
        } as SandiaParameters,
      } as InverterMetadata,
      status: 'active',
      isPublic: inverter.teamId === SystemUsers.PUBLIC_EQUIPMENT,
      createdAt: inverter.createdAt || new Date(),
      updatedAt: inverter.updatedAt || new Date(),
    };
  }

  static toResponseDto(inverter: Inverter, manufacturerName?: string, _moduleReferencePower?: number): InverterResponseDto {
    return this.toSharedInverter(inverter, manufacturerName);
  }

  static toListResponseDto(
    inverters: Inverter[],
    total: number,
    page?: number,
    pageSize?: number,
    manufacturerMap?: Map<string, string>,
    _moduleReferencePower?: number
  ): InverterListResponseDto {
    return {
      inverters: inverters.map(inverter => {
        const manufacturerName = manufacturerMap?.get(inverter.manufacturerId || '');
        return this.toResponseDto(inverter, manufacturerName, _moduleReferencePower);
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

  static toResponseDtoList(inverters: Inverter[], manufacturerMap?: Map<string, string>, _moduleReferencePower?: number): InverterResponseDto[] {
    return inverters.map(inverter => {
      const manufacturerName = manufacturerMap?.get(inverter.manufacturerId || '');
      return this.toResponseDto(inverter, manufacturerName, _moduleReferencePower);
    });
  }
}