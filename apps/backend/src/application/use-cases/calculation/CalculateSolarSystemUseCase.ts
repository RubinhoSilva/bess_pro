import axios from 'axios';
import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { CalculateSolarSystemCommand } from "@/application/dtos/input/calculation/CalculateSolarSystemCommand";
import { SolarCalculationResponseDto } from "@/application/dtos/output/SolarCalculationResponseDto";
import { IProjectRepository, IUserRepository } from "@/domain/repositories";
import { UserPermissionService, SolarCalculationService, AreaCalculationService } from "@/domain/services";
import { CalculationLogger } from "@/domain/services/CalculationLogger";
import { CalculationConstants } from "@/domain/constants/CalculationConstants";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export class CalculateSolarSystemUseCase implements IUseCase<CalculateSolarSystemCommand, Result<SolarCalculationResponseDto>> {
  constructor(
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: CalculateSolarSystemCommand): Promise<Result<SolarCalculationResponseDto>> {
    const logger = new CalculationLogger(`solar-calc-${Date.now()}`);
    
    try {
      logger.info('Sistema', 'Iniciando cálculo do sistema solar', { projectId: command.projectId, userId: command.userId });
      // Buscar projeto
      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId.getValue());

      if (!project) {
        return Result.failure('Projeto não encontrado');
      }

      // Verificar permissões
      const userId = UserId.create(command.userId);
      const user = await this.userRepository.findById(userId.getValue());
      
      if (!user || !UserPermissionService.canAccessProject(user, project)) {
        return Result.failure('Sem permissão para acessar este projeto');
      }

      // Verificar se projeto tem localização
      const coordinates = project.getLocation();
      if (!coordinates) {
        return Result.failure('Projeto deve ter localização definida');
      }

      // Realizar cálculos
      logger.info('Cálculos', 'Iniciando cálculos de geração solar');
      
      const monthlyGeneration = SolarCalculationService.calculateMonthlyGeneration(
        command.systemParams,
        command.irradiationData,
        coordinates,
        logger
      );

      const annualGeneration = SolarCalculationService.calculateAnnualGeneration(monthlyGeneration, logger);

      const optimalModuleCount = SolarCalculationService.calculateOptimalModuleCount(
        command.systemParams.potenciaNominal,
        CalculationConstants.SOLAR.DEFAULT_MODULE_POWER_W,
        command.systemParams.area,
        CalculationConstants.SOLAR.DEFAULT_MODULE_AREA_M2
      );

      // Cálculo inline simples de economia de CO2
      const co2Savings = annualGeneration * CalculationConstants.CO2.KG_PER_KWH_BRAZIL;

      const orientationLoss = AreaCalculationService.calculateOrientationLosses(
        command.systemParams.inclinacao,
        command.systemParams.orientacao,
        coordinates
      );

      // Calcular resumo detalhado do sistema
      const systemSummary = SolarCalculationService.calculateSystemSummary(
        command.systemParams, 
        annualGeneration, 
        6000, // consumo anual padrão (mantido hardcoded por ser específico do contexto)
        logger
      );

      // Cálculos financeiros opcionais
      let financialAnalysis;
      if (command.financialParams && command.financialParams.totalInvestment) {
        const financialData = {
          totalInvestment: command.financialParams.totalInvestment,
          geracaoEstimadaMensal: command.financialParams.geracaoEstimadaMensal || monthlyGeneration,
          consumoMensal: command.financialParams.consumoMensal || new Array(12).fill(0),
          tarifaEnergiaB: command.financialParams.tarifaEnergiaB || CalculationConstants.FINANCIAL.DEFAULT_TARIFA_ENERGIA,
          custoFioB: command.financialParams.custoFioB || CalculationConstants.FINANCIAL.DEFAULT_CUSTO_FIO_B,
          vidaUtil: command.financialParams.vidaUtil || CalculationConstants.FINANCIAL.DEFAULT_VIDA_UTIL_ANOS,
          inflacaoEnergia: command.financialParams.inflacaoEnergia || CalculationConstants.FINANCIAL.DEFAULT_INFLACAO_ENERGIA,
          taxaDesconto: command.financialParams.taxaDesconto || CalculationConstants.FINANCIAL.DEFAULT_TAXA_DESCONTO,
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
            const filename = `payload-solar-system-financial-${timestamp}.json`;
            const filepath = path.join(payloadsDir, filename);

            // Salvar payload
            fs.writeFileSync(filepath, JSON.stringify(pythonApiInput, null, 2), 'utf8');
            console.log(`💾 [CalculateSolarSystemUseCase] Payload salvo em: ${filepath}`);
          } catch (error) {
            console.error('❌ [CalculateSolarSystemUseCase] Erro ao salvar payload:', error);
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
          logger.info('Sistema', 'Análise financeira calculada via API Python', { vpl: financialAnalysis?.vpl });
        } catch (error) {
          logger.error('Sistema', 'Erro ao calcular análise financeira via API Python, continuando sem análise financeira', { error: error instanceof Error ? error.message : 'Unknown error' });
          financialAnalysis = null;
        }
      }

      logger.result('Sistema', 'Cálculos finalizados com sucesso', {
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings,
        systemSummary
      });

      return Result.success({
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings,
        orientationLoss,
        systemSummary,
        financialAnalysis,
        calculationLogs: logger.getLogsForConsole(),
        _rawLogs: logger.getLogs() // Para debug interno
      });
    } catch (error: any) {
      return Result.failure(`Erro ao calcular sistema: ${error.message}`);
    }
  }
}
