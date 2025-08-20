// Tipos para a nova estrutura de dimensionamentos e análises

export interface BaseDimensioning {
  id: string;
  name: string; // Nome do dimensionamento/análise
  leadId: string; // Lead obrigatório
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'calculated' | 'approved';
}

export interface PVDimensioning extends BaseDimensioning {
  type: 'pv';
  data: {
    // Dados do lead (copiados no momento da criação)
    customer: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      address?: string;
      type: 'client' | 'lead';
    };
    
    // Dados específicos do dimensionamento PV
    location?: {
      latitude: number;
      longitude: number;
      address: string;
      estado?: string;
      cidade?: string;
    };
    
    energyBills?: Array<{
      id: string;
      name: string;
      consumoMensal: number[];
    }>;
    
    systemParameters?: {
      potenciaModulo?: number;
      numeroModulos?: number;
      eficienciaSistema?: number;
      selectedModuleId?: string;
    };
    
    inverters?: Array<{
      id: string;
      selectedInverterId: string;
      quantity: number;
    }>;
    
    tariff?: {
      grupoTarifario?: 'A' | 'B';
      tarifaEnergiaB?: number;
      custoFioB?: number;
      tarifaEnergiaPontaA?: number;
      tarifaEnergiaForaPontaA?: number;
      demandaContratada?: number;
      tarifaDemanda?: number;
    };
    
    financial?: {
      custoEquipamento?: number;
      custoMateriais?: number;
      custoMaoDeObra?: number;
      bdi?: number;
      taxaDesconto?: number;
      inflacaoEnergia?: number;
      vidaUtil?: number;
    };
    
    paymentMethod?: {
      method: 'vista' | 'cartao' | 'financiamento';
      cardInstallments?: number;
      cardInterest?: number;
      financingInstallments?: number;
      financingInterest?: number;
    };
    
    // Resultados dos cálculos
    results?: any;
  };
}

export interface BESSAnalysis extends BaseDimensioning {
  type: 'bess';
  data: {
    // Dados do lead (copiados no momento da criação)
    customer: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      address?: string;
      type: 'client' | 'lead';
    };
    
    // Configuração do sistema BESS
    systemConfig: {
      solar: boolean;
      bess: boolean;
      diesel: boolean;
    };
    
    // Dados específicos da análise BESS
    inputs: any; // Dados de entrada da simulação
    
    // Resultados da simulação
    results?: any;
  };
}

// União de tipos
export type DimensioningItem = PVDimensioning | BESSAnalysis;

// Interface para criar novos dimensionamentos/análises
export interface CreatePVDimensioningRequest {
  name: string;
  leadId: string;
  data: PVDimensioning['data'];
}

export interface CreateBESSAnalysisRequest {
  name: string;
  leadId: string;
  data: BESSAnalysis['data'];
}

// Interface para listagem agrupada por data
export interface DimensioningsByDate {
  year: number;
  months: Array<{
    month: number;
    monthName: string;
    items: DimensioningItem[];
    totalPV: number;
    totalBESS: number;
  }>;
}

// Interface para resposta da API
export interface DimensioningsResponse {
  items: DimensioningItem[];
  total: number;
  groupedByDate: DimensioningsByDate[];
}