import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import type { ProjectData } from '@/types/project';

export interface DimensioningData {
  dimensioningName: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
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
  potenciaModulo?: number;
  numeroModulos?: number | null;
  eficienciaSistema?: number;
  selectedModuleId?: string;
  inverters?: Array<{
    id: string;
    selectedInverterId: string;
    quantity: number;
  }>;
  totalInverterPower?: number;
  grupoTarifario?: 'A' | 'B';
  tarifaEnergiaB?: number;
  custoFioB?: number;
  tarifaEnergiaPontaA?: number;
  tarifaEnergiaForaPontaA?: number;
  demandaContratada?: number;
  tarifaDemanda?: number;
  custoEquipamento?: number;
  custoMateriais?: number;
  custoMaoDeObra?: number;
  bdi?: number;
  taxaDesconto?: number;
  inflacaoEnergia?: number;
  vidaUtil?: number;
  paymentMethod?: 'vista' | 'cartao' | 'financiamento';
  cardInstallments?: number;
  cardInterest?: number;
  financingInstallments?: number;
  financingInterest?: number;
  cableSizing?: any[];
  modelo3dUrl?: string;
  irradiacaoMensal?: number[];
  inclinacao?: number;
  azimute?: number;
  considerarSombreamento?: boolean;
  sombreamento?: number[];
  perdaSujeira?: number;
  degradacaoModulos?: number;
  selectedModules?: Array<{ module: any; quantity: number }>;
  selectedInverters?: Array<{ inverter: any; quantity: number }>;
}

/**
 * Hook para salvar/atualizar dimensionamento
 * Se dimensioningId existe, faz PUT (update)
 * Se não existe, faz POST (create)
 */
export function useSaveDimensioning(dimensioningId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: DimensioningData) => {
      // Validar dados básicos
      if (!data.dimensioningName?.trim()) {
        throw new Error('Nome do dimensionamento é obrigatório');
      }

      if (!data.customer) {
        throw new Error('Cliente é obrigatório');
      }

      // Chamar API
      const endpoint = dimensioningId
        ? `/projects/${dimensioningId}`
        : '/projects';

      const payload = {
        projectName: data.dimensioningName,
        projectType: 'pv',
        leadId: data.customer.id,
        projectData: data
      };

      if (dimensioningId) {
        return api.put(endpoint, payload);
      }
      return api.post(endpoint, payload);
    },
    onSuccess: (response, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['dimensionings'] });
      queryClient.invalidateQueries({ queryKey: ['dimensioning', response.data.data.id] });

      // Feedback
      toast({
        title: dimensioningId ? 'Atualizado' : 'Salvo',
        description: dimensioningId
          ? 'Dimensionamento atualizado com sucesso'
          : 'Dimensionamento salvo com sucesso',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Erro ao salvar dimensionamento';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      });
    }
  });
}