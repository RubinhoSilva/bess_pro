import { Request, Response } from 'express';
import axios from 'axios';
import { BaseController } from './BaseController';

/**
 * Controller para geração de propostas PDF
 * Este controller atua como um adaptador entre o frontend (camelCase) e o serviço Python (snake_case)
 */
export class ProposalPDFController extends BaseController {
  private readonly pythonServiceURL: string;

  constructor() {
    super();
    // URL do serviço Python de geração de propostas
    this.pythonServiceURL = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
  }

  /**
   * Converte camelCase para snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Converte recursivamente as chaves de um objeto de camelCase para snake_case
   */
  private convertKeysToSnake(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertKeysToSnake(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = this.camelToSnake(key);
        acc[snakeKey] = this.convertKeysToSnake(obj[key]);
        return acc;
      }, {} as any);
    }
    
    return obj;
  }

  /**
   * Valida os dados da proposta antes de enviar para o serviço Python
   */
  private validateProposalData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!data.empresa || !data.empresa.nome) {
      errors.push('Nome da empresa é obrigatório');
    }

    if (!data.cliente || !data.cliente.nome) {
      errors.push('Nome do cliente é obrigatório');
    }

    if (!data.sistema || !data.sistema.potenciaPico) {
      errors.push('Potência do sistema é obrigatória');
    }

    if (!data.financeiro || !data.financeiro.valorTotal) {
      errors.push('Valor total do investimento é obrigatório');
    }

    if (data.valorInvestimento === undefined || data.valorInvestimento <= 0) {
      errors.push('Valor do investimento deve ser maior que zero');
    }

    if (data.economiaAnualBruta === undefined || data.economiaAnualBruta < 0) {
      errors.push('Economia anual bruta deve ser maior ou igual a zero');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gera uma proposta PDF através do serviço Python
   * Endpoint: POST /api/proposal/generate
   */
  public generateProposal = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Validação dos dados de entrada
      const validation = this.validateProposalData(req.body);
      if (!validation.valid) {
        return this.badRequest(res, `Dados inválidos: ${validation.errors.join(', ')}`);
      }

      // Converte camelCase para snake_case
      const snakeCaseData = this.convertKeysToSnake(req.body);

      // Configuração do request para o serviço Python
      const config = {
        timeout: 120000, // 2 minutos timeout
        headers: {
          'Content-Type': 'application/json'
        }
      };


      // Envia requisição para o serviço Python
      const response = await axios.post(`${this.pythonServiceURL}/api/v1/proposal/generate`, snakeCaseData, config);


      // Retorna a resposta do serviço Python adaptada para o formato esperado pelo frontend
      // O serviço Python retorna SuccessResponse[ProposalResponse] com estrutura aninhada
      const proposalData = response.data.data || response.data;
      
      
      // Constrói a URL completa para o frontend
      const protocol = req.protocol;
      const host = req.get('host');
      const filename = proposalData.pdf_filename;
      const pdfUrl = `${this.pythonServiceURL}${proposalData.pdf_url}`;
      
      
      return this.ok(res, {
        success: true,
        message: 'Proposta gerada com sucesso',
        pdfUrl: pdfUrl,
        pdfFilename: proposalData.pdf_filename,
        fileSize: proposalData.file_size_kb,
        // Incluindo campos adicionais que possam ser úteis
        generatedAt: proposalData.generated_at
      });

    } catch (error: any) {

      // Tratamento específico para diferentes tipos de erro
      if (error.code === 'ECONNABORTED') {
        return this.badRequest(res, 'Tempo esgotado ao gerar a proposta. Tente novamente.');
      } else if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço de geração de propostas está temporariamente indisponível.');
      } else if (error.response) {
        // Erro retornado pelo serviço Python
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Erro no serviço de geração';
        
        if (status === 400) {
          return this.badRequest(res, message);
        } else if (status === 500) {
          return this.internalServerError(res, message);
        } else {
          return res.status(status).json({
            success: false,
            error: {
              code: 'SERVICE_ERROR',
              message
            },
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Erro interno
        return this.internalServerError(res, 'Erro ao processar a requisição de geração de proposta.');
      }
    }
  };

  /**
   * Baixa um PDF de proposta gerada através do serviço Python
   * Endpoint: GET /api/proposal/download/:filename
   */
  public downloadPDF = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { filename } = req.params;

      // Validação do filename
      if (!filename) {
        return this.badRequest(res, 'Nome do arquivo é obrigatório');
      }

      // Validação de segurança para evitar path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return this.badRequest(res, 'Nome de arquivo inválido');
      }


      // Configuração do request para o serviço Python
      const config = {
        timeout: 30000, // 30 segundos timeout para download
        responseType: 'stream' as const, // Importante para streaming de arquivos
        headers: {
          'Content-Type': 'application/json'
        }
      };


      // Envia requisição para o serviço Python
      const response = await axios.get(
        `${this.pythonServiceURL}/api/v1/proposal/download/${filename}`,
        config
      );


      // Configura headers da resposta
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }

      // Faz streaming do arquivo para o cliente
      response.data.pipe(res);

      // Retorna uma promise que resolve quando o stream terminar
      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve(res);
        });

        response.data.on('error', (error: any) => {
          reject(error);
        });
      });

    } catch (error: any) {

      // Tratamento específico para diferentes tipos de erro
      if (error.code === 'ECONNABORTED') {
        return this.badRequest(res, 'Tempo esgotado ao baixar o arquivo. Tente novamente.');
      } else if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço de download está temporariamente indisponível.');
      } else if (error.response) {
        // Erro retornado pelo serviço Python
        const status = error.response.status;
        const message = error.response.data?.detail || error.response.data?.message || 'Erro no serviço de download';
        
        if (status === 404) {
          return this.notFound(res, 'Arquivo não encontrado ou expirado');
        } else if (status === 400) {
          return this.badRequest(res, message);
        } else if (status === 500) {
          return this.internalServerError(res, message);
        } else {
          return res.status(status).json({
            success: false,
            error: {
              code: 'SERVICE_ERROR',
              message
            },
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Erro interno
        return this.internalServerError(res, 'Erro ao processar a requisição de download.');
      }
    }
  };
}