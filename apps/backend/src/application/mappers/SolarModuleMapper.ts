import { SolarModule } from '../../domain/entities/SolarModule';
import { SolarModuleResponseDto, SolarModuleListResponseDto } from '../dtos/output/SolarModuleResponseDto';

export class SolarModuleMapper {
  
  static toResponseDto(module: SolarModule): SolarModuleResponseDto {
    const areaM2 = module.calculateArea();
    const densidadePotencia = module.calculatePowerDensity();
    
    return {
      id: module.id!,
      fabricante: module.fabricante,
      modelo: module.modelo,
      potenciaNominal: module.potenciaNominal,
      larguraMm: module.larguraMm,
      alturaMm: module.alturaMm,
      espessuraMm: module.espessuraMm,
      vmpp: module.vmpp,
      impp: module.impp,
      voc: module.voc,
      isc: module.isc,
      tipoCelula: module.tipoCelula,
      eficiencia: module.eficiencia,
      numeroCelulas: module.numeroCelulas,
      tempCoefPmax: module.tempCoefPmax,
      tempCoefVoc: module.tempCoefVoc,
      tempCoefIsc: module.tempCoefIsc,
      pesoKg: module.pesoKg,
      datasheetUrl: module.datasheetUrl,
      certificacoes: module.certificacoes,
      garantiaAnos: module.garantiaAnos,
      tolerancia: module.tolerancia,
      
      // Parâmetros para modelo espectral
      material: module.material,
      technology: module.technology,
      
      // Parâmetros do modelo de diodo único
      aRef: module.aRef,
      iLRef: module.iLRef,
      iORef: module.iORef,
      rS: module.rS,
      rShRef: module.rShRef,
      
      // Coeficientes de temperatura críticos
      alphaSc: module.alphaSc,
      betaOc: module.betaOc,
      gammaR: module.gammaR,
      
      // Parâmetros SAPM térmicos
      a0: module.a0, a1: module.a1, a2: module.a2, a3: module.a3, a4: module.a4,
      b0: module.b0, b1: module.b1, b2: module.b2, b3: module.b3, b4: module.b4, b5: module.b5,
      dtc: module.dtc,
      
      // Campos calculados
      areaM2: areaM2 ? Math.round(areaM2 * 100) / 100 : undefined,
      densidadePotencia: densidadePotencia ? Math.round(densidadePotencia * 100) / 100 : undefined,
      
      createdAt: module.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: module.updatedAt?.toISOString() || new Date().toISOString(),
    };
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