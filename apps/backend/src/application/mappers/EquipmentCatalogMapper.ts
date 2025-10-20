import { SolarModule, SolarModuleData } from '../../domain/entities/SolarModule';
import { Manufacturer, ManufacturerData } from '../../domain/entities/Manufacturer';
import { Inverter, InverterData } from '../../domain/entities/Inverter';
import { 
  CreateSolarModuleRequest 
} from '../dtos/input/equipment/CreateSolarModuleRequest';
import { 
  UpdateSolarModuleRequest 
} from '../dtos/input/equipment/UpdateSolarModuleRequest';
import { 
  CreateManufacturerRequestBackend 
} from '../dtos/input/manufacturer/CreateManufacturerRequest';
import { 
  CreateModuleRequest,
  UpdateModuleRequest,
  ModuleSpecifications,
  ModuleParameters,
  ModuleDimensions,
  ModuleMetadata,
  TemperatureCoefficients,
  DiodeParameters,
  SAPMParameters,
  SpectralParameters,
  AdvancedModuleParameters
} from '@bess-pro/shared';

/**
 * Equipment Catalog Mapper
 * 
 * Este mapper converte entre os diferentes formatos de DTOs:
 * - Entity Data Objects (backend)
 * - Shared Types (cross-app)
 * - Request DTOs (API input)
 */
export class EquipmentCatalogMapper {

  // === Solar Module Mappers ===

