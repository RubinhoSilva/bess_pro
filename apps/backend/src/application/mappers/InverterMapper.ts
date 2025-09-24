import { Inverter } from '../../domain/entities/Inverter';
import { InverterResponseDto, InverterListResponseDto } from '../dtos/output/InverterResponseDto';

export class InverterMapper {
  
  static toResponseDto(inverter: Inverter, moduleReferencePower?: number): InverterResponseDto {
    const maxModulosSuportados = moduleReferencePower ? inverter.calculateMaxModules(moduleReferencePower) : undefined;
    const maxStringsTotal = inverter.calculateMaxStrings();
    const tipoFase = inverter.getPhaseType();
    
    return {
      id: inverter.id!,
      fabricante: inverter.fabricante,
      modelo: inverter.modelo,
      potenciaSaidaCA: inverter.potenciaSaidaCA,
      tipoRede: inverter.tipoRede,
      
      // Dados de entrada (CC/FV)
      potenciaFvMax: inverter.potenciaFvMax,
      tensaoCcMax: inverter.tensaoCcMax,
      numeroMppt: inverter.numeroMppt,
      stringsPorMppt: inverter.stringsPorMppt,
      faixaMppt: inverter.faixaMppt,
      correnteEntradaMax: inverter.correnteEntradaMax,
      
      // Dados de saída (CA)
      potenciaAparenteMax: inverter.potenciaAparenteMax,
      correnteSaidaMax: inverter.correnteSaidaMax,
      tensaoSaidaNominal: inverter.toJSON().tensaoSaidaNominal,
      frequenciaNominal: inverter.toJSON().frequenciaNominal,
      
      // Eficiência
      eficienciaMax: inverter.eficienciaMax,
      eficienciaEuropeia: inverter.eficienciaEuropeia,
      eficienciaMppt: inverter.toJSON().eficienciaMppt,
      
      // Proteções e certificações
      protecoes: inverter.toJSON().protecoes,
      certificacoes: inverter.certificacoes,
      grauProtecao: inverter.toJSON().grauProtecao,
      
      // Características físicas
      dimensoes: inverter.toJSON().dimensoes,
      pesoKg: inverter.toJSON().pesoKg,
      temperaturaOperacao: inverter.toJSON().temperaturaOperacao,
      
      // Dados comerciais
      garantiaAnos: inverter.garantiaAnos,
      datasheetUrl: inverter.datasheetUrl,
      precoReferencia: inverter.toJSON().precoReferencia,
      
      // Parâmetros Sandia para simulação precisa
      vdco: inverter.vdco,
      pso: inverter.pso,
      c0: inverter.c0,
      c1: inverter.c1,
      c2: inverter.c2,
      c3: inverter.c3,
      pnt: inverter.pnt,
      
      // Campos calculados
      maxModulosSuportados,
      maxStringsTotal,
      tipoFase,
      
      createdAt: inverter.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: inverter.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  static toListResponseDto(
    inverters: Inverter[], 
    total: number,
    page?: number,
    pageSize?: number,
    moduleReferencePower?: number
  ): InverterListResponseDto {
    return {
      inverters: inverters.map(inverter => this.toResponseDto(inverter, moduleReferencePower)),
      total,
      page,
      pageSize,
      totalPages: pageSize ? Math.ceil(total / pageSize) : undefined,
    };
  }

  static toResponseDtoList(inverters: Inverter[], moduleReferencePower?: number): InverterResponseDto[] {
    return inverters.map(inverter => this.toResponseDto(inverter, moduleReferencePower));
  }
}