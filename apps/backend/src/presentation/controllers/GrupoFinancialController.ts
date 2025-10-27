import { Request, Response } from 'express';
import { SimplePvlibServiceClient } from '@/infrastructure/external-apis/SimplePvlibServiceClient';
import { BaseController } from './BaseController';
import { GrupoBConfig, GrupoAConfig } from '@bess-pro/shared';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class GrupoFinancialController extends BaseController {
  private pvlibClient: SimplePvlibServiceClient;

  constructor() {
    super();
    // Usar a URL do serviço Python configurada no ambiente
    const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
    this.pvlibClient = new SimplePvlibServiceClient(pythonServiceUrl);
  }

  /**
   * POST /api/v1/financial/calculate-grupo-b
   * Calcula análise financeira especializada para Grupo B
   */
  async calculateGrupoBFinancials(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {

      // Validar entrada básica
      if (!req.body || Object.keys(req.body).length === 0) {
        return this.badRequest(res, 'Dados de entrada são obrigatórios para o cálculo financeiro do Grupo B');
      }

      // Extrair dados do request
      const financialInput: GrupoBConfig = req.body;

      // Validação básica da estrutura GrupoBConfig
      if (!financialInput.geracao || typeof financialInput.geracao !== 'object') {
        return this.badRequest(res, 'Campo "geracao" é obrigatório e deve conter dados mensais');
      }

      if (!financialInput.consumoLocal || typeof financialInput.consumoLocal !== 'object') {
        return this.badRequest(res, 'Campo "consumoLocal" é obrigatório e deve conter dados mensais');
      }

      if (!financialInput.financeiros || typeof financialInput.financeiros !== 'object') {
        return this.badRequest(res, 'Campo "financeiros" é obrigatório');
      }

      if (typeof financialInput.tarifaBase !== 'number' || financialInput.tarifaBase <= 0) {
        return this.badRequest(res, 'Campo "tarifaBase" é obrigatório e deve ser maior que zero');
      }

      // Validações adicionais para prevenir erros de Object.values(undefined)
      if (!financialInput.geracao || Object.keys(financialInput.geracao).length === 0) {
        return this.badRequest(res, 'Campo "geracao" não pode estar vazio');
      }

      if (!financialInput.consumoLocal || Object.keys(financialInput.consumoLocal).length === 0) {
        return this.badRequest(res, 'Campo "consumoLocal" não pode estar vazio');
      }

      // Executar cálculo no serviço Python
      const result = await this.pvlibClient.calculateGrupoBFinancials(financialInput);

      // Retornar resultado
      return this.ok(res, {
        success: true,
        data: result,
        message: 'Cálculo financeiro do Grupo B realizado com sucesso',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {

      // Tratamento específico de erros
      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      if (error.message.includes('Dados inválidos')) {
        return this.badRequest(res, error.message);
      }

      if (error.message.includes('Endpoint não encontrado')) {
        return this.notFound(res, 'Endpoint de cálculo do Grupo B não está disponível');
      }

      if (error.message.includes('Timeout') || error.message.includes('demorou mais')) {
        return res.status(408).json({
          success: false,
          message: 'O cálculo financeiro demorou mais que o esperado. Tente novamente.',
          error: error.message
        });
      }

      if (error.message.includes('Serviço indisponível') || error.message.includes('ECONNREFUSED')) {
        return res.status(503).json({
          success: false,
          message: 'Serviço de cálculo financeiro temporariamente indisponível',
          error: error.message
        });
      }

      // Erro genérico
      return this.internalServerError(res, `Erro no cálculo financeiro do Grupo B: ${error.message}`);
    }
  }

  /**
   * POST /api/v1/financial/calculate-grupo-a
   * Calcula análise financeira especializada para Grupo A
   */
  async calculateGrupoAFinancials(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {

      // Validar entrada básica
      if (!req.body || Object.keys(req.body).length === 0) {
        return this.badRequest(res, 'Dados de entrada são obrigatórios para o cálculo financeiro do Grupo A');
      }

      // Extrair dados do request
      const financialInput: GrupoAConfig = req.body;

      // Validações adicionais para prevenir erros de Object.values(undefined)
      if (!financialInput.geracao || Object.keys(financialInput.geracao).length === 0) {
        return this.badRequest(res, 'Campo "geracao" não pode estar vazio');
      }

      if (!financialInput.consumoLocal || typeof financialInput.consumoLocal !== 'object') {
        return this.badRequest(res, 'Campo "consumoLocal" é obrigatório e deve ser um objeto');
      }

      if (!financialInput.consumoLocal.foraPonta || !financialInput.consumoLocal.ponta) {
        return this.badRequest(res, 'Campo "consumoLocal" deve conter "foraPonta" e "ponta"');
      }

      // Log resumido dos dados recebidos
      const geracaoAnual = Object.values(financialInput.geracao || {}).reduce((a: number, b: number) => a + b, 0);
      const consumoForaPonta = Object.values(financialInput.consumoLocal?.foraPonta || {}).reduce((a: number, b: number) => a + b, 0);
      const consumoPonta = Object.values(financialInput.consumoLocal?.ponta || {}).reduce((a: number, b: number) => a + b, 0);
      const consumoTotal = consumoForaPonta + consumoPonta;
      

      // Executar cálculo no serviço Python
      const result = await this.pvlibClient.calculateGrupoAFinancials(financialInput);


      // Retornar resultado
      return this.ok(res, {
        success: true,
        data: result,
        message: 'Cálculo financeiro do Grupo A realizado com sucesso',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {

      // Tratamento específico de erros
      if (error.message.includes('não autenticado')) {
        return this.unauthorized(res, error.message);
      }

      if (error.message.includes('Dados inválidos')) {
        return this.badRequest(res, error.message);
      }

      if (error.message.includes('Endpoint não encontrado')) {
        return this.notFound(res, 'Endpoint de cálculo do Grupo A não está disponível');
      }

      if (error.message.includes('Timeout') || error.message.includes('demorou mais')) {
        return res.status(408).json({
          success: false,
          message: 'O cálculo financeiro demorou mais que o esperado. Tente novamente.',
          error: error.message
        });
      }

      if (error.message.includes('Serviço indisponível') || error.message.includes('ECONNREFUSED')) {
        return res.status(503).json({
          success: false,
          message: 'Serviço de cálculo financeiro temporariamente indisponível',
          error: error.message
        });
      }

      // Erro genérico
      return this.internalServerError(res, `Erro no cálculo financeiro do Grupo A: ${error.message}`);
    }
  }

  /**
   * GET /api/v1/financial/health
   * Verifica saúde do serviço financeiro
   */
  async healthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const isHealthy = await this.pvlibClient.healthCheck();
      
      return this.ok(res, {
        success: true,
        healthy: isHealthy,
        message: isHealthy ? 'Serviço financeiro saudável' : 'Serviço financeiro indisponível',
        timestamp: new Date().toISOString(),
        service_url: process.env.ENERGY_SERVICE_URL || 'http://localhost:8110'
      });

    } catch (error: any) {
      
      return res.status(503).json({
        success: false,
        healthy: false,
        message: 'Serviço financeiro indisponível',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}