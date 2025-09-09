import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { calculateSystemEfficiency, SystemLosses } from '@/lib/pvDimensioning';

// FUNCIONALIDADE DE MÚLTIPLAS ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
// export interface AguaTelhado {
//   id: string;
//   nome: string;
//   orientacao: number; // 0-360° (0=Norte, 90=Leste, 180=Sul, 270=Oeste)
//   inclinacao: number; // 0-90°
//   areaDisponivel?: number; // m²
//   numeroModulos: number;
//   sombreamentoParcial: number; // % específico desta área
// }

// Função utilitária para converter dados do contexto para SystemLosses
const convertToSystemLosses = (data: DimensioningData): SystemLosses => ({
  perdaSombreamento: data.perdaSombreamento,
  perdaMismatch: data.perdaMismatch,
  perdaCabeamento: data.perdaCabeamento,
  perdaSujeira: data.perdaSujeira,
  perdaInversor: data.perdaInversor,
  perdaOutras: data.perdaOutras
});

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  type: 'client' | 'lead';
}

export interface Project {
  id: string;
  name: string;
}

export interface EnergyBill {
  id: string;
  name: string;
  consumoMensal: number[];
}

export interface Inverter {
  id: string;
  selectedInverterId: string;
  quantity: number;
}

export interface CableSizing {
  tipoLigacao: string;
  tensaoCA: number;
  tipoCabo: string;
  distanciaCircuito: number;
  metodoInstalacao: string;
}

export interface MountingArea {
  id: string;
  name: string;
  geometria: Array<{ x: number; y: number; z: number }>;
  color?: string;
  opacity?: number;
}

export interface Measurement {
  id: string;
  distance: number;
  points: Array<{ x: number; y: number; z: number }>;
  unit: string;
  timestamp: string;
}

interface DimensioningData {
  id?: string;
  dimensioningName: string;
  customer?: Customer;
  project?: Project;
  projectName?: string;
  
  // Dados de localização e irradiação
  endereco?: string;
  cidade?: string;
  estado?: string;
  irradiacaoMensal: number[];
  
  // Sistema fotovoltaico
  potenciaModulo: number;
  numeroModulos: number;
  eficienciaSistema: number; // deprecated, use systemLosses
  // MÚLTIPLAS ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
  // aguasTelhado: AguaTelhado[];
  // Perdas específicas do sistema
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaOutras?: number;
  selectedModuleId?: string;
  moduloSelecionado?: string;
  eficienciaModulo?: number;
  tensaoModulo?: number;
  correnteModulo?: number;
  dimensionamentoPercentual?: number;
  vidaUtil?: number;
  degradacaoAnual?: number;
  orientacao?: number;
  inclinacao?: number;
  latitude?: number;
  longitude?: number;
  
  // Inversores
  inverters: Inverter[];
  totalInverterPower: number;
  inversorSelecionado?: string;
  potenciaInversor?: number;
  eficienciaInversor?: number;
  canaisMppt?: number;
  
  // Consumo energético
  energyBills: EnergyBill[];
  
  // Parâmetros tarifários
  grupoTarifario: 'A' | 'B';
  tarifaEnergiaB?: number;
  custoFioB?: number;
  tarifaEnergiaPontaA?: number;
  tarifaEnergiaForaPontaA?: number;
  demandaContratada?: number;
  tarifaDemanda?: number;

  // Dados da instalação
  concessionaria?: string;
  tipoRede?: 'monofasico' | 'bifasico' | 'trifasico';
  tensaoRede?: '127' | '220' | '380';
  fatorSimultaneidade?: number;
  tipoTelhado?: 'ceramico' | 'fibrocimento-madeira' | 'fibrocimento-metalica' | 'telha-metalica';
  
  // Custos e financeiro
  custoEquipamento: number;
  custoMateriais: number;
  custoMaoDeObra: number;
  bdi: number;
  taxaDesconto: number;
  inflacaoEnergia: number;
  
  // Condições de pagamento
  paymentMethod: 'vista' | 'cartao' | 'financiamento';
  cardInstallments?: number;
  cardInterest?: number;
  financingInstallments?: number;
  financingInterest?: number;
  
