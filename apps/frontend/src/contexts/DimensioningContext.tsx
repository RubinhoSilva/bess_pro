import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { calculateSystemEfficiency, SystemLosses } from '@/lib/pvDimensioning';

export interface AguaTelhado {
  id: string;
  nome: string;
  orientacao: number; // 0-360° (0=Norte, 90=Leste, 180=Sul, 270=Oeste)
  inclinacao: number; // 0-90° (0=Horizontal, 90=Vertical)
  numeroModulos: number;
  areaDisponivel: number; // m²
  sombreamentoParcial: number; // %
  // Associação com MPPT específico (legado - para compatibilidade)
  inversorId?: string; // Qual inversor será usado nesta água
  mpptNumero?: number; // Qual MPPT deste inversor (1, 2, 3, 4...)
  // NOVO: Dados do inversor embutidos (novo formato)
  inversor?: {
    fabricante: string;
    modelo: string;
    potencia_saida_ca_w: number;
    tipo_rede?: string;
    potencia_fv_max_w?: number;
    tensao_cc_max_v?: number;
    numero_mppt?: number;
    strings_por_mppt?: number;
    eficiencia_max?: number;
  };
  // Dados calculados
  isCalculando?: boolean;
  geracaoAnual?: number;
  areaCalculada?: number;
}

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

export interface SelectedInverter {
  id: string; // ID único para esta seleção
  inverterId: string; // ID do inversor do equipamento
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  potenciaFvMax?: number;
  numeroMppt: number;
  stringsPorMppt: number;
  tensaoCcMax: number;
  quantity: number; // Quantidade deste inversor
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
  fonteDados?: 'pvgis' | 'nasa'; // Fonte de dados meteorológicos (PVGIS ou NASA)
  pvgisResponseData?: any; // Dados completos da resposta PVGIS para restauração
  
  // Sistema fotovoltaico
  potenciaModulo: number;
  numeroModulos: number; // calculado automaticamente (deprecated, use numeroModulosCalculado)
  numeroModulosUsuario?: number; // definido pelo usuário
  isModuleCountManual?: boolean; // flag indicando se o número foi definido manualmente
  numeroModulosCalculado?: number; // resultado do cálculo automático
  eficienciaSistema: number; // deprecated, use systemLosses
  // Múltiplas águas de telhado
  aguasTelhado: AguaTelhado[];
  // Perdas específicas do sistema
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaOutras?: number;
  selectedModuleId?: string;
  moduloSelecionado?: string;
  fabricanteModulo?: string;
  fabricanteModuloNome?: string;
  modeloModulo?: string;
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
  
  // Inversores - Sistema Multi-Inversor
  selectedInverters: SelectedInverter[];
  totalInverterPower: number;
  totalMpptChannels: number; // Total de canais MPPT disponíveis
  
  // Campos legados (manter compatibilidade)
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
  forceCleanStart: () => void; // Nova função para forçar limpeza completa
  
  // State
  isSaving: boolean;
}

const DimensioningContext = createContext<DimensioningContextType | undefined>(undefined);

