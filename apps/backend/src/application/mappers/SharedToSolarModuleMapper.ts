import { SolarModuleData } from '../../../src/domain/entities/SolarModule';
import { CreateModuleRequest, UpdateModuleRequest } from '@bess-pro/shared';

export class SharedToSolarModuleMapper {
  
  static createRequestToEntityData(request: CreateModuleRequest): SolarModuleData {
    return {
      teamId: request.teamId,
      isDefault: false, // Módulos criados por usuários não são padrão
      manufacturerId: request.manufacturer,
      modelo: request.model,
      potenciaNominal: request.nominalPower,
      
      // Dimensions
      larguraMm: request.dimensions.widthMm,
      alturaMm: request.dimensions.heightMm,
      espessuraMm: request.dimensions.thicknessMm,
      pesoKg: request.dimensions.weightKg,
      
      // Specifications
      vmpp: request.specifications.vmpp,
      impp: request.specifications.impp,
      voc: request.specifications.voc,
      isc: request.specifications.isc,
      tipoCelula: request.specifications.cellType,
      eficiencia: request.specifications.efficiency,
      numeroCelulas: request.specifications.numberOfCells,
      technology: request.specifications.technology,
      
      // Parameters - Temperature
      tempCoefPmax: request.parameters.temperature?.tempCoeffPmax,
      tempCoefVoc: request.parameters.temperature?.tempCoeffVoc,
      tempCoefIsc: request.parameters.temperature?.tempCoeffIsc,
      
      // Parameters - Diode
      aRef: request.parameters.diode?.aRef,
      iLRef: request.parameters.diode?.iLRef,
      iORef: request.parameters.diode?.iORef,
      rS: request.parameters.diode?.rS,
      rShRef: request.parameters.diode?.rShRef,
      
      // Parameters - SAPM
      a0: request.parameters.sapm?.a0,
      a1: request.parameters.sapm?.a1,
      a2: request.parameters.sapm?.a2,
      a3: request.parameters.sapm?.a3,
      a4: request.parameters.sapm?.a4,
      b0: request.parameters.sapm?.b0,
      b1: request.parameters.sapm?.b1,
      b2: request.parameters.sapm?.b2,
      b3: request.parameters.sapm?.b3,
      b4: request.parameters.sapm?.b4,
      dtc: request.parameters.sapm?.fd,
      
      // Parameters - Spectral
      material: request.parameters.spectral?.material,
      
      // Parameters - Advanced
      alphaSc: request.parameters.advanced?.alphaSc,
      betaOc: request.parameters.advanced?.betaOc,
      gammaR: request.parameters.advanced?.gammaR,
      
      // Metadata
      datasheetUrl: request.metadata.datasheetUrl,
      certificacoes: request.metadata.certifications,
      garantiaAnos: request.metadata.warranty,
      tolerancia: request.metadata.tolerance
    };
  }
  
