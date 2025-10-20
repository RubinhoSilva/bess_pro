import { CreateInverterRequest, UpdateInverterRequest } from '@bess-pro/shared';

type InverterData = any;

// Tipos locais para response DTOs
export interface InverterResponseDto {
  id: string;
  manufacturerId?: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  potenciaFvMax: number;
  potenciaAparenteMax: number;
  tensaoCcMax: number;
  correnteEntradaMax: number;
  correnteSaidaMax?: number;
  numeroMppt: number;
  stringsPorMppt: number;
  faixaMppt?: string;
  eficienciaMax: number;
  eficienciaEuropeia?: number;
  eficienciaMppt?: number;
  tipoRede: string;
  tensaoSaidaNominal?: string;
  frequenciaNominal?: number;
  precoReferencia?: number;
  datasheetUrl?: string;
  certificacoes: string[];
  garantiaAnos: number;
  protecoes?: string[];
  grauProtecao?: string;
  temperaturaOperacao?: string;
  vdco?: number;
  pso?: number;
  c0?: number;
  c1?: number;
  c2?: number;
  c3?: number;
  pnt?: number;
  isPublic: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  teamId: string;
}

export interface InverterListResponseDto {
  inverters: InverterResponseDto[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  moduleReferencePower?: number;
}

export class SharedToInverterMapper {
  
  static createRequestToEntityData(request: CreateInverterRequest & { teamId: string }): InverterData {
    return {
      teamId: request.teamId,
      manufacturerId: request.manufacturerId || (request.metadata as any)?.manufacturerId,
      modelo: request.model,
      
      // Potência (Power)
      potenciaSaidaCA: request.power.ratedACPower,
      potenciaFvMax: request.power.maxPVPower,
      potenciaAparenteMax: request.power.maxApparentPower,
      tensaoCcMax: request.power.shortCircuitVoltageMax,
      correnteEntradaMax: request.power.maxInputCurrent,
      correnteSaidaMax: request.power.maxOutputCurrent,
      
      // MPPT Configuration
      numeroMppt: request.mppt.numberOfMppts,
      stringsPorMppt: request.mppt.stringsPerMppt,
      faixaMppt: request.mppt.mpptRange,
      
      // Electrical Specifications
      eficienciaMaxima: request.electrical.maxEfficiency,
      eficienciaEuropeia: request.electrical.europeanEfficiency,
      eficienciaMppt: request.electrical.mpptEfficiency,
      tipoRede: request.electrical.gridType,
      tensaoSaidaNominal: request.electrical.ratedVoltage,
      frequenciaNominal: request.electrical.frequency,
      
      // Metadata
      precoReferencia: request.metadata.price,
      datasheetUrl: request.metadata.datasheetUrl,
      certificacoes: request.metadata.certifications,
      garantiaAnos: request.metadata.warranty,
      protecoes: request.metadata.protections,
      grauProtecao: request.metadata.protectionRating,
      temperaturaOperacao: request.metadata.operatingTemperature,
      
      // Sandia Parameters
      vdco: request.metadata.sandiaParameters?.vdco,
      pso: request.metadata.sandiaParameters?.pso,
      c0: request.metadata.sandiaParameters?.c0,
      c1: request.metadata.sandiaParameters?.c1,
      c2: request.metadata.sandiaParameters?.c2,
      c3: request.metadata.sandiaParameters?.c3,
      pnt: request.metadata.sandiaParameters?.pnt
    };
  }
  
