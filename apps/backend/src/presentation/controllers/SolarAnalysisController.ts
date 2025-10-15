import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AnalyzeSolarPotentialUseCase } from '../../application/use-cases/solar/AnalyzeSolarPotentialUseCase';
import { CalculationConstants } from '../../domain/constants/CalculationConstants';
import { irradiationToFrontend, pythonToFrontend } from '@bess-pro/shared';
import axios from 'axios';

export class SolarAnalysisController extends BaseController {
  constructor(private analyzeSolarPotentialUseCase: AnalyzeSolarPotentialUseCase) {
    super();
  }

  /**
   * Handles errors from Python service communication
   */
  private handlePythonServiceError(error: any, res: Response, context?: string): Response {
    console.error('Python service error:', error);

    if (error.code === 'ECONNREFUSED') {
      return this.internalServerError(res, 'Serviço de cálculo indisponível');
    }

    if (error.code === 'ECONNABORTED') {
      return this.internalServerError(res, 'Timeout na comunicação com serviço de cálculo');
    }

    if (error.response?.status === 422) {
      return this.badRequest(res, error.response.data.detail || 'Parâmetros inválidos');
    }

    if (error.response?.status === 502) {
      return this.internalServerError(res, 'Erro na comunicação com serviço externo');
    }

    if (error.response?.status === 500) {
      return this.internalServerError(res, error.response.data?.error || 'Erro interno no serviço de cálculos');
    }

    if (error.response?.data?.error) {
      return this.internalServerError(res, error.response.data.error);
    }

    return this.internalServerError(res, 'Erro interno no servidor');
  }

