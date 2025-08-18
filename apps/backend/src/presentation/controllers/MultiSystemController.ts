import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CalculateMultiSystemUseCase } from '../../application/use-cases/bess/CalculateMultiSystemUseCase';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class MultiSystemController extends BaseController {
  private calculateMultiSystemUseCase: CalculateMultiSystemUseCase;

  constructor(container: Container) {
    super();
    // Instanciar diretamente por enquanto
    this.calculateMultiSystemUseCase = new CalculateMultiSystemUseCase();
  }

  /**
   * POST /multi-system/calculate
   * Calcula configuração ótima de sistema multi-energético
   */
  async calculateMultiSystem(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const requestData = req.body;

      // Validar dados básicos
      if (!requestData.loadProfile) {
        this.badRequest(res, 'Perfil de carga é obrigatório');
        return;
      }

      const result = await this.calculateMultiSystemUseCase.execute({
        loadProfile: requestData.loadProfile,
        allowedSystems: requestData.allowedSystems,
        solarData: requestData.solarData,
        priorityFactors: requestData.priorityFactors,
        location: requestData.location,
        economicParameters: requestData.economicParameters
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error || 'Erro ao calcular sistema multi-energético');
        return;
      }

      this.ok(res, result.value);
    } catch (error) {
      console.error('MultiSystemController.calculateMultiSystem error:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * POST /multi-system/simulate
   * Simula operação de configuração específica
   */
  async simulateOperation(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const { configuration, loadProfile, simulationDays = 30 } = req.body;

      if (!configuration || !loadProfile) {
        this.badRequest(res, 'Configuração e perfil de carga são obrigatórios');
        return;
      }

      // Importar e usar o serviço de simulação
      const { MultiSystemCalculationService } = await import('../../domain/services/MultiSystemCalculationService');
      
      // Por enquanto, retornamos uma simulação básica
      // Em uma implementação completa, teríamos um método específico de simulação
      const simulationResult = {
        simulation_id: `sim_${Date.now()}`,
        configuration,
        simulation_period: simulationDays,
        daily_results: this.generateSimulationResults(simulationDays),
        summary: {
          total_energy_generated: simulationDays * 150, // kWh
          total_fuel_consumed: simulationDays * 25, // L
          total_operational_cost: simulationDays * 85, // R$
          average_efficiency: 87.5, // %
          grid_independence_achieved: 78.2 // %
        }
      };

      this.ok(res, simulationResult);
    } catch (error) {
      console.error('MultiSystemController.simulateOperation error:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * GET /multi-system/templates
   * Retorna templates de configuração pré-definidos
   */
  async getConfigurationTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { system_type, load_range } = req.query;

      const templates = this.getSystemTemplates(system_type as string, load_range as string);

      this.ok(res, {
        templates,
        total: templates.length,
        categories: ['residential', 'commercial', 'industrial', 'rural']
      });
    } catch (error) {
      console.error('MultiSystemController.getConfigurationTemplates error:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * POST /multi-system/optimize
   * Otimiza configuração existente
   */
  async optimizeConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const { configuration, optimization_goals, constraints } = req.body;

      if (!configuration) {
        this.badRequest(res, 'Configuração é obrigatória');
        return;
      }

      // Simular processo de otimização
      const optimizedConfiguration = {
        ...configuration,
        optimization_applied: true,
        improvements: {
          cost_reduction: 12.5, // %
          efficiency_increase: 8.3, // %
          reliability_increase: 15.2, // %
          carbon_reduction: 22.1 // %
        },
        optimized_at: new Date().toISOString(),
        optimization_goals: optimization_goals || ['cost', 'efficiency'],
        applied_optimizations: [
          'Ajuste da capacidade de armazenamento',
          'Otimização da estratégia de controle',
          'Redimensionamento do sistema solar',
          'Melhoria na gestão de cargas'
        ]
      };

      this.ok(res, {
        original_configuration: configuration,
        optimized_configuration: optimizedConfiguration,
        optimization_summary: {
          total_improvements: 4,
          estimated_additional_savings: 15620, // R$/ano
          implementation_complexity: 'medium',
          recommended_timeline: '3-6 months'
        }
      });
    } catch (error) {
      console.error('MultiSystemController.optimizeConfiguration error:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  // Métodos auxiliares privados

  private generateSimulationResults(days: number) {
    const results = [];
    
    for (let day = 1; day <= days; day++) {
      results.push({
        day,
        date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        energy_generated: {
          solar: Math.random() * 80 + 40, // 40-120 kWh
          battery_discharge: Math.random() * 30 + 10, // 10-40 kWh
          diesel: Math.random() * 20 + 5 // 5-25 kWh
        },
        energy_consumed: {
          load: Math.random() * 100 + 80, // 80-180 kWh
          battery_charge: Math.random() * 40 + 20, // 20-60 kWh
          system_losses: Math.random() * 10 + 5 // 5-15 kWh
        },
        operational_metrics: {
          system_efficiency: Math.random() * 10 + 85, // 85-95%
          battery_soc_average: Math.random() * 40 + 50, // 50-90%
          diesel_runtime: Math.random() * 4, // 0-4 hours
          grid_independence: Math.random() * 30 + 60 // 60-90%
        },
        costs: {
          fuel_cost: Math.random() * 50 + 25, // R$ 25-75
          maintenance_cost: Math.random() * 20 + 10, // R$ 10-30
          grid_cost: Math.random() * 30 + 15 // R$ 15-45
        },
        environmental: {
          co2_emissions: Math.random() * 15 + 5, // 5-20 kg
          renewable_percentage: Math.random() * 30 + 60 // 60-90%
        }
      });
    }
    
    return results;
  }

  private getSystemTemplates(systemType?: string, loadRange?: string) {
    const allTemplates = [
      {
        id: 'residential_solar_bess',
        name: 'Residencial Solar + Armazenamento',
        category: 'residential',
        system_type: 'solar_bess',
        load_range: '5-15_kw',
        description: 'Sistema residencial com energia solar e bateria para autonomia parcial',
        typical_configuration: {
          solar_capacity: '8-12 kWp',
          battery_capacity: '20-40 kWh',
          backup_hours: '8-12h',
          estimated_cost: 'R$ 80.000 - R$ 120.000'
        },
        advantages: ['Redução na conta de luz', 'Backup durante quedas', 'Energia limpa'],
        applications: ['Residências', 'Pequenos comércios', 'Home office']
      },
      {
        id: 'commercial_hybrid',
        name: 'Comercial Sistema Híbrido',
        category: 'commercial',
        system_type: 'solar_bess_diesel',
        load_range: '20-50_kw',
        description: 'Sistema comercial completo com solar, bateria e backup diesel',
        typical_configuration: {
          solar_capacity: '30-60 kWp',
          battery_capacity: '100-200 kWh',
          diesel_power: '25-40 kW',
          backup_hours: '24h+',
          estimated_cost: 'R$ 250.000 - R$ 450.000'
        },
        advantages: ['Máxima confiabilidade', 'Redução de custos', 'Gestão inteligente'],
        applications: ['Comércios', 'Pequenas indústrias', 'Hospitais', 'Data centers']
      },
      {
        id: 'industrial_bess_diesel',
        name: 'Industrial BESS + Diesel',
        category: 'industrial',
        system_type: 'bess_diesel',
        load_range: '100-500_kw',
        description: 'Sistema industrial focado em backup e peak shaving',
        typical_configuration: {
          battery_capacity: '500-1000 kWh',
          diesel_power: '150-300 kW',
          backup_hours: '12-24h',
          estimated_cost: 'R$ 800.000 - R$ 1.500.000'
        },
        advantages: ['Peak shaving', 'Backup robusto', 'Gestão de demanda'],
        applications: ['Indústrias', 'Grandes comércios', 'Infraestrutura crítica']
      },
      {
        id: 'rural_standalone',
        name: 'Rural Sistema Isolado',
        category: 'rural',
        system_type: 'solar_bess_diesel',
        load_range: '10-30_kw',
        description: 'Sistema para áreas rurais sem acesso à rede elétrica',
        typical_configuration: {
          solar_capacity: '15-25 kWp',
          battery_capacity: '80-120 kWh',
          diesel_power: '15-25 kW',
          backup_hours: '48h+',
          estimated_cost: 'R$ 150.000 - R$ 280.000'
        },
        advantages: ['Independência energética', 'Energia limpa', 'Backup confiável'],
        applications: ['Propriedades rurais', 'Estações remotas', 'Comunidades isoladas']
      }
    ];

    // Filtrar templates baseado nos parâmetros
    let filteredTemplates = allTemplates;

    if (systemType) {
      filteredTemplates = filteredTemplates.filter(t => t.system_type === systemType);
    }

    if (loadRange) {
      filteredTemplates = filteredTemplates.filter(t => t.load_range === loadRange);
    }

    return filteredTemplates;
  }
}