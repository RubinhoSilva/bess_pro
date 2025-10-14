import { Request, Response } from 'express';
import axios from 'axios';
import { BaseController } from './BaseController';
import { Container } from '@/infrastructure/di/Container';
import { CalculateSolarSystemUseCase, AnalyzeFinancialUseCase } from '@/application';
import { ServiceTokens } from '@/infrastructure';
import { CalculationLogger } from '@/domain/services/CalculationLogger';
import { SolarCalculationService } from '@/domain/services/SolarCalculationService';
import { CalculationConstants } from '@/domain/constants/CalculationConstants';

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
          monthly: irradiationData?.monthly || CalculationConstants.IRRADIATION.DEFAULT_MONTHLY_KWH_M2,
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
    const { SolarCalculationService, AreaCalculationService } = require('@/domain/services');
    
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
        CalculationConstants.SOLAR.DEFAULT_MODULE_POWER_W,
        data.systemParams.area,
        CalculationConstants.SOLAR.DEFAULT_MODULE_AREA_M2
      );

      // Cálculo inline simples de economia de CO2
      const co2Savings = annualGeneration * CalculationConstants.CO2.KG_PER_KWH_BRAZIL;

      const orientationLoss = AreaCalculationService.calculateOrientationLosses(
        data.systemParams.inclinacao,
        data.systemParams.orientacao,
        coordinates
      );

      // Calcular resumo detalhado do sistema
      const systemSummary = SolarCalculationService.calculateSystemSummary(
        data.systemParams, 
        annualGeneration, 
        6000, // consumo anual padrão (mantido hardcoded por ser específico do contexto)
        logger
      );

      // Cálculos financeiros se fornecidos
      let financialAnalysis;
      if (data.financialParams?.totalInvestment) {
        const financialData = {
          totalInvestment: data.financialParams.totalInvestment,
          geracaoEstimadaMensal: data.financialParams.geracaoEstimadaMensal || monthlyGeneration,
          consumoMensal: data.financialParams.consumoMensal || new Array(12).fill(0),
          tarifaEnergiaB: data.financialParams.tarifaEnergiaB || CalculationConstants.FINANCIAL.DEFAULT_TARIFA_ENERGIA,
          custoFioB: data.financialParams.custoFioB || CalculationConstants.FINANCIAL.DEFAULT_CUSTO_FIO_B,
          vidaUtil: data.financialParams.vidaUtil || CalculationConstants.FINANCIAL.DEFAULT_VIDA_UTIL_ANOS,
          inflacaoEnergia: data.financialParams.inflacaoEnergia || CalculationConstants.FINANCIAL.DEFAULT_INFLACAO_ENERGIA,
          taxaDesconto: data.financialParams.taxaDesconto || CalculationConstants.FINANCIAL.DEFAULT_TAXA_DESCONTO,
        };

        try {
          // Usar API Python para cálculos financeiros
          const pythonApiInput = {
            investimento_inicial: financialData.totalInvestment,
            geracao_mensal: financialData.geracaoEstimadaMensal,
            consumo_mensal: financialData.consumoMensal,
            tarifa_energia: financialData.tarifaEnergiaB,
            custo_fio_b: financialData.custoFioB,
            vida_util: financialData.vidaUtil,
            taxa_desconto: financialData.taxaDesconto,
            inflacao_energia: financialData.inflacaoEnergia,
            degradacao_modulos: CalculationConstants.ADVANCED_FINANCIAL.MODULE_DEGRADATION_RATE,
            custo_om: financialData.totalInvestment * (CalculationConstants.FINANCIAL.DEFAULT_O_E_M_PERCENT / 100),
            inflacao_om: CalculationConstants.ADVANCED_FINANCIAL.O_M_INFLATION_RATE,
            modalidade_tarifaria: 'convencional'
          };

          // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
          try {
            const fs = require('fs');
            const path = require('path');

            // Criar pasta para payloads se não existir
            const payloadsDir = path.join(process.cwd(), 'payloads');
            if (!fs.existsSync(payloadsDir)) {
              fs.mkdirSync(payloadsDir, { recursive: true });
            }

            // Nome do arquivo com timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `payload-calculation-financial-${timestamp}.json`;
            const filepath = path.join(payloadsDir, filename);

            // Salvar payload
            fs.writeFileSync(filepath, JSON.stringify(pythonApiInput, null, 2), 'utf8');
            console.log(`💾 [CalculationController] Payload salvo em: ${filepath}`);
          } catch (error) {
            console.error('❌ [CalculationController] Erro ao salvar payload:', error);
          }

          const response = await axios.post(
            `${process.env.PVLIB_SERVICE_URL || 'http://localhost:8110'}/financial/calculate-advanced`,
            pythonApiInput,
            {
              headers: { 'Content-Type': 'application/json' },
            timeout: CalculationConstants.VALIDATION.API_TIMEOUT_MS
            }
          );
          
          financialAnalysis = response.data;
        } catch (error) {
        logger.info('Sistema', 'Erro ao calcular análise financeira via API Python, continuando sem análise financeira', { error: error instanceof Error ? error.message : 'Unknown error' });
          financialAnalysis = null;
        }
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
          monthly: [4.5, 4.8, 4.2, 3.9, 3.2, 2.8, 3.1, 3.6, 4.1, 4.7, 5.2, 4.9], // kWh/m²/dia (valores específicos para demonstração)
          annual: 4.35
        },
        financialParams = {
          investimentoInicial: 32000, // R$ (valor específico para demonstração)
          geracaoAnual: 7800, // kWh/ano (será recalculado)
          tarifaEnergia: CalculationConstants.FINANCIAL.DEFAULT_TARIFA_ENERGIA,
          inflacaoEnergia: CalculationConstants.FINANCIAL.DEFAULT_INFLACAO_ENERGIA,
          taxaDesconto: CalculationConstants.FINANCIAL.DEFAULT_TAXA_DESCONTO,
          vidaUtil: CalculationConstants.FINANCIAL.DEFAULT_VIDA_UTIL_ANOS,
          custoOperacional: 200, // R$/ano (valor específico para demonstração)
          valorResidual: 3200 // R$ (10% do investimento - valor específico para demonstração)
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
        6000, // consumo anual padrão (mantido hardcoded por ser específico do contexto)
        logger
      );

      // 4. Cálculos Financeiros (via Python service)
      let financialResults = null;
      
      try {
        const pythonApiInput = {
          investimento_inicial: financialParams.investimentoInicial,
          geracao_mensal: Array(12).fill(annualGeneration / 12),
          consumo_mensal: Array(12).fill(annualGeneration * 0.8), // Estimativa de 80% de autoconsumo
          tarifa_energia: financialParams.tarifaEnergia,
          custo_fio_b: CalculationConstants.FINANCIAL.DEFAULT_CUSTO_FIO_B,
          vida_util: financialParams.vidaUtil,
          taxa_desconto: financialParams.taxaDesconto,
          inflacao_energia: financialParams.inflacaoEnergia,
          degradacao_modulos: CalculationConstants.ADVANCED_FINANCIAL.MODULE_DEGRADATION_RATE,
          custo_om: financialParams.custoOperacional,
          inflacao_om: CalculationConstants.ADVANCED_FINANCIAL.O_M_INFLATION_RATE,
          modalidade_tarifaria: 'convencional'
        };

        // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
        try {
          const fs = require('fs');
          const path = require('path');

          const payloadsDir = path.join(process.cwd(), 'payloads');
          if (!fs.existsSync(payloadsDir)) {
            fs.mkdirSync(payloadsDir, { recursive: true });
          }

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `payload-detailed-calculation-${timestamp}.json`;
          const filepath = path.join(payloadsDir, filename);

          fs.writeFileSync(filepath, JSON.stringify(pythonApiInput, null, 2), 'utf8');
          console.log(`💾 [CalculationController] Payload salvo em: ${filepath}`);
        } catch (error) {
          console.error('❌ [CalculationController] Erro ao salvar payload:', error);
        }

        const response = await axios.post(
          `${process.env.PVLIB_SERVICE_URL || 'http://localhost:8110'}/financial/calculate-advanced`,
          pythonApiInput,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: CalculationConstants.VALIDATION.API_TIMEOUT_MS
          }
        );
        
        financialResults = response.data.data;
        logger.info('Sistema', 'Análise financeira calculada via API Python', { vpl: financialResults?.vpl });
      } catch (error) {
        logger.info('Sistema', 'Erro ao calcular análise financeira via API Python, continuando sem análise financeira', { error: error instanceof Error ? error.message : 'Unknown error' });
        financialResults = null;
      }

      // 3. Resultado final
      const results = {
        sessionId,
        timestamp: new Date().toISOString(),
        inputData: {
          systemParams,
          coordinates,
          irradiationData,
          financialParams: {
            ...financialParams,
            geracaoAnual: annualGeneration
          }
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
        vpl: financialResults?.vpl || 'N/A',
        tir: financialResults?.tir || 'N/A',
        payback: financialResults?.payback_simples || 'N/A',
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
    const potenciaModulo = CalculationConstants.SOLAR.DEFAULT_MODULE_POWER_W;
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
    const areaModulo = CalculationConstants.SOLAR.DEFAULT_MODULE_AREA_M2;
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
    const fatorSeguranca = CalculationConstants.SOLAR.INVERTER_SAFETY_FACTOR;
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