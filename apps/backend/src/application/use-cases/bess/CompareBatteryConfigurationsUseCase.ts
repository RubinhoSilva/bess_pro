import { Result } from '@/application/common/Result';
import { IUseCase } from '@/application/common/IUseCase';

interface BatteryConfiguration {
  battery_specs: {
    manufacturer: string;
    model: string;
    cycles: number;
    efficiency: number;
    depth_of_discharge: number;
  };
  system_cost: number;
  total_capacity: number;
  total_power: number;
  backup_time: number;
  system_lifetime: number;
}

interface CompareBatteryConfigurationsRequest {
  userId: string;
  configurations: BatteryConfiguration[];
}

interface ConfigurationComparison {
  id: number;
  name: string;
  config: BatteryConfiguration;
  cost_per_kwh: number;
  cost_per_kw: number;
  roi_score: number;
  reliability_score: number;
  efficiency_score: number;
}

interface ComparisonSummary {
  cheapest: ConfigurationComparison;
  best_roi: ConfigurationComparison;
  most_reliable: ConfigurationComparison;
  most_efficient: ConfigurationComparison;
}

interface CompareBatteryConfigurationsResponse {
  configurations: ConfigurationComparison[];
  summary: ComparisonSummary;
}

export class CompareBatteryConfigurationsUseCase implements IUseCase<CompareBatteryConfigurationsRequest, Result<CompareBatteryConfigurationsResponse>> {
  async execute(request: CompareBatteryConfigurationsRequest): Promise<Result<CompareBatteryConfigurationsResponse>> {
    try {
      const { configurations } = request;

      // Análise comparativa
      const comparisonConfigurations: ConfigurationComparison[] = configurations.map((config, index) => ({
        id: index + 1,
        name: `${config.battery_specs.manufacturer} ${config.battery_specs.model}`,
        config,
        cost_per_kwh: config.system_cost / config.total_capacity,
        cost_per_kw: config.system_cost / config.total_power,
        roi_score: this.calculateROIScore(config),
        reliability_score: this.calculateReliabilityScore(config),
        efficiency_score: config.battery_specs.efficiency
      }));

      // Encontrar a melhor em cada categoria
      const summary: ComparisonSummary = {
        cheapest: comparisonConfigurations.reduce((prev, curr) => 
          prev.config.system_cost < curr.config.system_cost ? prev : curr
        ),
        best_roi: comparisonConfigurations.reduce((prev, curr) => 
          prev.roi_score > curr.roi_score ? prev : curr
        ),
        most_reliable: comparisonConfigurations.reduce((prev, curr) => 
          prev.reliability_score > curr.reliability_score ? prev : curr
        ),
        most_efficient: comparisonConfigurations.reduce((prev, curr) => 
          prev.efficiency_score > curr.efficiency_score ? prev : curr
        )
      };

      const response: CompareBatteryConfigurationsResponse = {
        configurations: comparisonConfigurations,
        summary
      };

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro ao comparar configurações de bateria: ${error.message}`);
    }
  }

  private calculateROIScore(config: BatteryConfiguration): number {
    // Score baseado no payback e vida útil
    const paybackScore = Math.max(0, 100 - (config.backup_time * 10));
    const lifetimeScore = config.system_lifetime * 5;
    const costScore = Math.max(0, 100 - ((config.system_cost / config.total_capacity) / 1000));
    
    return Math.round((paybackScore + lifetimeScore + costScore) / 3);
  }

  private calculateReliabilityScore(config: BatteryConfiguration): number {
    // Score baseado em ciclos de vida e eficiência
    const cycleScore = Math.min(100, (config.battery_specs.cycles / 10000) * 100);
    const efficiencyScore = config.battery_specs.efficiency;
    const dodScore = config.battery_specs.depth_of_discharge;
    
    return Math.round((cycleScore + efficiencyScore + dodScore) / 3);
  }
}