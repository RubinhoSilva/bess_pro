import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { IProjectRepository, IUserRepository } from "@/domain/repositories";
import { BessCalculationService, LoadProfile, BessSystemParams, BessAnalysisResult } from "@/domain/services/BessCalculationService";
import { UserPermissionService } from "@/domain/services";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export interface CalculateBessSystemCommand {
  projectId: string;
  userId: string;
  loadProfile: LoadProfile;
  systemParams?: Partial<BessSystemParams>;
  simulationDays?: number;
}

export interface BessCalculationResponseDto {
  analysis: BessAnalysisResult;
  optimizedLoadProfile: {
    optimized_profile: number[];
    energy_savings: number;
  };
  operationSimulation: Array<{
    day: number;
    energy_charged: number;
    energy_discharged: number;
    peak_shaving: number;
    soc_profile: number[];
  }>;
  recommendations: {
    installation_tips: string[];
    maintenance_schedule: string[];
    optimization_suggestions: string[];
  };
}

export class CalculateBessSystemUseCase implements IUseCase<CalculateBessSystemCommand, Result<BessCalculationResponseDto>> {
  constructor(
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: CalculateBessSystemCommand): Promise<Result<BessCalculationResponseDto>> {
    try {
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

      // Validar dados de entrada
      const validationResult = this.validateLoadProfile(command.loadProfile);
      if (!validationResult.isValid) {
        return Result.failure(validationResult.error!);
      }

      // Parâmetros padrão do sistema
      const defaultSystemParams: BessSystemParams = {
        autonomy_hours: 4,
        depth_of_discharge: 90,
        system_efficiency: 85,
        redundancy_factor: 1.1,
        peak_power_factor: 1.2,
        future_expansion: 20,
        ...command.systemParams
      };

      // Realizar análise BESS
      const analysis = BessCalculationService.calculateBessSystem(
        command.loadProfile,
        defaultSystemParams
      );

      // Otimizar perfil de carga
      const optimizedLoadProfile = BessCalculationService.optimizeLoadProfile(
        command.loadProfile,
        analysis.recommended_config
      );

      // Simular operação do sistema
      const simulationDays = command.simulationDays || 30;
      const operationSimulation = BessCalculationService.simulateBessOperation(
        analysis.recommended_config,
        command.loadProfile,
        simulationDays
      );

      // Gerar recomendações
      const recommendations = this.generateRecommendations(analysis);

      const response: BessCalculationResponseDto = {
        analysis,
        optimizedLoadProfile,
        operationSimulation,
        recommendations
      };

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro ao calcular sistema BESS: ${error.message}`);
    }
  }

  private validateLoadProfile(loadProfile: LoadProfile): { isValid: boolean; error?: string } {
    // Validar perfil de carga horário
    if (!loadProfile.hourly_consumption || loadProfile.hourly_consumption.length !== 24) {
      return { isValid: false, error: 'Perfil de carga horário deve ter 24 valores' };
    }

    // Verificar valores negativos
    if (loadProfile.hourly_consumption.some(value => value < 0)) {
      return { isValid: false, error: 'Valores de consumo não podem ser negativos' };
    }

    // Validar consistência
    const calculatedDailyConsumption = loadProfile.hourly_consumption.reduce((sum, value) => sum + value, 0);
    const tolerance = 0.1; // 10% de tolerância
    
    if (Math.abs(calculatedDailyConsumption - loadProfile.daily_consumption) > 
        loadProfile.daily_consumption * tolerance) {
      return { 
        isValid: false, 
        error: 'Consumo diário não coincide com a soma do perfil horário' 
      };
    }

    // Validar valores obrigatórios
    if (!loadProfile.peak_power || loadProfile.peak_power <= 0) {
      return { isValid: false, error: 'Potência de pico deve ser maior que zero' };
    }

    if (!loadProfile.essential_loads || loadProfile.essential_loads <= 0) {
      return { isValid: false, error: 'Cargas essenciais devem ser maiores que zero' };
    }

    if (!loadProfile.backup_duration || loadProfile.backup_duration <= 0) {
      return { isValid: false, error: 'Duração de backup deve ser maior que zero' };
    }

    return { isValid: true };
  }

  private generateRecommendations(analysis: BessAnalysisResult) {
    const config = analysis.recommended_config;
    
    const installation_tips = [
      'Instale as baterias em local ventilado e com temperatura controlada',
      'Mantenha as baterias longe de fontes de calor e umidade excessiva',
      'Certifique-se de que o local suporte o peso do sistema',
      `Para ${config.quantity} baterias ${config.battery_specs.model}, reserve espaço de pelo menos ${Math.ceil(config.quantity * 2)} m²`,
      'Instale sistema de monitoramento para acompanhar performance'
    ];

    const maintenance_schedule = [
      'Verificação mensal: tensão e temperatura das baterias',
      'Verificação trimestral: conexões e torque dos terminais',
      'Verificação semestral: balanceamento das células',
      'Verificação anual: teste de capacidade e substituição preventiva',
      `Substituição prevista: ${Math.round(config.system_lifetime)} anos`
    ];

    const optimization_suggestions = [];
    
    if (analysis.technical_analysis.grid_independence < 50) {
      optimization_suggestions.push('Considere aumentar a capacidade para maior independência da rede');
    }
    
    if (analysis.financial_analysis.payback_period > 10) {
      optimization_suggestions.push('Avalie reduzir o sistema para melhorar o payback');
    }
    
    if (analysis.technical_analysis.peak_shaving_potential < config.total_power * 0.7) {
      optimization_suggestions.push('Sistema tem potencial subutilizado para peak shaving');
    }

    optimization_suggestions.push('Implemente tarifação diferenciada para maximizar economia');
    optimization_suggestions.push('Considere integração com sistema solar para maior eficiência');

    return {
      installation_tips,
      maintenance_schedule,
      optimization_suggestions
    };
  }
}