import axios from 'axios';

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

// Configuração da API
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api/v1'
  : 'http://localhost:8010/api/v1';

// Timeout padrão de 60 segundos para geração de PDF
const DEFAULT_TIMEOUT = 60000;

// Número máximo de tentativas
const MAX_RETRIES = 3;

// Serviço de geração de propostas
export const proposalService = {
  /**
   * Gera uma proposta PDF
   * @param data Dados da proposta
   * @param timeout Timeout personalizado (opcional)
   * @param retries Número de tentativas (opcional)
   */
  async generateProposal(
    data: ProposalRequest, 
    timeout: number = DEFAULT_TIMEOUT,
    retries: number = MAX_RETRIES
  ): Promise<ProposalResponse> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        
        const response = await axios.post<ProposalResponse>(
          `${API_BASE_URL}/proposal/generate`,
          data,
          {
            timeout,
            headers: {
              'Content-Type': 'application/json',
            },
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
  },

  /**
   * Faz o download do PDF a partir de uma URL
   * @param url URL do PDF
   * @param filename Nome do arquivo
   */
  async downloadPDF(url: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(url, {
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
      throw new Error('Erro ao baixar o PDF. Tente novamente.');
    }
  },

  /**
   * Abre o PDF em uma nova aba
   * @param url URL do PDF
   */
  openPDFInNewTab(url: string): void {
    window.open(url, '_blank');
  },

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
      throw new Error('Erro ao processar o PDF. Tente novamente.');
    }
  },

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
      throw new Error('Erro ao processar o PDF. Tente novamente.');
    }
  }
};

export default proposalService;