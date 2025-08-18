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