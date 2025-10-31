import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import { GetCompanyProfileUseCase } from '../../application/use-cases/company-profile/GetCompanyProfileUseCase';
import { AuthenticatedRequest } from '../../presentation/middleware/AuthMiddleware';

export class ProposalController {
  constructor(
    private readonly getCompanyProfileUseCase: GetCompanyProfileUseCase
  ) {}
  async generateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const teamId = req.user?.teamId;
      
      if (!userId || !teamId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Buscar CompanyProfile
      console.log(`Buscando CompanyProfile para teamId: ${teamId}`);
      
      try {
        const companyProfileResult = await this.getCompanyProfileUseCase.execute(teamId);
        
        if (companyProfileResult.isSuccess && companyProfileResult.value) {
          const profile = companyProfileResult.value;
          console.log(`CompanyProfile encontrado. Empresa: ${profile.companyName}`);
          
          // Construir dados da empresa APENAS com CompanyProfile
          const empresaData = {
            nome: profile.companyName || '',
            cnpj: profile.taxId || '',
            contato: `${profile.phone || ''} | ${profile.email || ''}`.trim() || '',
            missao: profile.mission || '',
            fundacao: profile.foundedYear || '',
            projetos_concluidos: profile.completedProjectsCount || '',
            potencia_total: profile.totalInstalledPower || '',
            clientes_satisfeitos: profile.satisfiedClientsCount || '',
            observacoes: profile.companyNotes || ''
          };

          // Adicionar logo URL se existir
          if (profile.logoUrl) {
            req.body.logoUrl = profile.logoUrl;
          }

          // Substituir dados da empresa
          req.body.empresa = empresaData;
          console.log('Dados da empresa enriquecidos com CompanyProfile');
          
        } else {
          console.log(`CompanyProfile não encontrado para teamId: ${teamId}`);
          res.status(400).json({
            message: 'Perfil da empresa não configurado. Configure o perfil antes de gerar propostas.',
            error: 'COMPANY_PROFILE_NOT_FOUND'
          });
          return;
        }
      } catch (error) {
        console.error(`Erro ao buscar CompanyProfile para teamId: ${teamId}`, error);
        res.status(400).json({
          message: 'Perfil da empresa não configurado. Configure o perfil antes de gerar propostas.',
          error: 'COMPANY_PROFILE_NOT_FOUND'
        });
        return;
      }

      // Adicionar metadados
      req.body.userId = userId;
      req.body.teamId = teamId;

      // Converter camelCase para snake_case
      const snakeCaseData = this.convertToSnakeCase(req.body);
      
      // Adicionar dados do usuário se necessário
      snakeCaseData.user_id = userId;
      
      // Chamar serviço Python
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      const response: AxiosResponse = await axios.post(
        `${pythonServiceUrl}/api/v1/proposal/generate`,
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
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      const pythonUrl = `${pythonServiceUrl}/api/v1/proposal/download/${filename}`;
      
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