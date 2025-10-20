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
   * LÓGICA SIMPLIFICADA: Usa apenas o campo grupoTarifario selecionado pelo usuário
   */
  static detectarGrupoTarifario(
    customerData: ICustomerData | null,
    energyData: IEnergyData | null
  ): DetectorResultado {
    // Lógica simplificada: usar apenas o campo grupoTarifario
    const grupoSelecionado = customerData?.grupoTarifario;
    
    console.log('[GrupoTarifarioDetector] Grupo selecionado:', grupoSelecionado);
    
    if (grupoSelecionado === 'A') {
      console.log('[GrupoTarifarioDetector] Renderizando Grupo A');
      return {
        renderizar: GrupoTarifarioRender.GRUPO_A,
        motivo: 'Grupo A selecionado explicitamente pelo usuário',
        dadosAValidos: true,
        dadosBValidos: false
      };
    }
    
    if (grupoSelecionado === 'B') {
      console.log('[GrupoTarifarioDetector] Renderizando Grupo B');
      return {
        renderizar: GrupoTarifarioRender.GRUPO_B,
        motivo: 'Grupo B selecionado explicitamente pelo usuário',
        dadosAValidos: false,
        dadosBValidos: true
      };
    }
    
    // Fallback para Grupo B se não houver seleção
    console.log('[GrupoTarifarioDetector] Nenhum grupo selecionado, usando Grupo B como padrão');
    return {
      renderizar: GrupoTarifarioRender.GRUPO_B,
      motivo: 'Nenhum grupo selecionado, usando Grupo B como padrão',
      dadosAValidos: false,
      dadosBValidos: true
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