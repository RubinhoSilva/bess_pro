import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

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
  latitude?: number;
  longitude?: number;
  irradiacaoMensal: number[];
  
  // Sistema fotovoltaico
  potenciaModulo: number;
  numeroModulos: number;
  eficienciaSistema: number;
  selectedModuleId?: string;
  
  // Inversores
  inverters: Inverter[];
  totalInverterPower: number;
  
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
  
  // Custos e financeiro
  custoEquipamento: number;
  custoMateriais: number;
  custoMaoDeObra: number;
  bdi: number;
  taxaDesconto: number;
  inflacaoEnergia: number;
  vidaUtil: number;
  
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
  googleSolarData?: any;
  
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
  eficienciaSistema: 85,
  
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
  
  custoEquipamento: 0,
  custoMateriais: 0,
  custoMaoDeObra: 0,
  bdi: 25,
  taxaDesconto: 8,
  inflacaoEnergia: 4.5,
  vidaUtil: 25,
  
  paymentMethod: 'vista',
  cardInstallments: 12,
  cardInterest: 1.99,
  financingInstallments: 60,
  financingInterest: 1.49,
  
  cableSizing: []
});

export function DimensioningProvider({ children }: { children: React.ReactNode }) {
  const [currentDimensioning, setCurrentDimensioning] = useState<DimensioningData>(getInitialDimensioningData());
  const [isDimensioningLoaded, setIsDimensioningLoaded] = useState(false);
  const [dimensioningId, setDimensioningId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  const loadDimensioning = useCallback((data: DimensioningData) => {
    setCurrentDimensioning(data);
    setDimensioningId(data.id || null);
    setIsDimensioningLoaded(true);
    
    toast({
      title: "Dimensionamento carregado",
      description: `"${data.dimensioningName}" carregado com sucesso.`,
    });
  }, [toast]);

  const updateDimensioning = useCallback((updates: Partial<DimensioningData>) => {
    setCurrentDimensioning(prev => ({ ...prev, ...updates }));
  }, []);

  const clearDimensioning = useCallback(() => {
    setCurrentDimensioning(getInitialDimensioningData());
    setDimensioningId(null);
    setIsDimensioningLoaded(false);
  }, []);

  const createNewDimensioning = useCallback((customerId: string, customerData: Customer) => {
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
    setIsDimensioningLoaded(true);
    
    toast({
      title: "Novo dimensionamento criado",
      description: `Dimensionamento criado para ${customerData.name}`,
    });
  }, [toast]);

  const saveDimensioning = useCallback(async () => {
    console.log('🔧 Iniciando salvamento do dimensionamento...', {
      dimensioningName: currentDimensioning.dimensioningName,
      customer: currentDimensioning.customer,
      dimensioningId
    });

    if (!currentDimensioning.dimensioningName?.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o dimensionamento.",
      });
      return;
    }

    if (!currentDimensioning.customer) {
      toast({
        variant: "destructive", 
        title: "Cliente obrigatório",
        description: "Por favor, selecione um cliente para o dimensionamento.",
      });
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
        response = await axios.post('http://localhost:8010/api/v1/projects', projectData, config);
        console.log('✅ Resposta recebida:', response.data);
        
        const projectId = response.data.data.id;
        setDimensioningId(projectId);
        setCurrentDimensioning(prev => ({
          ...prev,
          id: projectId,
          createdAt: response.data.data.createdAt,
          updatedAt: response.data.data.updatedAt
        }));
        
        toast({
          title: "Dimensionamento salvo",
          description: "Dimensionamento criado com sucesso!",
        });
      } else {
        // Atualizar dimensionamento existente
        response = await axios.put(`http://localhost:8010/api/v1/projects/${dimensioningId}`, projectData, config);
        
        setCurrentDimensioning(prev => ({
          ...prev,
          updatedAt: response.data.data.updatedAt
        }));
        
        toast({
          title: "Dimensionamento atualizado", 
          description: "Alterações salvas com sucesso!",
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
      
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentDimensioning, dimensioningId, toast]);

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