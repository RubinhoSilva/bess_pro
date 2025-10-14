import { Coordinates } from "../value-objects/Coordinates";
import { CalculationLogger } from "./CalculationLogger";
import { CalculationConstants } from "../constants/CalculationConstants";

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
    
    logger?.context('Solar', 'Iniciando cálculo de geração mensal', {
      potenciaNominal,
      eficiencia,
      perdas,
      latitude: coordinates.getLatitude(),
      longitude: coordinates.getLongitude(),
      irradiacaoMensal: irradiationData.monthly
    }, 'Este cálculo determina a geração de energia elétrica mensal de um sistema fotovoltaico considerando irradiação solar, eficiência do sistema e perdas operacionais.');
    
    // Fator de correção baseado na localização (simplificado)
    const latitudeFactor = this.getLatitudeFactor(coordinates.getLatitude());
    logger?.formula('Solar', 'Fator de correção por latitude', 
      'f_lat = 1 - (0.004 × |latitude|)',
      { latitude: coordinates.getLatitude() },
      latitudeFactor,
      {
        description: 'Fator de correção que considera a influência da latitude na eficiência dos painéis solares. Latitudes mais altas tendem a ter menor irradiação direta.',
        units: 'adimensional',
        references: ['CRESESB - Manual de Engenharia para Sistemas Fotovoltaicos', 'NBR 16274:2014']
      }
    );
    
    // Eficiência do sistema considerando perdas
    const systemEfficiency = (eficiencia / 100) * (1 - perdas / 100);
    logger?.formula('Solar', 'Eficiência líquida do sistema', 
      'η_sistema = (η_nominal / 100) × (1 - P_perdas / 100)',
      { 
        η_nominal: eficiencia, 
        P_perdas: perdas,
        η_nominal_decimal: eficiencia / 100,
        P_perdas_decimal: perdas / 100
      },
      systemEfficiency,
      {
        description: 'Eficiência real do sistema considerando a eficiência nominal dos painéis e as perdas do sistema (cabeamento, inversor, sujeira, temperatura, etc.)',
        units: 'decimal (0-1)',
        references: ['IEC 61724-1:2017 - Photovoltaic system performance', 'NREL PVWatts Calculator']
      }
    );
    
    const monthlyGeneration = irradiationData.monthly.map((irradiation, index) => {
      const diasMes = this.getDaysInMonth(index);
      
      // Geração = Potência × Irradiação × Eficiência × Fator de correção × Dias do mês
      const generation = potenciaNominal * irradiation * systemEfficiency * latitudeFactor * diasMes;
      
      logger?.formula('Solar', `Geração mensal - ${this.getMonthName(index)}`, 
        'E_mensal = P_nominal × H_solar × η_sistema × f_lat × dias_mês',
        {
          P_nominal: potenciaNominal,
          H_solar: irradiation,
          η_sistema: systemEfficiency,
          f_lat: latitudeFactor,
          dias_mês: diasMes,
          mês: this.getMonthName(index)
        },
        generation,
        {
          description: 'Cálculo da energia gerada mensalmente pelo sistema fotovoltaico. A irradiação solar (H) é multiplicada pela potência nominal, eficiência do sistema e fator de correção geográfica.',
          units: 'kWh',
          references: ['ABNT NBR 16274:2014 - Sistemas fotovoltaicos conectados à rede', 'IEA PVPS Task 2']
        }
      );
      
      return generation;
    });

    logger?.result('Solar', 'Geração mensal calculada', { 
      monthlyGeneration,
      totalAnual: monthlyGeneration.reduce((a, b) => a + b, 0)
    });
    
    return monthlyGeneration;
  }

  /**
   * Obtém o número de dias do mês (considerando ano não bissexto)
   */
  private static getDaysInMonth(monthIndex: number): number {
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysPerMonth[monthIndex] || 30;
  }

  /**
   * Obtém o nome do mês em português
   */
  private static getMonthName(monthIndex: number): string {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[monthIndex] || `Mês ${monthIndex + 1}`;
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
      
      totalLoss += Math.min(loss, CalculationConstants.VALIDATION.MAX_SHADING_LOSS_PER_OBSTACLE);
    });

    return Math.min(totalLoss, CalculationConstants.VALIDATION.MAX_TOTAL_SHADING_LOSS);
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

  /**
   * Calcula resumo detalhado do sistema fotovoltaico
   */
  static calculateSystemSummary(
    systemParams: SolarSystemParams, 
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