  /**
   * Converte CreateSolarModuleRequest para SolarModuleData
   */
  static createModuleRequestToModuleData(
    request: CreateSolarModuleRequest,
    teamId: string
  ): SolarModuleData {
    return {
      teamId,
      manufacturerId: request.manufacturer, // ID do manufacturer
      modelo: request.model,
      potenciaNominal: request.nominalPower,
      
      // Specifications
      vmpp: request.specifications.vmpp,
      impp: request.specifications.impp,
      voc: request.specifications.voc,
      isc: request.specifications.isc,
      eficiencia: request.specifications.efficiency,
      tipoCelula: request.specifications.cellType,
      numeroCelulas: request.specifications.numberOfCells,
      technology: request.specifications.technology,
      
      // Dimensions
      larguraMm: request.dimensions.widthMm,
      alturaMm: request.dimensions.heightMm,
      espessuraMm: request.dimensions.thicknessMm,
      pesoKg: request.dimensions.weightKg,
      
      // Parameters - Temperature
      tempCoefPmax: request.parameters.temperature.tempCoeffPmax,
      tempCoefVoc: request.parameters.temperature.tempCoeffVoc,
      tempCoefIsc: request.parameters.temperature.tempCoeffIsc,
      
      // Parameters - Diode
      aRef: request.parameters.diode.aRef,
      iLRef: request.parameters.diode.iLRef,
      iORef: request.parameters.diode.iORef,
      rS: request.parameters.diode.rS,
      rShRef: request.parameters.diode.rShRef,
      
      // Parameters - SAPM
      a0: request.parameters.sapm.a0,
      a1: request.parameters.sapm.a1,
      a2: request.parameters.sapm.a2,
      a3: request.parameters.sapm.a3,
      a4: request.parameters.sapm.a4,
      b0: request.parameters.sapm.b0,
      b1: request.parameters.sapm.b1,
      b2: request.parameters.sapm.b2,
      b3: request.parameters.sapm.b3,
      b4: request.parameters.sapm.b4,
      // b5: request.parameters.sapm.b5, // Propriedade não existe no shared type
      dtc: request.parameters.sapm.fd,
      
      // Parameters - Spectral
      material: request.parameters.spectral.material,
      
      // Parameters - Advanced
      alphaSc: request.parameters.advanced.alphaSc,
      betaOc: request.parameters.advanced.betaOc,
      gammaR: request.parameters.advanced.gammaR,
      
      // Metadata
      datasheetUrl: request.metadata.datasheetUrl,
      certificacoes: request.metadata.certifications,
      garantiaAnos: request.metadata.warranty,
      tolerancia: request.metadata.tolerance,
      
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Converte UpdateSolarModuleRequest para atualização parcial
   */
  static updateModuleRequestToModuleData(
    request: UpdateSolarModuleRequest
  ): Partial<SolarModuleData> {
    const updates: Partial<SolarModuleData> = {
      updatedAt: new Date()
    };

    if (request.model !== undefined) updates.modelo = request.model;
    if (request.nominalPower !== undefined) updates.potenciaNominal = request.nominalPower;
    
    // Specifications
    if (request.specifications) {
      if (request.specifications.vmpp !== undefined) updates.vmpp = request.specifications.vmpp;
      if (request.specifications.impp !== undefined) updates.impp = request.specifications.impp;
      if (request.specifications.voc !== undefined) updates.voc = request.specifications.voc;
      if (request.specifications.isc !== undefined) updates.isc = request.specifications.isc;
      if (request.specifications.efficiency !== undefined) updates.eficiencia = request.specifications.efficiency;
      if (request.specifications.cellType !== undefined) updates.tipoCelula = request.specifications.cellType;
      if (request.specifications.numberOfCells !== undefined) updates.numeroCelulas = request.specifications.numberOfCells;
      if (request.specifications.technology !== undefined) updates.technology = request.specifications.technology;
    }
    
    // Dimensions
    if (request.dimensions) {
      if (request.dimensions.widthMm !== undefined) updates.larguraMm = request.dimensions.widthMm;
      if (request.dimensions.heightMm !== undefined) updates.alturaMm = request.dimensions.heightMm;
      if (request.dimensions.thicknessMm !== undefined) updates.espessuraMm = request.dimensions.thicknessMm;
      if (request.dimensions.weightKg !== undefined) updates.pesoKg = request.dimensions.weightKg;
    }
    
    // Parameters
    if (request.parameters) {
      if (request.parameters.temperature) {
        if (request.parameters.temperature.tempCoeffPmax !== undefined) updates.tempCoefPmax = request.parameters.temperature.tempCoeffPmax;
        if (request.parameters.temperature.tempCoeffVoc !== undefined) updates.tempCoefVoc = request.parameters.temperature.tempCoeffVoc;
        if (request.parameters.temperature.tempCoeffIsc !== undefined) updates.tempCoefIsc = request.parameters.temperature.tempCoeffIsc;
      }
      
      if (request.parameters.diode) {
        if (request.parameters.diode.aRef !== undefined) updates.aRef = request.parameters.diode.aRef;
        if (request.parameters.diode.iLRef !== undefined) updates.iLRef = request.parameters.diode.iLRef;
        if (request.parameters.diode.iORef !== undefined) updates.iORef = request.parameters.diode.iORef;
        if (request.parameters.diode.rS !== undefined) updates.rS = request.parameters.diode.rS;
        if (request.parameters.diode.rShRef !== undefined) updates.rShRef = request.parameters.diode.rShRef;
      }
      
      if (request.parameters.spectral) {
        if (request.parameters.spectral.material !== undefined) updates.material = request.parameters.spectral.material;
      }
      
      if (request.parameters.advanced) {
        if (request.parameters.advanced.alphaSc !== undefined) updates.alphaSc = request.parameters.advanced.alphaSc;
        if (request.parameters.advanced.betaOc !== undefined) updates.betaOc = request.parameters.advanced.betaOc;
        if (request.parameters.advanced.gammaR !== undefined) updates.gammaR = request.parameters.advanced.gammaR;
      }
    }
    
    // Metadata
    if (request.metadata) {
      if (request.metadata.datasheetUrl !== undefined) updates.datasheetUrl = request.metadata.datasheetUrl;
      if (request.metadata.certifications !== undefined) updates.certificacoes = request.metadata.certifications;
      if (request.metadata.warranty !== undefined) updates.garantiaAnos = request.metadata.warranty;
      if (request.metadata.tolerance !== undefined) updates.tolerancia = request.metadata.tolerance;
    }

    return updates;
  }

  // === Manufacturer Mappers ===

  /**
   * Converte CreateManufacturerRequestBackend para ManufacturerData
   */
  static createManufacturerRequestToManufacturerData(
    request: CreateManufacturerRequestBackend
  ): ManufacturerData {
    return {
      name: request.name,
      type: 'BOTH' as any, // Default para compatibilidade
      teamId: request.teamId,
      isPublic: false, // Default para compatibilidade
      description: request.description,
      website: request.website,
      country: request.address?.country,
      logoUrl: request.logoUrl,
      supportEmail: request.supportEmail,
      supportPhone: request.supportPhone,
      certifications: request.certifications,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // === Legacy Compatibility ===

  /**
   * Converte Command antigo para Request novo (compatibilidade)
   */
  static legacyCommandToCreateRequest(
    command: any
  ): CreateSolarModuleRequest {
    const userId = command.userId || 'system';
    return {
      userId,
      manufacturer: command.manufacturerId,
      model: command.modelo,
      nominalPower: command.potenciaNominal,
      teamId: command.teamId || '',
      specifications: {
        vmpp: command.vmpp,
        impp: command.impp,
        voc: command.voc,
        isc: command.isc,
        efficiency: command.eficiencia,
        cellType: command.tipoCelula as any,
        numberOfCells: command.numeroCelulas,
        technology: command.technology as any
      },
      parameters: {
        temperature: {
          tempCoeffPmax: command.tempCoefPmax,
          tempCoeffVoc: command.tempCoefVoc,
          tempCoeffIsc: command.tempCoefIsc
        },
        diode: {
          aRef: command.aRef,
          iLRef: command.iLRef,
          iORef: command.iORef,
          rS: command.rS,
          rShRef: command.rShRef
        },
        sapm: {
          a0: command.a0,
          a1: command.a1,
          a2: command.a2,
          a3: command.a3,
          a4: command.a4,
          b0: command.b0,
          b1: command.b1,
          b2: command.b2,
          b3: command.b3,
          b4: command.b4,
          // b5: command.b5, // Propriedade não existe no shared type
          fd: command.dtc
        },
        spectral: {
          material: command.material,
          technology: command.technology
        },
        advanced: {
          alphaSc: command.alphaSc,
          betaOc: command.betaOc,
          gammaR: command.gammaR
        }
      },
      dimensions: {
        widthMm: command.larguraMm,
        heightMm: command.alturaMm,
        thicknessMm: command.espessuraMm,
        weightKg: command.pesoKg
      },
      metadata: {
        datasheetUrl: command.datasheetUrl,
        certifications: command.certificacoes,
        warranty: command.garantiaAnos,
        tolerance: command.tolerancia
      }
    };
  }
}