import { Result } from '@/application/common/Result';
import { IUseCase } from '@/application/common/IUseCase';

interface GetBatteryDatabaseRequest {
  userId: string;
}

interface BatterySpec {
  id: string;
  manufacturer: string;
  model: string;
  capacity: number;
  voltage: number;
  current: number;
  cycles: number;
  efficiency: number;
  depth_of_discharge: number;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  cost: number;
  warranty_years: number;
  features: string[];
  installation_type: string;
}

interface GetBatteryDatabaseResponse {
  batteries: BatterySpec[];
  total: number;
}

export class GetBatteryDatabaseUseCase implements IUseCase<GetBatteryDatabaseRequest, Result<GetBatteryDatabaseResponse>> {
  async execute(request: GetBatteryDatabaseRequest): Promise<Result<GetBatteryDatabaseResponse>> {
    try {
      // Banco de dados de baterias (poderia vir de um repositório)
      const batteryDatabase: BatterySpec[] = [
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

      const response: GetBatteryDatabaseResponse = {
        batteries: batteryDatabase,
        total: batteryDatabase.length
      };

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro ao obter banco de dados de baterias: ${error.message}`);
    }
  }
}