// Arquivo temporário para manter compatibilidade durante migração
// TODO: Remover após migração completa dos componentes

export interface SolarModule {
  id: string;
  userId?: string;
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number;
  larguraMm?: number;
  alturaMm?: number;
  espessuraMm?: number;
  vmpp?: number;
  impp?: number;
  voc?: number;
  isc?: number;
  tipoCelula?: string;
  eficiencia?: number;
  numeroCelulas?: number;
  tempCoefPmax?: number;
  tempCoefVoc?: number;
  tempCoefIsc?: number;
  tolerancia?: number;
  densidadePotencia?: number;
  material?: string;
  technology?: string;
  aRef?: number;
  iLRef?: number;
  iORef?: number;
  rS?: number;
  rShRef?: number;
  alphaSc?: number;
  betaOc?: number;
  gammaR?: number;
  a0?: number; a1?: number; a2?: number; a3?: number; a4?: number;
  b0?: number; b1?: number; b2?: number; b3?: number; b4?: number; b5?: number;
  dtc?: number;
  pesoKg?: number;
  datasheetUrl?: string;
  certificacoes?: string[];
  garantiaAnos?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive';
}

export interface Inverter {
  id: string;
  userId?: string;
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  tipoRede: string;
  potenciaFvMax?: number;
  tensaoCcMax?: number;
  numeroMppt?: number;
  stringsPorMppt?: number;
  faixaMppt?: string;
  correnteEntradaMax?: number;
  potenciaAparenteMax?: number;
  correnteSaidaMax?: number;
  tensaoSaidaNominal?: number;
  frequenciaNominal?: number;
  eficienciaMax?: number;
  eficienciaEuropeia?: number;
  eficienciaMppt?: number;
  protecoes?: string[];
  certificacoes?: string[];
  grauProtecao?: string;
  dimensoes?: string;
  pesoKg?: number;
  temperaturaOperacao?: string;
  garantiaAnos?: number;
  datasheetUrl?: string;
  precoReferencia?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive';
}

export interface Manufacturer {
  id: string;
  userId?: string;
  name: string;
  type: 'SOLAR_MODULE' | 'INVERTER' | 'BOTH';
  description?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  isDefault?: boolean;
  country?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedManufacturers {
  manufacturers: Manufacturer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedModules {
  modules: SolarModule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedInverters {
  inverters: Inverter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SolarModuleInput {
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number;
  eficiencia?: number;
  vmpp?: number;
  impp?: number;
  voc?: number;
  isc?: number;
  tipoCelula?: string;
  numeroCelulas?: number;
  tempCoefPmax?: number;
  tempCoefVoc?: number;
  tempCoefIsc?: number;
  aRef?: number;
  iLRef?: number;
  iORef?: number;
  rS?: number;
  rShRef?: number;
  garantiaAnos?: number;
  larguraMm?: number;
  alturaMm?: number;
  espessuraMm?: number;
  pesoKg?: number;
  datasheetUrl?: string;
  certificacoes?: string[];
  tolerancia?: number;
}

export interface InverterInput {
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  tipoRede: string;
  potenciaFvMax?: number;
  tensaoCcMax?: number;
  numeroMppt?: number;
  stringsPorMppt?: number;
  faixaMppt?: string;
  correnteEntradaMax?: number;
  potenciaAparenteMax?: number;
  correnteSaidaMax?: number;
  tensaoSaidaNominal?: number;
  frequenciaNominal?: number;
  eficienciaMax?: number;
  eficienciaEuropeia?: number;
  eficienciaMppt?: number;
  protecoes?: string[];
  certificacoes?: string[];
  grauProtecao?: string;
  dimensoes?: string;
  pesoKg?: number;
  temperaturaOperacao?: string;
  garantiaAnos?: number;
  datasheetUrl?: string;
  precoReferencia?: number;
}

export enum ManufacturerType {
  SOLAR_MODULE = 'SOLAR_MODULE',
  INVERTER = 'INVERTER',
  BATTERY = 'BATTERY',
  OTHER = 'OTHER',
  BOTH = 'BOTH'
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

