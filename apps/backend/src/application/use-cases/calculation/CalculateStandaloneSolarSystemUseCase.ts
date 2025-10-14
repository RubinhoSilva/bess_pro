import { Result } from '@/application/common/Result';
import { IUseCase } from '@/application/common/IUseCase';
import { SolarCalculationService, AreaCalculationService } from '@/domain/services';
import { CalculationLogger } from '@/domain/services/CalculationLogger';
import { CalculationConstants } from '@/domain/constants/CalculationConstants';
import { Coordinates } from '@/domain/value-objects/Coordinates';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface CalculateStandaloneSolarSystemRequest {
  userId: string;
  systemParams: {
    potenciaNominal: number;
    eficiencia: number;
    perdas: number;
    inclinacao: number;
    orientacao: number;
    area: number;
  };
  irradiationData: {
    monthly: number[];
    annual: number;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  financialParams?: {
    totalInvestment: number;
    geracaoEstimadaMensal?: number[];
    consumoMensal?: number[];
    tarifaEnergiaB?: number;
    custoFioB?: number;
    vidaUtil?: number;
    inflacaoEnergia?: number;
    taxaDesconto?: number;
  };
}

interface CalculateStandaloneSolarSystemResponse {
  monthlyGeneration: number[];
  annualGeneration: number;
  optimalModuleCount: number;
  co2Savings: number;
  orientationLoss: number;
  systemSummary: any;
  financialAnalysis?: any;
  calculationLogs: any[];
  _rawLogs: any[];
}

export class CalculateStandaloneSolarSystemUseCase implements IUseCase<CalculateStandaloneSolarSystemRequest, Result<CalculateStandaloneSolarSystemResponse>> {
  async execute(request: CalculateStandaloneSolarSystemRequest): Promise<Result<CalculateStandaloneSolarSystemResponse>> {
    try {
      const logger = new CalculationLogger(`standalone-calc-${Date.now()}`);
      
      logger.info('Sistema', 'Iniciando cálculo standalone do sistema solar', { 
        potencia: request.systemParams.potenciaNominal,
        coordenadas: request.coordinates 
      });

      // Criar objeto de coordenadas compatível com os serviços
      const coordinates = Coordinates.create(request.coordinates.latitude, request.coordinates.longitude);

      // Realizar cálculos sem depender de projeto salvo
      const monthlyGeneration = SolarCalculationService.calculateMonthlyGeneration(
        request.systemParams,
        request.irradiationData,
        coordinates,
        logger
      );

      const annualGeneration = SolarCalculationService.calculateAnnualGeneration(monthlyGeneration, logger);

      const optimalModuleCountResult = SolarCalculationService.calculateOptimalModuleCount(
        request.systemParams.potenciaNominal,
        CalculationConstants.SOLAR.DEFAULT_MODULE_POWER_W,
        request.systemParams.area,
        CalculationConstants.SOLAR.DEFAULT_MODULE_AREA_M2
      );
      const optimalModuleCount = optimalModuleCountResult.moduleCount;

      // Cálculo inline simples de economia de CO2
      const co2Savings = annualGeneration * CalculationConstants.CO2.KG_PER_KWH_BRAZIL;

      const orientationLoss = AreaCalculationService.calculateOrientationLosses(
        request.systemParams.inclinacao,
        request.systemParams.orientacao,
        coordinates
      );

      // Calcular resumo detalhado do sistema
      const systemSummary = SolarCalculationService.calculateSystemSummary(
        request.systemParams, 
        annualGeneration, 
        CalculationConstants.CONSUMPTION_DEFAULTS.DEFAULT_ANNUAL_CONSUMPTION_KWH, // consumo anual padrão
        logger
      );

      // Cálculos financeiros se fornecidos
      let financialAnalysis;
      if (request.financialParams?.totalInvestment) {
        financialAnalysis = await this.calculateFinancialAnalysis(request.financialParams, monthlyGeneration, logger);
      }

      logger.result('Sistema', 'Cálculos standalone finalizados com sucesso', {
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings,
        systemSummary
      });

      const response: CalculateStandaloneSolarSystemResponse = {
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

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro ao calcular sistema standalone: ${error.message}`);
    }
  }

  private async calculateFinancialAnalysis(financialParams: any, monthlyGeneration: number[], logger: CalculationLogger): Promise<any> {
    try {
      const financialData = {
        totalInvestment: financialParams.totalInvestment,
        geracaoEstimadaMensal: financialParams.geracaoEstimadaMensal || monthlyGeneration,
        consumoMensal: financialParams.consumoMensal || new Array(12).fill(0),
        tarifaEnergiaB: financialParams.tarifaEnergiaB || CalculationConstants.FINANCIAL.DEFAULT_TARIFA_ENERGIA,
        custoFioB: financialParams.custoFioB || CalculationConstants.FINANCIAL.DEFAULT_CUSTO_FIO_B,
        vidaUtil: financialParams.vidaUtil || CalculationConstants.FINANCIAL.DEFAULT_VIDA_UTIL_ANOS,
        inflacaoEnergia: financialParams.inflacaoEnergia || CalculationConstants.FINANCIAL.DEFAULT_INFLACAO_ENERGIA,
        taxaDesconto: financialParams.taxaDesconto || CalculationConstants.FINANCIAL.DEFAULT_TAXA_DESCONTO,
      };

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

      // Salvar payload para debug
      this.savePayloadForDebug(pythonApiInput, 'calculation-financial');

      const response = await axios.post(
        `${process.env.PVLIB_SERVICE_URL || 'http://localhost:8110'}/financial/calculate-advanced`,
        pythonApiInput,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: CalculationConstants.VALIDATION.API_TIMEOUT_MS
        }
      );
      
      return response.data;
    } catch (error) {
      logger.info('Sistema', 'Erro ao calcular análise financeira via API Python, continuando sem análise financeira', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  private savePayloadForDebug(payload: any, prefix: string): void {
    try {
      // Criar pasta para payloads se não existir
      const payloadsDir = path.join(process.cwd(), 'payloads');
      if (!fs.existsSync(payloadsDir)) {
        fs.mkdirSync(payloadsDir, { recursive: true });
      }

      // Nome do arquivo com timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `payload-${prefix}-${timestamp}.json`;
      const filepath = path.join(payloadsDir, filename);

      // Salvar payload
      fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
      console.log(`💾 [CalculateStandaloneSolarSystemUseCase] Payload salvo em: ${filepath}`);
    } catch (error) {
      console.error('❌ [CalculateStandaloneSolarSystemUseCase] Erro ao salvar payload:', error);
    }
  }
}