import { Coordinates } from "../value-objects/Coordinates";
import { CalculationLogger } from "./CalculationLogger";

export interface IrradiationData {
  monthly: number[];
  annual: number;
}

export interface SolarSystemParams {
  potenciaNominal: number; // kWp
  area: number; // m²
  eficiencia: number; // %
  perdas: number; // %
  inclinacao: number; // graus
  orientacao: number; // graus (azimute)
}

export class SolarCalculationService {
  /**
   * Calcula a geração mensal de energia
   */
  static calculateMonthlyGeneration(
    systemParams: SolarSystemParams,
    irradiationData: IrradiationData,
    coordinates: Coordinates,
    logger?: CalculationLogger
  ): number[] {
    const { potenciaNominal, eficiencia, perdas } = systemParams;
    
    logger?.info('Solar', 'Iniciando cálculo de geração mensal', {
      potenciaNominal,
      eficiencia,
      perdas,
      latitude: coordinates.getLatitude(),
      longitude: coordinates.getLongitude(),
      irradiacaoMensal: irradiationData.monthly
    });
    
    // Fator de correção baseado na localização (simplificado)
    const latitudeFactor = this.getLatitudeFactor(coordinates.getLatitude());
    logger?.calculation('Solar', 'Fator de correção por latitude calculado', 
      `getLatitudeFactor(${coordinates.getLatitude()})`, { latitudeFactor });
    
    // Eficiência do sistema considerando perdas
    const systemEfficiency = (eficiencia / 100) * (1 - perdas / 100);
    logger?.calculation('Solar', 'Eficiência do sistema calculada', 
      `(${eficiencia} / 100) × (1 - ${perdas} / 100)`, { systemEfficiency });
    
    const monthlyGeneration = irradiationData.monthly.map((irradiation, index) => {
      // Geração = Potência × Irradiação × Eficiência × Fator de correção
      const generation = potenciaNominal * irradiation * systemEfficiency * latitudeFactor * 30; // 30 dias médio
      logger?.calculation('Solar', `Geração do mês ${index + 1}`, 
        `${potenciaNominal} × ${irradiation} × ${systemEfficiency} × ${latitudeFactor} × 30`, 
        { mes: index + 1, irradiation, generation });
      return generation;
    });

    logger?.result('Solar', 'Geração mensal calculada', { 
      monthlyGeneration,
      totalAnual: monthlyGeneration.reduce((a, b) => a + b, 0)
    });
    
    return monthlyGeneration;
  }

  /**
   * Calcula a geração anual total
   */
  static calculateAnnualGeneration(monthlyGeneration: number[], logger?: CalculationLogger): number {
    logger?.info('Solar', 'Calculando geração anual total', { monthlyGeneration });
    
    const annualGeneration = monthlyGeneration.reduce((sum, monthly) => sum + monthly, 0);
    
    logger?.calculation('Solar', 'Geração anual total calculada', 
      `soma(${monthlyGeneration.join(' + ')})`, { annualGeneration });
    
    logger?.result('Solar', 'Geração anual finalizada', { 
      annualGeneration,
      unidade: 'kWh/ano'
    });
    
    return annualGeneration;
  }

  /**
   * Calcula o número ideal de módulos
   */
  static calculateOptimalModuleCount(
    targetPower: number, // kWp
    modulePower: number, // Wp
    availableArea: number, // m²
    moduleArea: number // m² por módulo
  ): { moduleCount: number; totalPower: number; areaUsed: number } {
    // Módulos necessários para atingir a potência
    const modulesByPower = Math.ceil((targetPower * 1000) / modulePower);
    
    // Módulos que cabem na área disponível
    const modulesByArea = Math.floor(availableArea / moduleArea);
    
    // Usar o menor dos dois
    const optimalCount = Math.min(modulesByPower, modulesByArea);
    
    return {
      moduleCount: optimalCount,
      totalPower: (optimalCount * modulePower) / 1000, // kWp
      areaUsed: optimalCount * moduleArea
    };
  }

  /**
   * Calcula perdas por sombreamento
   */
  static calculateShadingLosses(
    coordinates: Coordinates,
    obstacles: Array<{ height: number; distance: number; azimuth: number }>
  ): number {
    let totalLoss = 0;

    obstacles.forEach(obstacle => {
      // Cálculo simplificado do ângulo de sombreamento
      const shadingAngle = Math.atan(obstacle.height / obstacle.distance) * (180 / Math.PI);
      
      // Perda baseada no ângulo e orientação
      const orientationFactor = this.getOrientationFactor(obstacle.azimuth);
      const loss = (shadingAngle / 90) * orientationFactor * 100;
      
      totalLoss += Math.min(loss, 50); // Máximo 50% de perda por obstáculo
    });

    return Math.min(totalLoss, 80); // Máximo 80% de perda total
  }

  private static getLatitudeFactor(latitude: number): number {
    // Fator de correção simplificado baseado na latitude
    const absLatitude = Math.abs(latitude);
    if (absLatitude <= 10) return 1.0;
    if (absLatitude <= 20) return 0.98;
    if (absLatitude <= 30) return 0.95;
    return 0.90;
  }

  private static getOrientationFactor(azimuth: number): number {
    // Norte = 0°, Sul = 180°
    const deviationFromSouth = Math.abs(180 - azimuth);
    return Math.max(0.3, 1 - (deviationFromSouth / 180) * 0.7);
  }
}