// Cálculos padronizados para evitar inconsistências entre resumo e resultado
import { calculateSystemEfficiency, SystemLosses } from './pvDimensioning';

export interface SystemCalculationInputs {
  // Módulos
  numeroModulos: number;
  potenciaModulo: number; // W
  
  // Dados solares
  irradiacaoMensal: number[]; // kWh/m²/dia para cada mês
  
  // Sistema
  eficienciaSistema?: number; // % (deprecated, use systemLosses)
  systemLosses?: SystemLosses;
  dimensionamentoPercentual?: number; // %
  
  // Consumo (para cálculo automático quando necessário)
  consumoAnual?: number; // kWh
  
  // Dados PVGIS/PVLIB opcionais para cálculos mais precisos
  latitude?: number;
  longitude?: number;
  orientacao?: number; // graus (0° = Norte)
  inclinacao?: number; // graus
}

export interface SystemCalculationResults {
  potenciaPico: number; // kWp
  numeroModulos: number;
  areaEstimada: number; // m²
  geracaoEstimadaAnual: number; // kWh/ano
  geracaoEstimadaMensal: number[]; // kWh/mês para cada mês
  irradiacaoMediaAnual: number; // kWh/m²/dia
  coberturaConsumo?: number; // %
  usedPVLIB?: boolean; // Se usou cálculos PVLIB mais precisos
}

export class SystemCalculations {
  // Constantes padronizadas
  private static readonly AREA_POR_MODULO = 2.5; // m² por módulo
  private static readonly DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  /**
   * Calcula automaticamente o número de módulos baseado no consumo anual
   */
  static calculateModulesFromConsumption(
    consumoAnual: number,
    potenciaModulo: number,
    irradiacaoMensal: number[],
    eficienciaReal: number,
    dimensionamentoPercentual: number = 100
  ): number {
    const irradiacaoMediaAnual = irradiacaoMensal.reduce((a, b) => a + b, 0) / 12;
    const eficienciaDecimal = eficienciaReal / 100;
    const fatorDimensionamento = dimensionamentoPercentual / 100;
    
    const consumoMedioDiario = consumoAnual / 365;
    const irradiacaoEfetiva = irradiacaoMediaAnual * eficienciaDecimal;
    const potenciaPicoNecessaria = (consumoMedioDiario / irradiacaoEfetiva) * fatorDimensionamento;
    
    return Math.ceil((potenciaPicoNecessaria * 1000) / potenciaModulo);
  }

