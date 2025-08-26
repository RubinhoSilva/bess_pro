import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { CalculateSolarSystemCommand } from "@/application/dtos/input/calculation/CalculateSolarSystemCommand";
import { SolarCalculationResponseDto } from "@/application/dtos/output/SolarCalculationResponseDto";
import { IProjectRepository, IUserRepository } from "@/domain/repositories";
import { UserPermissionService, SolarCalculationService, FinancialAnalysisService, AreaCalculationService } from "@/domain/services";
import { CalculationLogger } from "@/domain/services/CalculationLogger";
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
        450, // Potência padrão do módulo
        command.systemParams.area,
        2.1 // Área padrão do módulo
      );

      const co2Savings = FinancialAnalysisService.calculateCO2Savings(annualGeneration);

      const orientationLoss = AreaCalculationService.calculateOrientationLosses(
        command.systemParams.inclinacao,
        command.systemParams.orientacao,
        coordinates
      );

      // Cálculos financeiros opcionais
      let financialAnalysis;
      if (command.financialParams && command.financialParams.totalInvestment) {
        const financialData = {
          totalInvestment: command.financialParams.totalInvestment,
          geracaoEstimadaMensal: command.financialParams.geracaoEstimadaMensal || monthlyGeneration,
          consumoMensal: command.financialParams.consumoMensal || new Array(12).fill(0),
          tarifaEnergiaB: command.financialParams.tarifaEnergiaB || 0.7,
          custoFioB: command.financialParams.custoFioB || 0.2,
          vidaUtil: command.financialParams.vidaUtil || 25,
          inflacaoEnergia: command.financialParams.inflacaoEnergia || 8,
          taxaDesconto: command.financialParams.taxaDesconto || 10,
        };

        financialAnalysis = FinancialAnalysisService.calculateAdvancedFinancials(financialData);
      }

      logger.result('Sistema', 'Cálculos finalizados com sucesso', {
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings
      });

      return Result.success({
        monthlyGeneration,
        annualGeneration,
        optimalModuleCount,
        co2Savings,
        orientationLoss,
        financialAnalysis,
        calculationLogs: logger.getLogsForConsole(),
        _rawLogs: logger.getLogs() // Para debug interno
      });
    } catch (error: any) {
      return Result.failure(`Erro ao calcular sistema: ${error.message}`);
    }
  }
}
