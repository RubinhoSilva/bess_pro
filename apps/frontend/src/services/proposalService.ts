import api from '../lib/api';
import { ErrorHandler } from '../errors/ErrorHandler';

// Interface para os dados da proposta
export interface EmpresaData {
  nome: string;
  cnpj: string;
  contato: string;
  missao?: string;
  fundacao?: string;
  projetosConcluidos?: string;
  potenciaTotal?: string;
  clientesSatisfeitos?: string;
  observacoes?: string;
}

export interface ClienteData {
  nome: string;
  endereco: string;
  consumoMensal: string;
  tarifaMedia: string;
}

export interface SistemaData {
  potenciaPico: string;
  modulos: string;
  inversor: string;
  geracaoEstimada: string;
  garantiaModulos: string;
}

export interface FinanceiroData {
  valorTotal: string;
  entrada: string;
  parcelas: string;
  validade: string;
  economiaAnual: string;
}

export interface PerformanceData {
  inversorMppt: string;
  kwp: string;
  geracaoAnual: string;
  yieldEspecifico: string;
  pr: string;
}

export interface MensalData {
  mes: string;
  consumo: number;
  geracao: number;
  diferenca: number;
}

export interface MetricasFinanceirasData {
  vpl: string;
  tir: string;
  indiceLucratividade: string;
  paybackSimples: string;
  paybackDescontado: string;
  lcoe: string;
  roiSimples: string;
  economiaTotalNominal: string;
  economiaTotalPresente: string;
}

export interface FluxoCaixaData {
  ano: number;
  fcNominal: number;
  fcAcumNominal: number;
  fcDescontado: number;
  fcAcumDescontado: number;
}

export interface ProposalRequest {
  empresa: EmpresaData;
  cliente: ClienteData;
  sistema: SistemaData;
  financeiro: FinanceiroData;
  dadosTecnicosResumo?: Record<string, string>;
  dadosTecnicosPerformance?: PerformanceData[];
  dadosTecnicosMensal?: MensalData[];
  valorInvestimento: number;
  economiaAnualBruta: number;
  metricasFinanceiras: MetricasFinanceirasData;
  dadosFluxoCaixa?: FluxoCaixaData[];
  logoUrl?: string;
  nomeArquivo?: string;
}

export interface ProposalResponse {
  success: boolean;
  data: {
    success: boolean;
    message: string;
    pdfUrl?: string;
    pdfBase64?: string;
    pdfFilename?: string;
    fileSize?: number;
    generatedAt?: string;
    error?: string;
  };
  timestamp: string;
}

export class ProposalService {
  private static instance: ProposalService;
  private readonly baseUrl = '/proposal';
  private readonly defaultTimeout = 60000;
  private readonly maxRetries = 3;

  private constructor() {}

  static getInstance(): ProposalService {
    if (!ProposalService.instance) {
      ProposalService.instance = new ProposalService();
    }
    return ProposalService.instance;
  }

  // Error handling - centralized error processing
  private handleError(error: unknown, operation: string): never {
    const appError = ErrorHandler.handle(error, `ProposalService.${operation}`);
    throw appError;
  }

  /**
   * Gera uma proposta PDF
   * @param data Dados da proposta
   * @param timeout Timeout personalizado (opcional)
   * @param retries Número de tentativas (opcional)
   */
  async generateProposal(
    data: ProposalRequest,
    timeout: number = this.defaultTimeout,
    retries: number = this.maxRetries
  ): Promise<ProposalResponse> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await api.post<ProposalResponse>(
          `${this.baseUrl}/generate`,
          data,
          {
            timeout,
          }
        );
        
        if (response.data.success) {
          return response.data;
        } else {
          throw new Error(response.data.data?.error || 'Erro ao gerar proposta');
        }
      } catch (error: any) {
        lastError = error;
        
        // Se não for a última tentativa, aguarda antes de tentar novamente
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, máximo 5s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Todas as tentativas falharam
    if (lastError?.code === 'ECONNABORTED') {
      throw new Error('Tempo esgotado ao gerar a proposta. Tente novamente.');
    } else if (lastError?.response?.status === 500) {
      throw new Error('Erro interno do servidor. Tente novamente em alguns minutos.');
    } else if (lastError?.response?.status === 400) {
      throw new Error('Dados inválidos. Verifique as informações e tente novamente.');
    } else {
      throw new Error(lastError?.message || 'Erro ao gerar proposta. Tente novamente.');
    }
  }

  /**
   * Faz o download do PDF a partir de uma URL
   * @param url URL do PDF
   * @param filename Nome do arquivo
   */
  async downloadPDF(url: string, filename: string): Promise<void> {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
        timeout: 30000,
      });

      // Cria um link temporário para download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      this.handleError(error, 'downloadPDF');
    }
  }

  /**
   * Abre o PDF em uma nova aba
   * @param url URL do PDF
   */
  openPDFInNewTab(url: string): void {
    window.open(url, '_blank');
  }

  /**
   * Converte base64 para blob e faz download
   * @param base64Data Base64 do PDF
   * @param filename Nome do arquivo
   */
  downloadBase64PDF(base64Data: string, filename: string): void {
    try {
      // Remove o prefixo data:application/pdf;base64, se existir
      const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
      
      // Converte base64 para blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Cria link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      this.handleError(error, 'downloadBase64PDF');
    }
  }

  /**
   * Converte base64 para blob e abre em nova aba
   * @param base64Data Base64 do PDF
   */
  openBase64PDFInNewTab(base64Data: string): void {
    try {
      // Remove o prefixo data:application/pdf;base64, se existir
      const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
      
      // Converte base64 para blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Abre em nova aba
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Limpa após um tempo
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      this.handleError(error, 'openBase64PDFInNewTab');
    }
  }
}

// Export singleton instance
export const proposalService = ProposalService.getInstance();

export default proposalService;
