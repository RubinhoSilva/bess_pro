import { ICustomerData, IEnergyData } from '@/store/pv-dimensioning-store';

export enum GrupoTarifarioRender {
  GRUPO_A = 'grupo_a',
  GRUPO_B = 'grupo_b',
  AMBOS = 'ambos',
  NENHUM = 'nenhum'
}

export interface DetectorResultado {
  renderizar: GrupoTarifarioRender;
  motivo: string;
  dadosAValidos: boolean;
  dadosBValidos: boolean;
}

export class GrupoTarifarioDetector {
  /**
   * Analisa os dados disponíveis e determina qual grupo tarifário renderizar
   * LÓGICA ATUALIZADA: Renderiza apenas o grupo selecionado na primeira etapa
   */
  static detectarGrupoTarifario(
    customerData: ICustomerData | null,
    energyData: IEnergyData | null
  ): DetectorResultado {
    const grupoSelecionado = customerData?.grupoTarifario;
    const hasContasA = energyData?.energyBillsA && energyData.energyBillsA.length > 0;
    const hasContasB = energyData?.energyBills && energyData.energyBills.length > 0;
    
    
    // Renderiza apenas o grupo selecionado na primeira etapa, ignorando contas adicionais
    if (grupoSelecionado === 'A') {
      return {
        renderizar: GrupoTarifarioRender.GRUPO_A,
        motivo: 'Grupo A selecionado na primeira etapa',
        dadosAValidos: !!hasContasA,
        dadosBValidos: false
      };
    }
    
    if (grupoSelecionado === 'B') {
      return {
        renderizar: GrupoTarifarioRender.GRUPO_B,
        motivo: 'Grupo B selecionado na primeira etapa',
        dadosAValidos: false,
        dadosBValidos: !!hasContasB
      };
    }
    
    // Fallback para Grupo B se não houver seleção
    return {
      renderizar: GrupoTarifarioRender.GRUPO_B,
      motivo: 'Nenhum grupo selecionado, usando Grupo B como padrão',
      dadosAValidos: false,
      dadosBValidos: !!hasContasB
    };
  }
  
  
  /**
   * Obtém o título da seção baseado no grupo tarifário
   */
  static getTituloSeção(grupo: GrupoTarifarioRender): string {
    // Simplificado para apenas "Resultados Financeiros" conforme solicitado
    return 'Resultados Financeiros';
  }
  
  /**
   * Obtém mensagem informativa baseada no resultado
   */
  static getMensagemInformativa(resultado: DetectorResultado): string | null {
    // Removendo mensagens informativas conforme solicitado
    return null;
  }
}