  async analyzePotential(req: Request, res: Response): Promise<Response> {
    try {
      const { latitude, longitude, systemSizeKw, tilt, azimuth } = req.body;

      if (!latitude || !longitude) {
        return this.badRequest(res, 'Latitude e longitude são obrigatórios');
      }

      const result = await this.analyzeSolarPotentialUseCase.execute({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        systemSizeKw: systemSizeKw ? parseFloat(systemSizeKw) : undefined,
        tilt: tilt ? parseFloat(tilt) : undefined,
        azimuth: azimuth ? parseFloat(azimuth) : undefined
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Solar analysis error:', error);
      return this.internalServerError(res, 'Erro interno na análise solar');
    }
  }

  async calculateAdvancedModules(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Chamar Python diretamente (SEM VALIDAÇÕES ESPECÍFICAS)
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';

      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/solar/calculate`,
        req.body,
        {
          timeout: CalculationConstants.API_TIMEOUTS.CALCULATION_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 2. Usar adaptador para converter snake_case → camelCase
      const adaptedResponse = pythonToFrontend(response.data, req.body);
  
      // 3. Retornar resposta adaptada
      return this.ok(res, adaptedResponse.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res);
    }
  }

  async calculateCompleteSolarSystem(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validação HTTP básica
      const { lat, lon, modulo, inversores, consumo_mensal_kwh } = req.body;
      
      if (!lat || !lon || !modulo || !inversores || !consumo_mensal_kwh) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: lat, lon, modulo, inversores, consumo_mensal_kwh');
      }

      if (!Array.isArray(inversores) || inversores.length === 0) {
        return this.badRequest(res, 'inversores deve ser um array com ao menos 1 inversor');
      }

      if (!Array.isArray(consumo_mensal_kwh) || consumo_mensal_kwh.length !== 12) {
        return this.badRequest(res, 'consumo_mensal_kwh deve ser um array com 12 valores');
      }

      // 2. Chamar Python (SEM TRANSFORMAÇÕES)
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/solar/calculate`,
        req.body, // ⚠️ ENVIAR DIRETO, SEM TRANSFORMAR
        {
          timeout: CalculationConstants.API_TIMEOUTS.CALCULATION_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 3. Retornar direto (SEM TRANSFORMAÇÕES)
      return this.ok(res, response.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res);
    }
  }

  async calculateAdvancedFinancialAnalysis(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validação HTTP básica
      const { investimento_inicial, geracao_mensal, consumo_mensal, tarifa_energia } = req.body;
      
      if (!investimento_inicial || !geracao_mensal || !consumo_mensal || !tarifa_energia) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: investimento_inicial, geracao_mensal, consumo_mensal, tarifa_energia');
      }

      // 2. Chamar Python (SEM TRANSFORMAÇÕES)
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/financial/calculate-advanced`,
        req.body, // ⚠️ ENVIAR DIRETO, SEM TRANSFORMAR
        {
          timeout: CalculationConstants.API_TIMEOUTS.FINANCIAL_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 3. Retornar direto (SEM TRANSFORMAÇÕES)
      return this.ok(res, response.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res);
    }
  }

  async analyzeMonthlyIrradiation(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validação HTTP básica
      const { lat, lon, data_source } = req.body;
      
      if (!lat || !lon || !data_source) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: lat, lon, data_source');
      }

      // 2. Chamar Python
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';

      console.log('Request body for irradiation analysis:', req.body);
      
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/irradiation/monthly`,
        req.body,
        {
          timeout: CalculationConstants.API_TIMEOUTS.IRRADIATION_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 3. Usar adaptador para converter snake_case → camelCase
      const adaptedResponse = irradiationToFrontend(response.data);
  
      // 4. Retornar resposta adaptada
      return this.ok(res, adaptedResponse.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res);
    }
  }

  async calculateMPPTLimits(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validação HTTP básica
      const { fabricante, modelo, potencia_modulo_w, voc_stc, temp_coef_voc, latitude, longitude } = req.body;
      
      if (!fabricante || !modelo || !potencia_modulo_w || !voc_stc || !temp_coef_voc || !latitude || !longitude) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: fabricante, modelo, potencia_modulo_w, voc_stc, temp_coef_voc, latitude, longitude');
      }

      // 2. Chamar serviço Python diretamente
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/mppt/calculate-modules-per-mppt`,
        req.body,
        {
          timeout: CalculationConstants.API_TIMEOUTS.MPPT_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 3. Retornar resposta direta
      return res.status(200).json(response.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res, 'cálculo de limites MPPT');
    }
  }

  async calculateIrradiationCorrection(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validação HTTP básica
      if (!req.body) {
        return this.badRequest(res, 'Parâmetros não fornecidos');
      }

      // 2. Chamar serviço Python diretamente
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/irradiation/monthly`,
        req.body,
        {
          timeout: CalculationConstants.API_TIMEOUTS.API_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 3. Retornar resposta direta
      return res.status(200).json(response.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res, 'cálculo de irradiação corrigida');
    }
  }

  async getEnhancedAnalysisData(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validação HTTP básica
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return this.badRequest(res, 'Latitude e longitude são obrigatórios');
      }

      // 2. Preparar parâmetros para serviço Python
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      const params = {
        lat: parseFloat(lat as string),
        lon: parseFloat(lon as string),
        tilt: req.query.tilt ? parseFloat(req.query.tilt as string) : 0,
        azimuth: req.query.azimuth ? parseFloat(req.query.azimuth as string) : 0,
        modelo_decomposicao: 'erbs',
        data_source: (req.query.data_source as string) || 'pvgis'
      };

      // 3. Chamar serviço Python diretamente
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/irradiation/monthly`,
        params,
        { timeout: CalculationConstants.API_TIMEOUTS.MPPT_TIMEOUT_MS }
      );

      // 4. Retornar resposta direta
      return res.status(200).json(response.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res, 'busca de dados de análise avançada');
    }
  }

  async calculateSolarSystem(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Validação HTTP básica
      if (!req.body) {
        return this.badRequest(res, 'Parâmetros não fornecidos');
      }

      // 2. Chamar serviço Python diretamente
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/modules/calculate`,
        req.body,
        {
          timeout: CalculationConstants.API_TIMEOUTS.API_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 3. Retornar resposta direta
      return res.status(200).json(response.data);

    } catch (error: any) {
      return this.handlePythonServiceError(error, res, 'cálculo do sistema solar');
    }
  }
}