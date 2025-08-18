import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CalculateBessSystemUseCase } from '@/application/use-cases/bess/CalculateBessSystemUseCase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class BessController extends BaseController {
  constructor(
    private calculateBessSystemUseCase: CalculateBessSystemUseCase
  ) {
    super();
  }

  async calculateBessSystem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      if (!projectId) {
        this.badRequest(res, 'ID do projeto é obrigatório');
        return;
      }

      const {
        loadProfile,
        systemParams,
        simulationDays
      } = req.body;

      // Validações básicas
      if (!loadProfile) {
        this.badRequest(res, 'Perfil de carga é obrigatório');
        return;
      }

      if (!loadProfile.hourly_consumption || !Array.isArray(loadProfile.hourly_consumption)) {
        this.badRequest(res, 'Consumo horário deve ser um array');
        return;
      }

      if (loadProfile.hourly_consumption.length !== 24) {
        this.badRequest(res, 'Consumo horário deve ter 24 valores');
        return;
      }

      if (!loadProfile.daily_consumption || loadProfile.daily_consumption <= 0) {
        this.badRequest(res, 'Consumo diário deve ser maior que zero');
        return;
      }

      if (!loadProfile.peak_power || loadProfile.peak_power <= 0) {
        this.badRequest(res, 'Potência de pico deve ser maior que zero');
        return;
      }

      if (!loadProfile.essential_loads || loadProfile.essential_loads <= 0) {
        this.badRequest(res, 'Cargas essenciais devem ser maiores que zero');
        return;
      }

      const result = await this.calculateBessSystemUseCase.execute({
        projectId,
        userId,
        loadProfile,
        systemParams,
        simulationDays
      });

      if (result.isSuccess) {
        this.ok(res, result.value);
      } else {
        this.badRequest(res, result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async getBatteryDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      // Banco de dados de baterias (poderia vir de um repositório)
      const batteryDatabase = [
        {
          id: 'tesla-powerwall-2',
          manufacturer: 'Tesla',
          model: 'Powerwall 2',
          capacity: 13.5,
          voltage: 48,
          current: 281,
          cycles: 6000,
          efficiency: 95,
          depth_of_discharge: 95,
          weight: 114,
          dimensions: { length: 1150, width: 755, height: 155 },
          cost: 45000,
          warranty_years: 10,
          features: ['App Control', 'Storm Watch', 'Grid Services'],
          installation_type: 'Wall Mount'
        },
        {
          id: 'byd-battery-box-premium',
          manufacturer: 'BYD',
          model: 'Battery-Box Premium LVS',
          capacity: 10,
          voltage: 51.2,
          current: 195,
          cycles: 8000,
          efficiency: 96,
          depth_of_discharge: 90,
          weight: 85,
          dimensions: { length: 600, width: 400, height: 200 },
          cost: 32000,
          warranty_years: 10,
          features: ['Modular Design', 'CAN Communication', 'High Cycle Life'],
          installation_type: 'Floor/Wall Mount'
        },
        {
          id: 'pylontech-us3000c',
          manufacturer: 'Pylontech',
          model: 'US3000C',
          capacity: 5.12,
          voltage: 51.2,
          current: 100,
          cycles: 6000,
          efficiency: 94,
          depth_of_discharge: 90,
          weight: 45,
          dimensions: { length: 440, width: 420, height: 130 },
          cost: 18000,
          warranty_years: 5,
          features: ['Stackable', 'BMS Built-in', 'RS485/CAN'],
          installation_type: 'Cabinet Mount'
        },
        {
          id: 'sonnen-sonnenbatterie-10',
          manufacturer: 'Sonnen',
          model: 'SonnenBatterie 10',
          capacity: 20,
          voltage: 48,
          current: 417,
          cycles: 5000,
          efficiency: 93,
          depth_of_discharge: 80,
          weight: 180,
          dimensions: { length: 800, width: 600, height: 300 },
          cost: 65000,
          warranty_years: 10,
          features: ['Smart Energy Management', 'Virtual Power Plant', 'Flat Pack Design'],
          installation_type: 'Floor Mount'
        }
      ];

      this.ok(res, {
        batteries: batteryDatabase,
        total: batteryDatabase.length
      });
    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async getLoadProfileTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { profileType } = req.query;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      // Templates de perfil de carga
      const templates = {
        residential: {
          name: 'Residencial Padrão',
          description: 'Perfil típico de consumo residencial',
          hourly_consumption: [
            0.5, 0.4, 0.3, 0.3, 0.4, 0.8, 1.2, 1.5, 1.8, 2.0, 2.2, 2.5,
            2.8, 2.6, 2.4, 2.8, 3.2, 3.8, 4.2, 3.8, 3.2, 2.4, 1.6, 0.8
          ],
          daily_consumption: 48.5,
          peak_power: 4.5,
          essential_loads: 2.0,
          backup_duration: 8
        },
        commercial: {
          name: 'Comercial',
          description: 'Perfil típico de estabelecimento comercial',
          hourly_consumption: [
            1.0, 0.8, 0.6, 0.5, 0.8, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0,
            15.0, 14.0, 13.0, 12.0, 11.0, 10.0, 8.0, 6.0, 4.0, 3.0, 2.0, 1.5
          ],
          daily_consumption: 156.2,
          peak_power: 16.0,
          essential_loads: 5.0,
          backup_duration: 4
        },
        industrial: {
          name: 'Industrial',
          description: 'Perfil típico de consumo industrial',
          hourly_consumption: [
            15, 12, 10, 8, 12, 25, 45, 60, 75, 85, 90, 95,
            100, 95, 90, 88, 85, 80, 70, 55, 45, 35, 25, 20
          ],
          daily_consumption: 1285,
          peak_power: 120,
          essential_loads: 30,
          backup_duration: 2
        }
      };

      if (profileType && templates[profileType as keyof typeof templates]) {
        this.ok(res, templates[profileType as keyof typeof templates]);
      } else {
        this.ok(res, {
          templates: Object.keys(templates).map(key => ({
            type: key,
            ...templates[key as keyof typeof templates]
          }))
        });
      }
    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async compareBatteryConfigurations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      const { configurations } = req.body;

      if (!configurations || !Array.isArray(configurations)) {
        this.badRequest(res, 'Lista de configurações é obrigatória');
        return;
      }

      if (configurations.length < 2 || configurations.length > 5) {
        this.badRequest(res, 'Deve comparar entre 2 e 5 configurações');
        return;
      }

      // Análise comparativa
      const comparison = {
        configurations: configurations.map((config: any, index: number) => ({
          id: index + 1,
          name: `${config.battery_specs.manufacturer} ${config.battery_specs.model}`,
          ...config,
          cost_per_kwh: config.system_cost / config.total_capacity,
          cost_per_kw: config.system_cost / config.total_power,
          roi_score: this.calculateROIScore(config),
          reliability_score: this.calculateReliabilityScore(config),
          efficiency_score: config.battery_specs.efficiency
        })),
        summary: {
          cheapest: null as any,
          best_roi: null as any,
          most_reliable: null as any,
          most_efficient: null as any
        }
      };

      // Encontrar a melhor em cada categoria
      comparison.summary.cheapest = comparison.configurations.reduce((prev, curr) => 
        prev.system_cost < curr.system_cost ? prev : curr
      );

      comparison.summary.best_roi = comparison.configurations.reduce((prev, curr) => 
        prev.roi_score > curr.roi_score ? prev : curr
      );

      comparison.summary.most_reliable = comparison.configurations.reduce((prev, curr) => 
        prev.reliability_score > curr.reliability_score ? prev : curr
      );

      comparison.summary.most_efficient = comparison.configurations.reduce((prev, curr) => 
        prev.efficiency_score > curr.efficiency_score ? prev : curr
      );

      this.ok(res, comparison);
    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  private calculateROIScore(config: any): number {
    // Score baseado no payback e vida útil
    const paybackScore = Math.max(0, 100 - (config.backup_time * 10));
    const lifetimeScore = config.system_lifetime * 5;
    const costScore = Math.max(0, 100 - ((config.system_cost / config.total_capacity) / 1000));
    
    return Math.round((paybackScore + lifetimeScore + costScore) / 3);
  }

  private calculateReliabilityScore(config: any): number {
    // Score baseado em ciclos de vida e eficiência
    const cycleScore = Math.min(100, (config.battery_specs.cycles / 10000) * 100);
    const efficiencyScore = config.battery_specs.efficiency;
    const dodScore = config.battery_specs.depth_of_discharge;
    
    return Math.round((cycleScore + efficiencyScore + dodScore) / 3);
  }
}