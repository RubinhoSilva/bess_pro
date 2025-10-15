import { 
  SelectedInverter as SharedSelectedInverter,
  SelectedModule as SharedSelectedModule,
  SystemSystemCalculations,
  SystemLosses
} from '@bess-pro/shared';

// Interfaces legadas (compatibilidade)
export interface LegacySelectedInverter {
  id: string;
  inverterId: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  tipoRede: string;
  potenciaFvMax?: number;
  numeroMppt: number;
  stringsPorMppt: number;
  tensaoCcMax: number;
  eficienciaMax?: number;
  correnteEntradaMax?: number;
  potenciaAparenteMax?: number;
  faixaMpptMin?: number;
  faixaMpptMax?: number;
  quantity: number;
  vdco?: number;
  pso?: number;
  c0?: number;
  c1?: number;
  c2?: number;
  c3?: number;
  pnt?: number;
}

export interface LegacyDimensioningData {
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaOutras?: number;
  selectedInverters?: SharedSelectedInverter[];
  dimensioningName?: string;
  customer?: any;
  endereco?: string;
  cidade?: string;
  estado?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Converte dados do contexto para SystemLosses do shared package
 * Mantém compatibilidade com estrutura de perdas do sistema
 */
export const convertToSystemLosses = (data: LegacyDimensioningData): SystemLosses => ({
  temperatureLoss: 0, // Não existe no formato legado
  shadingLoss: data.perdaSombreamento || 3,
  mismatchLoss: data.perdaMismatch || 2,
  cablingLoss: data.perdaCabeamento || 2,
  soilingLoss: data.perdaSujeira || 5,
  otherLosses: (data.perdaInversor || 3) + (data.perdaOutras || 0)
});

/**
 * Converte SelectedInverter legado para SharedSelectedInverter
 * Transforma estrutura antiga para novo formato do shared package
 */
export const convertToSharedSelectedInverter = (legacy: LegacySelectedInverter): SharedSelectedInverter => ({
  inverter: {
    id: legacy.inverterId,
    manufacturer: {
      id: legacy.inverterId,
      name: legacy.fabricante,
      type: 'INVERTER' as any,
      description: '',
      website: '',
      contact: {
        email: '',
        phone: '',
      },
      business: {
        foundedYear: new Date().getFullYear(),
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
    },
    model: legacy.modelo,
    power: {
      ratedACPower: legacy.potenciaSaidaCA,
      maxPVPower: legacy.potenciaFvMax || legacy.potenciaSaidaCA * 1.2,
      shortCircuitVoltageMax: legacy.tensaoCcMax,
      maxInputCurrent: legacy.correnteEntradaMax || 0,
      maxApparentPower: legacy.potenciaAparenteMax || legacy.potenciaSaidaCA,
    },
    mppt: {
      numberOfMppts: legacy.numeroMppt,
      stringsPerMppt: legacy.stringsPorMppt,
    },
    electrical: {
      maxEfficiency: legacy.eficienciaMax || 95,
      gridType: legacy.tipoRede as 'monofasico' | 'bifasico' | 'trifasico',
    },
    metadata: {
      manufacturerId: legacy.inverterId,
      warranty: 5,
      certifications: [],
      connectionType: 'on-grid',
    },
    status: 'active',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  quantity: legacy.quantity,
  selectedAt: new Date(),
  observations: undefined
});

/**
 * Converte dados do dimensionamento para requisição da API
 * Prepara dados para salvar/atualizar projeto no backend
 */
export const dimensioningToApiRequest = (dimensioning: LegacyDimensioningData) => {
  return {
    projectName: dimensioning.dimensioningName,
    projectType: 'pv',
    leadId: dimensioning.customer?.id,
    address: dimensioning.endereco || dimensioning.cidade || dimensioning.estado || '',
    projectData: {
      ...dimensioning,
      dimensioningName: dimensioning.dimensioningName
    }
  };
};

/**
 * Valida dados obrigatórios do dimensionamento
 * Retorna array de erros para validação antes de salvar
 */
export const validateDimensioningData = (dimensioning: LegacyDimensioningData): string[] => {
  const errors: string[] = [];

  if (!dimensioning.dimensioningName?.trim()) {
    errors.push('Nome do dimensionamento é obrigatório');
  }

  if (!dimensioning.customer) {
    errors.push('Cliente é obrigatório');
  }

  if (!dimensioning.customer?.id) {
    errors.push('ID do cliente é obrigatório');
  }

  return errors;
};

/**
 * Converte resposta da API para dados do dimensionamento
 * Transforma resposta do backend para formato do contexto
 */
export const apiResponseToDimensioning = (apiResponse: any): LegacyDimensioningData => {
  return {
    ...apiResponse.projectData,
    id: apiResponse.id,
    dimensioningName: apiResponse.projectName,
    createdAt: apiResponse.createdAt,
    updatedAt: apiResponse.updatedAt
  };
};