  // Dimensionamento de cabos
  cableSizing: CableSizing[];
  
  // Dados adicionais
  modelo3dUrl?: string;
  
  // Dados 3D
  mountingAreas?: MountingArea[];
  measurements?: Measurement[];
  
  createdAt?: string;
  updatedAt?: string;
}

interface DimensioningContextType {
  currentDimensioning: DimensioningData;
  isDimensioningLoaded: boolean;
  dimensioningId: string | null;
  
  // Actions
  loadDimensioning: (data: DimensioningData) => void;
  updateDimensioning: (updates: Partial<DimensioningData>) => void;
  clearDimensioning: () => void;
  saveDimensioning: () => Promise<void>;
  createNewDimensioning: (customerId: string, customerData: Customer) => void;
  
  // State
  isSaving: boolean;
}

const DimensioningContext = createContext<DimensioningContextType | undefined>(undefined);

const getInitialDimensioningData = (): DimensioningData => ({
  dimensioningName: '',
  irradiacaoMensal: Array(12).fill(4.5),
  potenciaModulo: 550,
  numeroModulos: 0,
  eficienciaSistema: 85, // deprecated
  // ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
  // aguasTelhado: [{
  //   id: 'agua_principal',
  //   nome: 'Água Principal',
  //   orientacao: 180, // Sul
  //   inclinacao: 23, // Ângulo ótimo para Brasil
  //   numeroModulos: 20,
  //   sombreamentoParcial: 0,
  //   areaDisponivel: 50
  // }],
  // Perdas padrão específicas
  perdaSombreamento: 3,
  perdaMismatch: 2,
  perdaCabeamento: 2,
  perdaSujeira: 5,
  perdaInversor: 3,
  perdaOutras: 0,
  
  // Dados adicionais do módulo
  moduloSelecionado: '',
  eficienciaModulo: 0,
  tensaoModulo: 0,
  correnteModulo: 0,
  dimensionamentoPercentual: 100,
  vidaUtil: 25,
  degradacaoAnual: 0.5,
  orientacao: 180, // Norte geográfico (padrão ótimo para Brasil)
  inclinacao: 23,  // Ângulo ótimo para latitude média do Brasil
  
  // Localização padrão (São Paulo) para habilitar PVLIB
  latitude: -23.5505,
  longitude: -46.6333,
  
  // Dados do inversor
  inversorSelecionado: '',
  potenciaInversor: 0,
  eficienciaInversor: 0,
  canaisMppt: 2,
  
  inverters: [{
    id: crypto.randomUUID(),
    selectedInverterId: '',
    quantity: 1
  }],
  totalInverterPower: 0,
  
  energyBills: [{
    id: crypto.randomUUID(),
    name: 'Conta Principal',
    consumoMensal: Array(12).fill(500)
  }],
  
  grupoTarifario: 'B',
  tarifaEnergiaB: 0.75,
  custoFioB: 0.30,

  // Dados da instalação - valores padrão
  concessionaria: '',
  tipoRede: 'monofasico',
  tensaoRede: '220',
  fatorSimultaneidade: 100,
  tipoTelhado: 'ceramico',
  
  custoEquipamento: 0,
  custoMateriais: 0,
  custoMaoDeObra: 0,
  bdi: 25,
  taxaDesconto: 8,
  inflacaoEnergia: 4.5,
  paymentMethod: 'vista',
  cardInstallments: 12,
  cardInterest: 1.99,
  financingInstallments: 60,
  financingInterest: 1.49,
  
  cableSizing: []
});

