import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Container } from '@/infrastructure/di/Container';
import { CalculateSolarSystemUseCase, AnalyzeFinancialUseCase } from '@/application';
import { ServiceTokens } from '@/infrastructure';


export class CalculationController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  // NOVO: Endpoint independente de projeto
  async calculateSolarSystemStandalone(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { systemParams, irradiationData, coordinates, financialParams } = req.body;

      // Criar um use case simplificado que não depende de projeto
      const useCase = this.container.resolve<CalculateSolarSystemUseCase>(ServiceTokens.CALCULATE_SOLAR_SYSTEM_USE_CASE);
      
      // Simular um projeto temporário só para os cálculos
      const tempProjectData = {
        projectId: 'standalone-calculation',
        userId,
        systemParams: {
          potenciaNominal: systemParams?.potenciaNominal || 5.0,
          eficiencia: systemParams?.eficiencia || 85,
          perdas: systemParams?.perdas || 5,
          inclinacao: systemParams?.inclinacao || 23,
          orientacao: systemParams?.orientacao || 180,
          area: systemParams?.area || 50
        },
        irradiationData: {
          monthly: irradiationData?.monthly || [5.2, 5.8, 6.1, 5.9, 5.4, 4.8, 5.1, 5.7, 6.0, 6.2, 5.9, 5.4],
          annual: irradiationData?.annual || 67.5
        },
        coordinates: coordinates || { latitude: -23.5505, longitude: -46.6333 },
        financialParams
      };

      // Executar cálculos diretamente sem verificar projeto
      const result = await this.executeStandaloneCalculation(tempProjectData);

      return this.ok(res, result);
    } catch (error) {
      console.error('Calculate solar system standalone error:', error);
      return this.internalServerError(res, 'Erro ao calcular sistema solar');
    }
  }

  private async executeStandaloneCalculation(data: any) {
    const { CalculationLogger } = require('@/domain/services/CalculationLogger');
    const { SolarCalculationService, FinancialAnalysisService, AreaCalculationService } = require('@/domain/services');
    
    const logger = new CalculationLogger(`standalone-calc-${Date.now()}`);
    
    try {
      logger.info('Sistema', 'Iniciando cálculo standalone do sistema solar', { 
        potencia: data.systemParams.potenciaNominal,
        coordenadas: data.coordinates 
      });

      // Criar objeto de coordenadas compatível com os serviços
      const coordinates = {
        getLatitude: () => data.coordinates.latitude,
        getLongitude: () => data.coordinates.longitude,
        latitude: data.coordinates.latitude,
        longitude: data.coordinates.longitude
      };

      // Realizar cálculos sem depender de projeto salvo
      const monthlyGeneration = SolarCalculationService.calculateMonthlyGeneration(
        data.systemParams,
        data.irradiationData,
        coordinates,
        logger
      );

      const annualGeneration = SolarCalculationService.calculateAnnualGeneration(monthlyGeneration, logger);

      const optimalModuleCount = SolarCalculationService.calculateOptimalModuleCount(
        data.systemParams.potenciaNominal,
        450, // Potência padrão do módulo
        data.systemParams.area,
        2.1 // Área padrão do módulo
      );

      const co2Savings = FinancialAnalysisService.calculateCO2Savings(annualGeneration);

      const orientationLoss = AreaCalculationService.calculateOrientationLosses(
        data.systemParams.inclinacao,
        data.systemParams.orientacao,
        coordinates
      );

      // Cálculos financeiros se fornecidos
      let financialAnalysis;
      if (data.financialParams?.totalInvestment) {
        const financialData = {
          totalInvestment: data.financialParams.totalInvestment,
          geracaoEstimadaMensal: data.financialParams.geracaoEstimadaMensal || monthlyGeneration,
          consumoMensal: data.financialParams.consumoMensal || new Array(12).fill(0),
          tarifaEnergiaB: data.financialParams.tarifaEnergiaB || 0.8,
          custoFioB: data.financialParams.custoFioB || 0.3,
          vidaUtil: data.financialParams.vidaUtil || 25,
          inflacaoEnergia: data.financialParams.inflacaoEnergia || 4.5,
          taxaDesconto: data.financialParams.taxaDesconto || 8.0,
        };

        financialAnalysis = FinancialAnalysisService.calculateAdvancedFinancials(financialData);
      }

      logger.result('Sistema', 'Cálculos standalone finalizados com sucesso', {
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings
      });

      return {
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings,
        orientationLoss,
        financialAnalysis,
        calculationLogs: logger.getLogsForConsole(),
        _rawLogs: logger.getLogs()
      };
    } catch (error: any) {
      throw new Error(`Erro ao calcular sistema standalone: ${error.message}`);
    }
  }

  async calculateSolarSystem(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const projectId = req.params.projectId;
      const { systemParams, irradiationData } = req.body;

      const useCase = this.container.resolve<CalculateSolarSystemUseCase>(ServiceTokens.CALCULATE_SOLAR_SYSTEM_USE_CASE);
      
      const result = await useCase.execute({
        projectId,
        userId,
        systemParams,
        irradiationData,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Calculate solar system error:', error);
      return this.internalServerError(res, 'Erro ao calcular sistema solar');
    }
  }

  async analyzeFinancial(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const projectId = req.params.projectId;
      const { financialParams } = req.body;

      const useCase = this.container.resolve<AnalyzeFinancialUseCase>(ServiceTokens.ANALYZE_FINANCIAL_USE_CASE);
      
      const result = await useCase.execute({
        projectId,
        userId,
        financialParams,
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Analyze financial error:', error);
      return this.internalServerError(res, 'Erro na análise financeira');
    }
  }
}