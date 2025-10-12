import { CreateInverterRequest } from '@bess-pro/shared';

/**
 * Create Inverter Request - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende o tipo compartilhado para adicionar campos específicos
 * do backend como userId para controle de acesso.
 */
export interface CreateInverterRequestBackend extends CreateInverterRequest {
  /** ID do usuário proprietário do inversor */
  userId: string;
  
  /** Flag para indicar se é equipamento público */
  isPublic?: boolean;
}

/**
 * Create Inverter Command - Mantido para compatibilidade
 * @deprecated Use CreateInverterRequestBackend instead
 */
export interface CreateInverterCommand {
  userId: string;
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number; // Watts
  potenciaMaximaModulos: number; // Watts
  tensaoEntradaMaxima: number; // Volts
  correnteEntradaMaxima: number; // Amperes
  potenciaSaidaCA: number; // Watts
  tensaoNominalSaida: number; // Volts
  frequenciaSaida: number; // Hz
  fatorPotencia: number; // 0-1
  eficienciaMaxima: number; // Percentual
  numeroMppts: number;
  stringsPorMppt: number;
  tensaoInicialMppt: number; // Volts
  tensaoFinalMppt: number; // Volts
  tipoRede?: string; // Monofasico, Trifasico
  pesoKg?: number;
  datasheetUrl?: string;
  certificacoes?: string[];
  garantiaAnos?: number;
  tolerancia?: string;
  
  // Campos adicionais para compatibilidade futura
  correnteCurtoCircuitoMaxima?: number;
  tensaoCurtoCircuitoMaxima?: number;
  potenciaAparenteMaxima?: number;
}