  static updateRequestToEntityData(request: UpdateModuleRequest): Partial<SolarModuleData> {
    const data: Partial<SolarModuleData> = {};
    
    if (request.manufacturer !== undefined) data.manufacturerId = request.manufacturer;
    if (request.model !== undefined) data.modelo = request.model;
    if (request.nominalPower !== undefined) data.potenciaNominal = request.nominalPower;
    
    // Dimensions
    if (request.dimensions) {
      if (request.dimensions.widthMm !== undefined) data.larguraMm = request.dimensions.widthMm;
      if (request.dimensions.heightMm !== undefined) data.alturaMm = request.dimensions.heightMm;
      if (request.dimensions.thicknessMm !== undefined) data.espessuraMm = request.dimensions.thicknessMm;
      if (request.dimensions.weightKg !== undefined) data.pesoKg = request.dimensions.weightKg;
    }
    
    // Specifications
    if (request.specifications) {
      if (request.specifications.vmpp !== undefined) data.vmpp = request.specifications.vmpp;
      if (request.specifications.impp !== undefined) data.impp = request.specifications.impp;
      if (request.specifications.voc !== undefined) data.voc = request.specifications.voc;
      if (request.specifications.isc !== undefined) data.isc = request.specifications.isc;
      if (request.specifications.cellType !== undefined) data.tipoCelula = request.specifications.cellType;
      if (request.specifications.efficiency !== undefined) data.eficiencia = request.specifications.efficiency;
      if (request.specifications.numberOfCells !== undefined) data.numeroCelulas = request.specifications.numberOfCells;
      if (request.specifications.technology !== undefined) data.technology = request.specifications.technology;
    }
    
    // Parameters
    if (request.parameters) {
      // Temperature
      if (request.parameters.temperature) {
        if (request.parameters.temperature.tempCoeffPmax !== undefined) data.tempCoefPmax = request.parameters.temperature.tempCoeffPmax;
        if (request.parameters.temperature.tempCoeffVoc !== undefined) data.tempCoefVoc = request.parameters.temperature.tempCoeffVoc;
        if (request.parameters.temperature.tempCoeffIsc !== undefined) data.tempCoefIsc = request.parameters.temperature.tempCoeffIsc;
      }
      
      // Diode
      if (request.parameters.diode) {
        if (request.parameters.diode.aRef !== undefined) data.aRef = request.parameters.diode.aRef;
        if (request.parameters.diode.iLRef !== undefined) data.iLRef = request.parameters.diode.iLRef;
        if (request.parameters.diode.iORef !== undefined) data.iORef = request.parameters.diode.iORef;
        if (request.parameters.diode.rS !== undefined) data.rS = request.parameters.diode.rS;
        if (request.parameters.diode.rShRef !== undefined) data.rShRef = request.parameters.diode.rShRef;
      }
      
      // SAPM
      if (request.parameters.sapm) {
        if (request.parameters.sapm.a0 !== undefined) data.a0 = request.parameters.sapm.a0;
        if (request.parameters.sapm.a1 !== undefined) data.a1 = request.parameters.sapm.a1;
        if (request.parameters.sapm.a2 !== undefined) data.a2 = request.parameters.sapm.a2;
        if (request.parameters.sapm.a3 !== undefined) data.a3 = request.parameters.sapm.a3;
        if (request.parameters.sapm.a4 !== undefined) data.a4 = request.parameters.sapm.a4;
        if (request.parameters.sapm.b0 !== undefined) data.b0 = request.parameters.sapm.b0;
        if (request.parameters.sapm.b1 !== undefined) data.b1 = request.parameters.sapm.b1;
        if (request.parameters.sapm.b2 !== undefined) data.b2 = request.parameters.sapm.b2;
        if (request.parameters.sapm.b3 !== undefined) data.b3 = request.parameters.sapm.b3;
        if (request.parameters.sapm.b4 !== undefined) data.b4 = request.parameters.sapm.b4;
        if (request.parameters.sapm.fd !== undefined) data.dtc = request.parameters.sapm.fd;
      }
      
      // Spectral
      if (request.parameters.spectral) {
        if (request.parameters.spectral.material !== undefined) data.material = request.parameters.spectral.material;
      }
      
      // Advanced
      if (request.parameters.advanced) {
        if (request.parameters.advanced.alphaSc !== undefined) data.alphaSc = request.parameters.advanced.alphaSc;
        if (request.parameters.advanced.betaOc !== undefined) data.betaOc = request.parameters.advanced.betaOc;
        if (request.parameters.advanced.gammaR !== undefined) data.gammaR = request.parameters.advanced.gammaR;
      }
    }
    
    // Metadata
    if (request.metadata) {
      if (request.metadata.datasheetUrl !== undefined) data.datasheetUrl = request.metadata.datasheetUrl;
      if (request.metadata.certifications !== undefined) data.certificacoes = request.metadata.certifications;
      if (request.metadata.warranty !== undefined) data.garantiaAnos = request.metadata.warranty;
      if (request.metadata.tolerance !== undefined) data.tolerancia = request.metadata.tolerance;
    }
    
    return data;
  }
}