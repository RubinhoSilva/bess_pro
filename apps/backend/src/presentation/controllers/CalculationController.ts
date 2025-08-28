import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Container } from '@/infrastructure/di/Container';
import { CalculateSolarSystemUseCase, AnalyzeFinancialUseCase } from '@/application';
import { ServiceTokens } from '@/infrastructure';
import { CalculationLogger } from '@/domain/services/CalculationLogger';
import { SolarCalculationService } from '@/domain/services/SolarCalculationService';
import { EnhancedFinancialCalculationService } from '@/domain/services/EnhancedFinancialCalculationService';
import { IrradiationAnalysisService } from '@/domain/services/IrradiationAnalysisService';
import { Coordinates } from '@/domain/value-objects/Coordinates';


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

      // Calcular resumo detalhado do sistema
      const systemSummary = SolarCalculationService.calculateSystemSummary(
        data.systemParams, 
        annualGeneration, 
        6000, // consumo anual padrão 
        logger
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
        co2Savings,
        systemSummary
      });

      return {
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings,
        orientationLoss,
        systemSummary,
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

  /**
   * Endpoint para demonstração de cálculos detalhados com logs
   */
  async calculateWithDetailedLogs(req: Request, res: Response): Promise<Response> {
    try {
      const sessionId = `detailed-calc-${Date.now()}`;
      const logger = new CalculationLogger(sessionId);
      
      // Parâmetros de entrada
      const {
        systemParams = {
          potenciaNominal: 5.4, // kWp
          area: 30, // m²
          eficiencia: 20, // %
          perdas: 14, // %
          inclinacao: 23, // graus
          orientacao: 0 // graus (Norte)
        },
        coordinates = {
          latitude: -23.5505,
          longitude: -46.6333
        },
        irradiationData = {
          monthly: [4.5, 4.8, 4.2, 3.9, 3.2, 2.8, 3.1, 3.6, 4.1, 4.7, 5.2, 4.9], // kWh/m²/dia
          annual: 4.35
        },
        financialParams = {
          investimentoInicial: 32000, // R$
          geracaoAnual: 7800, // kWh/ano (será recalculado)
          tarifaEnergia: 0.85, // R$/kWh
          inflacaoEnergia: 5.5, // % ao ano
          taxaDesconto: 10.0, // % ao ano
          vidaUtil: 25, // anos
          custoOperacional: 200, // R$/ano
          valorResidual: 3200 // R$ (10% do investimento)
        }
      } = req.body;

      logger.info('Sistema', 'Iniciando demonstração de cálculos detalhados', {
        sessionId,
        timestamp: new Date().toISOString()
      });

      // 1. Análise de Irradiação
      const coordsObj = Coordinates.create(coordinates.latitude, coordinates.longitude);
      
      const irradiationAnalysis = IrradiationAnalysisService.analyzeIrradiation(
        irradiationData.monthly,
        coordinates,
        logger
      );

      // 2. Cálculos Solares
      const monthlyGeneration = SolarCalculationService.calculateMonthlyGeneration(
        systemParams,
        irradiationData,
        coordsObj,
        logger
      );

      const annualGeneration = SolarCalculationService.calculateAnnualGeneration(monthlyGeneration, logger);

      // 3. Cálculo do Resumo do Sistema
      const systemSummary = SolarCalculationService.calculateSystemSummary(
        systemParams, 
        annualGeneration, 
        6000, // consumo anual padrão 
        logger
      );

      // 4. Cálculos Financeiros
      const enhancedFinancialParams = {
        ...financialParams,
        geracaoAnual: annualGeneration // Usar a geração calculada
      };

      const financialResults = EnhancedFinancialCalculationService.calculateFinancialIndicators(
        enhancedFinancialParams,
        logger
      );

      // 3. Resultado final
      const results = {
        sessionId,
        timestamp: new Date().toISOString(),
        inputData: {
          systemParams,
          coordinates,
          irradiationData,
          financialParams: enhancedFinancialParams
        },
        calculations: {
          irradiation: irradiationAnalysis,
          solar: {
            monthlyGeneration,
            annualGeneration,
            averageMonthlyGeneration: annualGeneration / 12
          },
          systemSummary,
          financial: financialResults
        },
        logs: {
          console: logger.getLogsForConsole(),
          detailed: logger.getDetailedReport(),
          summary: {
            totalOperations: logger.getLogs().length,
            operationsByType: this.summarizeLogsByType(logger.getLogs()),
            operationsByCategory: this.summarizeLogsByCategory(logger.getLogs())
          }
        }
      };

      logger.result('Sistema', 'Cálculos detalhados concluídos com sucesso', {
        totalLogs: logger.getLogs().length,
        vpl: financialResults.vpl,
        tir: financialResults.tir,
        payback: financialResults.payback,
        geracaoAnual: annualGeneration
      });

      return this.ok(res, results);
      
    } catch (error) {
      console.error('Calculate with detailed logs error:', error);
      return this.internalServerError(res, 'Erro ao executar cálculos detalhados');
    }
  }

  /**
   * Método auxiliar para sumarizar logs por tipo
   */
  private summarizeLogsByType(logs: any[]): Record<string, number> {
    const summary: Record<string, number> = {};
    logs.forEach(log => {
      summary[log.type] = (summary[log.type] || 0) + 1;
    });
    return summary;
  }

  /**
   * Método auxiliar para sumarizar logs por categoria
   */
  private summarizeLogsByCategory(logs: any[]): Record<string, number> {
    const summary: Record<string, number> = {};
    logs.forEach(log => {
      summary[log.category] = (summary[log.category] || 0) + 1;
    });
    return summary;
  }

  /**
   * Calcula resumo detalhado do sistema fotovoltaico
   */
  private calculateSystemSummary(
    systemParams: any, 
    annualGeneration: number, 
    consumoAnual: number, 
    logger?: CalculationLogger
  ) {
    logger?.context('Sistema', 'Calculando resumo do sistema fotovoltaico', {
      potenciaNominal: systemParams.potenciaNominal,
      geracaoAnual: annualGeneration,
      consumoAnual
    }, 'Cálculo do resumo completo do sistema incluindo potência, módulos, área necessária, inversor e cobertura do consumo.');

    // Cálculo do número de módulos
    const potenciaModulo = 540; // W padrão
    const numeroModulos = Math.ceil((systemParams.potenciaNominal * 1000) / potenciaModulo);
    const potenciaPicoReal = (numeroModulos * potenciaModulo) / 1000;

    logger?.formula('Sistema', 'Número de Módulos Necessários',
      'N_módulos = TETO(P_sistema / P_módulo)',
      {
        P_sistema_W: systemParams.potenciaNominal * 1000,
        P_modulo_W: potenciaModulo,
        divisao: (systemParams.potenciaNominal * 1000) / potenciaModulo
      },
      numeroModulos,
      {
        description: 'Número inteiro de módulos necessários para atingir a potência desejada. Usa função TETO para arredondar para cima.',
        units: 'unidades',
        references: ['NBR 16274:2014 - Dimensionamento de sistemas FV']
      }
    );

    // Cálculo da área necessária
    const areaModulo = 2.1; // m² padrão
    const areaNecessaria = numeroModulos * areaModulo;

    logger?.formula('Sistema', 'Área Necessária para Instalação',
      'A_total = N_módulos × A_módulo',
      {
        N_modulos: numeroModulos,
        A_modulo_m2: areaModulo
      },
      areaNecessaria,
      {
        description: 'Área total necessária para instalação dos módulos fotovoltaicos, considerando área individual de cada módulo.',
        units: 'm²',
        references: ['Manual de Engenharia FV - CRESESB']
      }
    );

    // Geração mensal média
    const geracaoMensalMedia = annualGeneration / 12;

    logger?.formula('Sistema', 'Geração Mensal Média',
      'E_mensal = E_anual / 12',
      {
        E_anual_kWh: annualGeneration
      },
      geracaoMensalMedia,
      {
        description: 'Média mensal de energia gerada pelo sistema fotovoltaico.',
        units: 'kWh/mês'
      }
    );

    // Potência do inversor recomendada
    const fatorSeguranca = 1.2;
    const potenciaInversor = potenciaPicoReal * fatorSeguranca;

    logger?.formula('Sistema', 'Potência do Inversor Recomendada',
      'P_inversor = P_pico × F_segurança',
      {
        P_pico_kW: potenciaPicoReal,
        F_seguranca: fatorSeguranca
      },
      potenciaInversor,
      {
        description: 'Potência recomendada do inversor considerando fator de segurança de 20% sobre a potência pico.',
        units: 'kW',
        references: ['IEC 62109 - Inversores fotovoltaicos']
      }
    );

    // Cobertura do consumo
    const coberturaConsumo = (annualGeneration / consumoAnual) * 100;

    logger?.formula('Sistema', 'Cobertura do Consumo Anual',
      'Cobertura_% = (E_gerada / E_consumida) × 100',
      {
        E_gerada_kWh: annualGeneration,
        E_consumida_kWh: consumoAnual
      },
      coberturaConsumo,
      {
        description: 'Percentual do consumo anual coberto pela geração do sistema fotovoltaico. Valores acima de 100% indicam excesso de geração.',
        units: '%',
        references: ['REN 482/2012 - Compensação de energia']
      }
    );

    const resumo = {
      potenciaPico: {
        valor: potenciaPicoReal,
        unidade: 'kWp'
      },
      modulos: {
        quantidade: numeroModulos,
        potenciaUnitaria: potenciaModulo,
        unidade: 'W'
      },
      geracaoAnual: {
        valor: annualGeneration,
        unidade: 'kWh',
        mensal: geracaoMensalMedia
      },
      areaNecessaria: {
        valor: areaNecessaria,
        unidade: 'm²'
      },
      inversor: {
        potenciaRecomendada: potenciaInversor,
        unidade: 'kW',
        status: 'A definir'
      },
      coberturaConsumo: {
        valor: coberturaConsumo,
        unidade: '%',
        consumoAnual: consumoAnual,
        geracaoEstimada: annualGeneration
      }
    };

    logger?.result('Sistema', 'Resumo do sistema calculado', resumo);

    return resumo;
  }
}