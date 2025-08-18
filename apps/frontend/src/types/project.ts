export enum ProjectType {
  PV = 'pv',
  BESS = 'bess',
  HYBRID = 'hybrid'
}

export interface ProjectData {
  // Customer data
  customer?: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };

  // Location data
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    estado?: string;
    cidade?: string;
  };

  // Energy consumption data
  energyBills?: Array<{
    id: string;
    name: string;
    consumoMensal: number[];
  }>;

  // System parameters
  potenciaModulo?: number;
  numeroModulos?: number | null;
  eficienciaSistema?: number;
  selectedModuleId?: string;

  // Inverters
  inverters?: Array<{
    id: string;
    selectedInverterId: string;
    quantity: number;
  }>;
  totalInverterPower?: number;

  // Tariff data
  grupoTarifario?: 'A' | 'B';
  tarifaEnergiaB?: number;
  custoFioB?: number;
  tarifaEnergiaPontaA?: number;
  tarifaEnergiaForaPontaA?: number;
  demandaContratada?: number;
  tarifaDemanda?: number;

  // Financial data
  custoEquipamento?: number;
  custoMateriais?: number;
  custoMaoDeObra?: number;
  bdi?: number;
  taxaDesconto?: number;
  inflacaoEnergia?: number;
  vidaUtil?: number;

  // Payment method
  paymentMethod?: 'vista' | 'cartao' | 'financiamento';
  cardInstallments?: number;
  cardInterest?: number;
  financingInstallments?: number;
  financingInterest?: number;

  // Additional data
  cableSizing?: any[];
  modelo3dUrl?: string;
  googleSolarData?: any;
  irradiacaoMensal?: number[];
  
  // Advanced solar calculation fields
  inclinacao?: number;
  azimute?: number;
  considerarSombreamento?: boolean;
  sombreamento?: number[];
  perdaSujeira?: number;
  degradacaoModulos?: number;
  
  // Equipment selection
  selectedModules?: Array<{ module: any; quantity: number }>;
  selectedInverters?: Array<{ inverter: any; quantity: number }>;
}

// Definir tipos para análises específicas
export interface PVDimensioning {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: ProjectData;
  results?: any; // Resultados dos cálculos
  status: 'draft' | 'calculated' | 'approved';
}

export interface BESSAnalysis {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  systemConfig: {
    solar: boolean;
    bess: boolean;
    diesel: boolean;
  };
  inputs: any; // Dados de entrada da simulação BESS
  results?: any; // Resultados da simulação
  status: 'draft' | 'simulated' | 'approved';
}

export interface Project {
  id: string;
  projectName: string;
  projectType: ProjectType;
  userId: string;
  address: string;
  leadId?: string;
  savedAt: string;
  hasLocation: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  projectData: ProjectData;
  priority: number;
  
  // Arrays de dimensionamentos e análises
  pvDimensionings: PVDimensioning[];
  bessAnalyses: BESSAnalysis[];
  
  // Contadores para preview
  totalPVDimensionings: number;
  totalBESSAnalyses: number;
}

export interface ProjectSummary {
  id: string;
  projectName: string;
  projectType: ProjectType;
  address: string;
  savedAt: string;
  hasLocation: boolean;
  hasLead: boolean;
  
  // Contadores para preview
  totalPVDimensionings: number;
  totalBESSAnalyses: number;
  
  // Status do último item
  lastPVStatus?: 'draft' | 'calculated' | 'approved';
  lastBESSStatus?: 'draft' | 'simulated' | 'approved';
}

export interface CreateProjectData {
  projectName: string;
  projectType: ProjectType;
  address?: string;
  leadId?: string;
  projectData?: ProjectData;
}

export interface UpdateProjectData {
  projectName?: string;
  address?: string;
  projectData?: Partial<ProjectData>;
}

export interface ProjectsResponse {
  projects: ProjectSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectListFilters {
  projectType?: ProjectType;
  hasLocation?: boolean;
  hasLead?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}