const getInitialDimensioningData = (): DimensioningData => ({
  dimensioningName: '',
  irradiacaoMensal: [], // deve ser preenchido via PVGIS
  potenciaModulo: 550,
  numeroModulos: 0,
  eficienciaSistema: 85, // deprecated
  // Águas de telhado com configuração padrão
  aguasTelhado: [{
    id: 'agua_principal',
    nome: 'Orientação #1',
    orientacao: 0,
    inclinacao: 0,
    numeroModulos: 0,
    areaDisponivel: 50,
    sombreamentoParcial: 0
  }],
  // Perdas padrão específicas
  perdaSombreamento: 3,
  perdaMismatch: 2,
  perdaCabeamento: 2,
  perdaSujeira: 5,
  perdaInversor: 3,
  perdaOutras: 0,
  
  // Dados adicionais do módulo
  moduloSelecionado: '',
  fabricanteModulo: '',
  fabricanteModuloNome: '',
  modeloModulo: '',
  eficienciaModulo: 0,
  tensaoModulo: 0,
  correnteModulo: 0,
  dimensionamentoPercentual: 100,
  vidaUtil: 25,
  degradacaoAnual: 0.5,
  orientacao: 0, // Horizontal (0° orientação - padrão PVGIS)
  inclinacao: 0,  // Horizontal (0° inclinação - padrão PVGIS)
  
  // Localização - deve ser definida pelo usuário (sem padrão)
  latitude: undefined,
  longitude: undefined,
  
  // Sistema Multi-Inversor
  selectedInverters: [],
  totalInverterPower: 0,
  totalMpptChannels: 0,
  
  // Dados do inversor (legado)
  inversorSelecionado: '',
  potenciaInversor: 0,
  eficienciaInversor: 0,
  canaisMppt: 2,
  
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
    const savedData = localStorage.getItem('currentDimensioning');
    
    console.log('🔍 [INIT] Estado inicial do storage:', {
      shouldContinue,
      hasSavedData: !!savedData,
      url: window.location.href
    });
    
    if (shouldContinue === 'true' && savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('📂 [INIT] Carregando dimensionamento salvo:', {
          hasLatLng: !!(parsed.latitude && parsed.longitude),
          hasIrradiation: parsed.irradiacaoMensal?.length > 0,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          irradiationLength: parsed.irradiacaoMensal?.length
        });
        return { ...getInitialDimensioningData(), ...parsed };
      } catch (e) {
        console.warn('Error parsing saved dimensioning data:', e);
      }
    }
    
    console.log('✨ [INIT] Iniciando novo dimensionamento limpo');
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
      irradiacaoMensal: data.irradiacaoMensal || [],
      selectedInverters: data.selectedInverters || [],
      totalInverterPower: data.totalInverterPower || 0,
      totalMpptChannels: data.totalMpptChannels || 0,
      energyBills: data.energyBills || [{
        id: crypto.randomUUID(),
        name: 'Conta Principal',
        consumoMensal: Array(12).fill(500)
      }],
      aguasTelhado: data.aguasTelhado || [{
        id: 'agua_principal',
        nome: 'Orientação #1',
        orientacao: 180,
        inclinacao: 23,
        numeroModulos: 20,
        sombreamentoParcial: 0,
        areaDisponivel: 50
      }],
      // Ensure module fields are properly loaded
      fabricanteModulo: data.fabricanteModulo || '',
      fabricanteModuloNome: data.fabricanteModuloNome || '',
      modeloModulo: data.modeloModulo || '',
      eficienciaModulo: data.eficienciaModulo || 0,
      tensaoModulo: data.tensaoModulo || 0,
      correnteModulo: data.correnteModulo || 0
    };
    
    setCurrentDimensioning(loadedData);
    setDimensioningId(data.id || null);
    setIsDimensioningLoaded(true);
    
    // Mark that user explicitly loaded a dimensioning
    sessionStorage.setItem('continueDimensioning', 'true');
    
    console.log('📂 Dimensionamento carregado explicitamente:', data.dimensioningName);
    console.log('🔍 [loadDimensioning] Dados do módulo carregados:', {
      fabricanteModulo: loadedData.fabricanteModulo,
      moduloSelecionado: loadedData.moduloSelecionado,
      fabricanteModuloNome: loadedData.fabricanteModuloNome,
      modeloModulo: loadedData.modeloModulo
    });
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
      } else if (error.response?.status === 429) {
        errorMessage = "Muitas requisições. Aguarde um momento e tente novamente.";
      } else if (error.response?.status === 500) {
        errorMessage = "Erro interno do servidor. Tente novamente.";
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      
      toast.error(`Erro ao salvar: ${errorMessage}`, {
        duration: 5000,
        position: 'top-right',
      });
      
      // Re-lançar o erro para que o wizard possa capturar e bloquear navegação
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [currentDimensioning, dimensioningId]);

  // Função para forçar limpeza completa - útil para debug e reset
  const forceCleanStart = useCallback(() => {
    console.log('🧹 [FORCE CLEAN] Forçando limpeza completa de todos os dados...');
    
    // Limpar todos os storages
    sessionStorage.removeItem('continueDimensioning');
    localStorage.removeItem('currentDimensioning');
    localStorage.removeItem('isDimensioningLoaded');
    localStorage.removeItem('dimensioningId');
    
    // Resetar state para dados iniciais limpos
    const cleanData = getInitialDimensioningData();
    setCurrentDimensioning(cleanData);
    setIsDimensioningLoaded(false);
    setDimensioningId(null);
    
    console.log('✨ [FORCE CLEAN] Limpeza completa realizada - estado zerado');
  }, []);

  const contextValue: DimensioningContextType = {
    currentDimensioning,
    isDimensioningLoaded,
    dimensioningId,
    
    loadDimensioning,
    updateDimensioning,
    clearDimensioning,
    saveDimensioning,
    createNewDimensioning,
    forceCleanStart,
    
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