export function DimensioningProvider({ children }: { children: React.ReactNode }) {
  // Load data from localStorage on initialization
  const [currentDimensioning, setCurrentDimensioning] = useState<DimensioningData>(() => {
    // Verificar se deve continuar um dimensionamento existente
    const shouldContinue = sessionStorage.getItem('continueDimensioning');
    
    if (shouldContinue === 'true') {
      const saved = localStorage.getItem('currentDimensioning');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('📂 Carregando dimensionamento salvo do localStorage');
          return { ...getInitialDimensioningData(), ...parsed };
        } catch (e) {
          console.warn('Error parsing saved dimensioning data:', e);
        }
      }
    }
    
    console.log('✨ Iniciando novo dimensionamento limpo');
    return getInitialDimensioningData();
  });
  
  const [isDimensioningLoaded, setIsDimensioningLoaded] = useState(() => {
    // Só marcar como carregado se deve continuar um dimensionamento existente
    const shouldContinue = sessionStorage.getItem('continueDimensioning');
    
    if (shouldContinue === 'true') {
      const saved = localStorage.getItem('isDimensioningLoaded');
      return saved ? JSON.parse(saved) : false;
    }
    
    return false;
  });
  
  const [dimensioningId, setDimensioningId] = useState<string | null>(() => {
    // Só carregar ID se deve continuar um dimensionamento existente
    const shouldContinue = sessionStorage.getItem('continueDimensioning');
    
    if (shouldContinue === 'true') {
      const saved = localStorage.getItem('dimensioningId');
      return saved ? JSON.parse(saved) : null;
    }
    
    return null;
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save to localStorage whenever currentDimensioning changes
  useEffect(() => {
    localStorage.setItem('currentDimensioning', JSON.stringify(currentDimensioning));
  }, [currentDimensioning]);

  // Save loading state to localStorage
  useEffect(() => {
    localStorage.setItem('isDimensioningLoaded', JSON.stringify(isDimensioningLoaded));
  }, [isDimensioningLoaded]);

  // Save dimensioning ID to localStorage
  useEffect(() => {
    localStorage.setItem('dimensioningId', JSON.stringify(dimensioningId));
  }, [dimensioningId]);

  const loadDimensioning = useCallback((data: DimensioningData) => {
    // Ensure all fields are properly loaded, including equipment data
    const loadedData = {
      ...getInitialDimensioningData(), // Start with defaults
      ...data, // Override with loaded data
      // Ensure arrays are properly initialized
      irradiacaoMensal: data.irradiacaoMensal || Array(12).fill(4.5),
      inverters: data.inverters || [{
        id: crypto.randomUUID(),
        selectedInverterId: '',
        quantity: 1
      }],
      energyBills: data.energyBills || [{
        id: crypto.randomUUID(),
        name: 'Conta Principal',
        consumoMensal: Array(12).fill(500)
      }],
      // ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
      // aguasTelhado: data.aguasTelhado || [{
      //   id: 'agua_principal',
      //   nome: 'Água Principal',
      //   orientacao: 180,
      //   inclinacao: 23,
      //   numeroModulos: 20,
      //   sombreamentoParcial: 0,
      //   areaDisponivel: 50
      // }]
    };
    
    setCurrentDimensioning(loadedData);
    setDimensioningId(data.id || null);
    setIsDimensioningLoaded(true);
    
    // Mark that user explicitly loaded a dimensioning
    sessionStorage.setItem('continueDimensioning', 'true');
    
    console.log('📂 Dimensionamento carregado explicitamente:', data.dimensioningName);
    toast.success(`Dimensionamento "${data.dimensioningName}" carregado com sucesso.`);
  }, []);

  const updateDimensioning = useCallback((updates: Partial<DimensioningData>) => {
    setCurrentDimensioning(prev => ({ ...prev, ...updates }));
  }, []);

  const clearDimensioning = useCallback(() => {
    setCurrentDimensioning(getInitialDimensioningData());
    setDimensioningId(null);
    setIsDimensioningLoaded(false);
    
    // Clear all storage
    localStorage.removeItem('currentDimensioning');
    localStorage.removeItem('isDimensioningLoaded');
    localStorage.removeItem('dimensioningId');
    sessionStorage.removeItem('continueDimensioning');
    
    console.log('🧼 Dimensionamento limpo - valores padrão restaurados');
  }, []);

  const createNewDimensioning = useCallback((customerId: string, customerData: Customer) => {
    // Clear any previous session flags to ensure a fresh start
    sessionStorage.removeItem('continueDimensioning');
    localStorage.removeItem('currentDimensioning');
    localStorage.removeItem('isDimensioningLoaded');
    localStorage.removeItem('dimensioningId');
    
    const newDimensioning = {
      ...getInitialDimensioningData(),
      dimensioningName: `Dimensionamento ${new Date().toLocaleDateString()}`,
      customer: {
        id: customerId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        company: customerData.company,
        type: customerData.type
      }
    };
    
    setCurrentDimensioning(newDimensioning);
    setIsDimensioningLoaded(false); // Changed to false for new dimensioning
    
    console.log('✨ Novo dimensionamento criado para:', customerData.name);
    toast.success(`Novo dimensionamento criado para ${customerData.name}`);
  }, []);

  const saveDimensioning = useCallback(async () => {
    console.log('🔧 Iniciando salvamento do dimensionamento...', {
      dimensioningName: currentDimensioning.dimensioningName,
      customer: currentDimensioning.customer,
      dimensioningId
    });

    // Detectar ambiente automaticamente
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isDevelopment 
      ? 'http://localhost:8010/api/v1'
      : '/api/v1';

    if (!currentDimensioning.dimensioningName?.trim()) {
      toast.error("Nome obrigatório: Por favor, insira um nome para o dimensionamento.");
      return;
    }

    if (!currentDimensioning.customer) {
      toast.error("Cliente obrigatório: Por favor, selecione um cliente para o dimensionamento.");
      return;
    }

    // Validação removida: projeto não é mais obrigatório
    // O dimensionamento será salvo diretamente com o nome informado

    setIsSaving(true);
    console.log('💾 Definindo isSaving como true...');
    
    try {
      // Preparar dados para a API - agora usando o nome do dimensionamento como nome do projeto
      const projectData = {
        projectName: currentDimensioning.dimensioningName, // Usar sempre o nome do dimensionamento
        projectType: 'pv', // Corrigido: deve ser lowercase
        // Usar leadId obrigatório (já validado acima)
        leadId: currentDimensioning.customer?.id,
        address: currentDimensioning.endereco || currentDimensioning.cidade || currentDimensioning.estado || '',
        projectData: {
          ...currentDimensioning,
          dimensioningName: currentDimensioning.dimensioningName
        }
      };

      console.log('📋 Dados preparados para envio:', projectData);

      // Configurar headers com token de autenticação
      const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      let response: any;
      if (!dimensioningId) {
        // Criar novo dimensionamento (projeto)
        console.log('🚀 Enviando POST para criar novo dimensionamento...');
        response = await axios.post(`${baseUrl}/projects`, projectData, config);
        console.log('✅ Resposta recebida:', response.data);
        
        const projectId = response.data.data.id;
        setDimensioningId(projectId);
        setCurrentDimensioning(prev => ({
          ...prev,
          id: projectId,
          createdAt: response.data.data.createdAt,
          updatedAt: response.data.data.updatedAt
        }));
        
        toast.success("Dimensionamento salvo com sucesso!", {
          duration: 4000,
          position: 'top-right',
        });
      } else {
        // Atualizar dimensionamento existente
        response = await axios.put(`${baseUrl}/projects/${dimensioningId}`, projectData, config);
        
        setCurrentDimensioning(prev => ({
          ...prev,
          updatedAt: response.data.data.updatedAt
        }));
        
        toast.success("Dimensionamento atualizado com sucesso!", {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error: any) {
      console.error('Erro ao salvar dimensionamento:', error);
      
      let errorMessage = "Não foi possível salvar o dimensionamento.";
      
      if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Dados inválidos. Verifique os campos.";
      } else if (error.response?.status === 500) {
        errorMessage = "Erro interno do servidor. Tente novamente.";
      }
      
      toast.error(`Erro ao salvar: ${errorMessage}`, {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentDimensioning, dimensioningId]);

  const contextValue: DimensioningContextType = {
    currentDimensioning,
    isDimensioningLoaded,
    dimensioningId,
    
    loadDimensioning,
    updateDimensioning,
    clearDimensioning,
    saveDimensioning,
    createNewDimensioning,
    
    isSaving
  };

  return (
    <DimensioningContext.Provider value={contextValue}>
      {children}
    </DimensioningContext.Provider>
  );
}

export function useDimensioning() {
  const context = useContext(DimensioningContext);
  if (context === undefined) {
    throw new Error('useDimensioning deve ser usado dentro de um DimensioningProvider');
  }
  return context;
}