  static updateRequestToEntityData(request: UpdateInverterRequest & { teamId: string }): Partial<InverterData> {
    const data: Partial<InverterData> = {
      teamId: request.teamId
    };
    
    if (request.manufacturerId) {
      data.manufacturerId = request.manufacturerId;
    } else if ((request as any).manufacturer) {
      // Handle manufacturer object from frontend
      const mfg = (request as any).manufacturer;
      data.fabricante = typeof mfg === 'string' ? mfg : mfg.name || 'Unknown';
    }
    if (request.model !== undefined) data.modelo = request.model;
    
    // Power
    if (request.power) {
      if (request.power.ratedACPower !== undefined) data.potenciaSaidaCA = request.power.ratedACPower;
      if (request.power.maxPVPower !== undefined) data.potenciaFvMax = request.power.maxPVPower;
      if (request.power.maxApparentPower !== undefined) data.potenciaAparenteMax = request.power.maxApparentPower;
      if (request.power.shortCircuitVoltageMax !== undefined) data.tensaoCcMax = request.power.shortCircuitVoltageMax;
      if (request.power.maxInputCurrent !== undefined) data.correnteEntradaMax = request.power.maxInputCurrent;
      if (request.power.maxOutputCurrent !== undefined) data.correnteSaidaMax = request.power.maxOutputCurrent;
    }
    
    // MPPT Configuration
    if (request.mppt) {
      if (request.mppt.numberOfMppts !== undefined) data.numeroMppt = request.mppt.numberOfMppts;
      if (request.mppt.stringsPerMppt !== undefined) data.stringsPorMppt = request.mppt.stringsPerMppt;
      if (request.mppt.mpptRange !== undefined) data.faixaMppt = request.mppt.mpptRange;

    }
    
    // Electrical Specifications
    if (request.electrical) {
      if (request.electrical.maxEfficiency !== undefined) data.eficienciaMax = request.electrical.maxEfficiency;
      if (request.electrical.europeanEfficiency !== undefined) data.eficienciaEuropeia = request.electrical.europeanEfficiency;
      if (request.electrical.mpptEfficiency !== undefined) data.eficienciaMppt = request.electrical.mpptEfficiency;
      if (request.electrical.gridType !== undefined) {
        // Tratar valores inválidos como "bifasico-220v" -> "bifasico"
        let gridType = request.electrical.gridType;
        if (gridType.includes('-')) {
          gridType = gridType.split('-')[0] as any;
        }
        data.tipoRede = gridType;
      }
      if (request.electrical.ratedVoltage !== undefined) data.tensaoSaidaNominal = request.electrical.ratedVoltage;
      if (request.electrical.frequency !== undefined) data.frequenciaNominal = request.electrical.frequency;

    }
    
    // Metadata
    if (request.metadata) {
      if (request.metadata.price !== undefined) data.precoReferencia = request.metadata.price;
      if (request.metadata.datasheetUrl !== undefined) data.datasheetUrl = request.metadata.datasheetUrl;
      if (request.metadata.certifications !== undefined) data.certificacoes = request.metadata.certifications;
      if (request.metadata.warranty !== undefined) data.garantiaAnos = request.metadata.warranty;

      if (request.metadata.protections !== undefined) data.protecoes = request.metadata.protections;
      if (request.metadata.protectionRating !== undefined) data.grauProtecao = request.metadata.protectionRating;
      if (request.metadata.operatingTemperature !== undefined) data.temperaturaOperacao = request.metadata.operatingTemperature;
      if ((request.metadata as any)?.manufacturerId !== undefined) data.manufacturerId = (request.metadata as any).manufacturerId;
      
      // Sandia Parameters
      if (request.metadata.sandiaParameters) {
        if (request.metadata.sandiaParameters.vdco !== undefined) data.vdco = request.metadata.sandiaParameters.vdco;
        if (request.metadata.sandiaParameters.pso !== undefined) data.pso = request.metadata.sandiaParameters.pso;
        if (request.metadata.sandiaParameters.c0 !== undefined) data.c0 = request.metadata.sandiaParameters.c0;
        if (request.metadata.sandiaParameters.c1 !== undefined) data.c1 = request.metadata.sandiaParameters.c1;
        if (request.metadata.sandiaParameters.c2 !== undefined) data.c2 = request.metadata.sandiaParameters.c2;
        if (request.metadata.sandiaParameters.c3 !== undefined) data.c3 = request.metadata.sandiaParameters.c3;
        if (request.metadata.sandiaParameters.pnt !== undefined) data.pnt = request.metadata.sandiaParameters.pnt;
      }
    }
    
    return data;
  }

  // TODO: Implement response DTOs later
  // static toResponseDto(inverter: any): InverterResponseDto { ... }
  // static toListResponseDto(...) { ... }
}