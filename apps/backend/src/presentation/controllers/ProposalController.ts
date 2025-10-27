import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export class ProposalController {
  async generateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Converter camelCase para snake_case
      const snakeCaseData = this.convertToSnakeCase(req.body);
      
      // Adicionar dados do usuário se necessário
      snakeCaseData.user_id = userId;
      
      // Chamar serviço Python
      const response: AxiosResponse = await axios.post(
        `${process.env.PYTHON_SERVICE_URL}/api/v1/proposal/generate`,
        snakeCaseData
      );

      // Converter resposta para camelCase
      const camelCaseResponse = this.convertToCamelCase(response.data);
      
      res.json(camelCaseResponse);
    } catch (error: any) {
      console.error('Erro ao gerar proposta:', error);
      res.status(500).json({ 
        message: 'Erro ao gerar proposta',
        error: error.message 
      });
    }
  }

  async downloadProposal(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      
      // Redirecionar para o serviço Python
      const pythonUrl = `${process.env.PYTHON_SERVICE_URL}/api/v1/proposal/download/${filename}`;
      
      // Fazer proxy do download
      const response = await axios.get(pythonUrl, {
        responseType: 'stream'
      });

      // Configurar headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Enviar stream
      response.data.pipe(res);
    } catch (error: any) {
      console.error('Erro ao baixar proposta:', error);
      res.status(500).json({ 
        message: 'Erro ao baixar proposta',
        error: error.message 
      });
    }
  }

  private convertToSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertToSnakeCase(item));
    }
    
    const snakeCaseObj: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        snakeCaseObj[snakeKey] = this.convertToSnakeCase(obj[key]);
      }
    }
    
    return snakeCaseObj;
  }

  private convertToCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertToCamelCase(item));
    }
    
    const camelCaseObj: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        camelCaseObj[camelKey] = this.convertToCamelCase(obj[key]);
      }
    }
    
    return camelCaseObj;
  }
}