  /**
   * Executa todos os cálculos do sistema de forma padronizada
   */
  static async calculate(inputs: SystemCalculationInputs): Promise<SystemCalculationResults> {
    let { numeroModulos, potenciaModulo, irradiacaoMensal, eficienciaSistema, systemLosses, dimensionamentoPercentual = 100, consumoAnual, latitude, longitude, orientacao, inclinacao } = inputs;
    
    // Calcular eficiência real a partir das perdas específicas
    const eficienciaReal = calculateSystemEfficiency(systemLosses, eficienciaSistema || 85);
    
    // Se não há módulos definidos, calcular baseado no consumo
    if (numeroModulos === 0 && consumoAnual && consumoAnual > 0) {
      numeroModulos = this.calculateModulesFromConsumption(
        consumoAnual,
        potenciaModulo,
        irradiacaoMensal,
        eficienciaReal,
        dimensionamentoPercentual
      );
    }
    
    // Cálculos básicos
    const potenciaPico = (numeroModulos * potenciaModulo) / 1000; // kWp
    const areaEstimada = numeroModulos * this.AREA_POR_MODULO; // m²
    const irradiacaoMediaAnual = irradiacaoMensal.reduce((a, b) => a + b, 0) / 12; // kWh/m²/dia
    const eficienciaDecimal = eficienciaReal / 100;
    
    let geracaoEstimadaAnual: number;
    let geracaoEstimadaMensal: number[];
    let usedPVLIB = false;
    
    // Se temos dados de localização, usar PVLIB para maior precisão
    if (latitude !== undefined && longitude !== undefined && 
        orientacao !== undefined && inclinacao !== undefined) {
      
      try {
        const pvlibResult = await this.calculateWithPVLIB({
          latitude,
          longitude,
          surface_tilt: inclinacao,
          surface_azimuth: orientacao,
          module_power: potenciaModulo,
          num_modules: numeroModulos,
          inverter_efficiency: 0.96,
          system_losses: (100 - eficienciaReal) / 100
        });
        
        geracaoEstimadaAnual = pvlibResult.annual_energy;
        geracaoEstimadaMensal = pvlibResult.monthly_energy;
        usedPVLIB = true;
      } catch (error) {
        // Fallback para cálculo PVGIS
        geracaoEstimadaMensal = this.calculateWithPVGIS(potenciaPico, irradiacaoMensal, eficienciaDecimal);
        geracaoEstimadaAnual = geracaoEstimadaMensal.reduce((a, b) => a + b, 0);
      }
    } else {
      // Usar cálculo PVGIS tradicional
      geracaoEstimadaMensal = this.calculateWithPVGIS(potenciaPico, irradiacaoMensal, eficienciaDecimal);
      geracaoEstimadaAnual = geracaoEstimadaMensal.reduce((a, b) => a + b, 0);
    }
    
    // Cobertura do consumo (se fornecido)
    const coberturaConsumo = consumoAnual ? (geracaoEstimadaAnual / consumoAnual) * 100 : undefined;
    
    return {
      potenciaPico,
      numeroModulos,
      areaEstimada,
      geracaoEstimadaAnual,
      geracaoEstimadaMensal,
      irradiacaoMediaAnual,
      coberturaConsumo,
      usedPVLIB
    };
  }

  /**
   * Cálculo tradicional usando dados PVGIS
   */
  private static calculateWithPVGIS(potenciaPico: number, irradiacaoMensal: number[], eficienciaDecimal: number): number[] {
    return irradiacaoMensal.map((irradiacao, index) => {
      const diasMes = this.DIAS_POR_MES[index];
      return potenciaPico * irradiacao * diasMes * eficienciaDecimal;
    });
  }

  /**
   * Cálculo usando serviço PVLIB para maior precisão
   */
  private static async calculateWithPVLIB(systemParams: {
    latitude: number;
    longitude: number;
    surface_tilt: number;
    surface_azimuth: number;
    module_power: number;
    num_modules: number;
    inverter_efficiency: number;
    system_losses: number;
  }): Promise<{ annual_energy: number; monthly_energy: number[] }> {
    const response = await fetch('http://localhost:8110/pv-system', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: {
          latitude: systemParams.latitude,
          longitude: systemParams.longitude,
          altitude: 0,
          timezone: 'America/Sao_Paulo'
        },
        surface_tilt: systemParams.surface_tilt,
        surface_azimuth: systemParams.surface_azimuth,
        module_power: systemParams.module_power,
        num_modules: systemParams.num_modules,
        inverter_efficiency: systemParams.inverter_efficiency,
        system_losses: systemParams.system_losses
      }),
    });

    if (!response.ok) {
      throw new Error(`PVLIB API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      annual_energy: data.annual_energy,
      monthly_energy: data.monthly_energy
    };
  }

  /**
   * Calcula apenas a geração estimada baseada em parâmetros básicos
   */
  static calculateGeneration(
    potenciaPico: number,
    irradiacaoMensal: number[],
    eficienciaReal: number
  ): { mensal: number[], anual: number } {
    const eficienciaDecimal = eficienciaReal / 100;
    
    const mensal = irradiacaoMensal.map((irradiacao, index) => {
      const diasMes = this.DIAS_POR_MES[index];
      return potenciaPico * irradiacao * diasMes * eficienciaDecimal;
    });
    
    const anual = mensal.reduce((a, b) => a + b, 0);
    
    return { mensal, anual };
  }
}
