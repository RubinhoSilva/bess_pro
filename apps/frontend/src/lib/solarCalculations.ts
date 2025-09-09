// Cálculos avançados para sistemas fotovoltaicos
import { SolarSystemService } from '@/lib/solarSystemService';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  timezone?: string;
  city?: string;
  state?: string;
}

export interface WeatherData {
  temperatura: number[];  // 12 meses
  umidade: number[];      // 12 meses
  ventoVelocidade: number[]; // 12 meses
  nebulosidade: number[]; // 12 meses (0-1)
}

export interface SolarCalculationOptions {
  location: LocationData;
  tilt: number;           // Inclinação dos módulos (graus)
  azimuth: number;        // Azimute (graus, 180 = Sul)
  weatherData?: WeatherData;
  considerarSombreamento: boolean;
  sombreamento?: number[];  // Percentual por mês
  considerarSujeira: boolean;
  sujeira?: number;       // Percentual anual
  outrasPerdasPercentual?: number; // Outras perdas em percentual
  // Perdas específicas do usuário
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaInversor?: number;
}

export interface DetailedSolarResults {
  irradiacaoMensal: number[];           // kWh/m²/mês (base horizontal)
  irradiacaoInclinada: number[];        // Corrigida para inclinação (PVLIB)
  fatorTemperatura: number[];           // Fator de correção por temperatura
  perdas: {
    sombreamento: number[];
    mismatch: number[];
    cabeamento: number[];
    sujeira: number[];
    inversor: number[];
    outras?: number[];
    total: number[];
  };
  geracaoEstimada: {
    mensal: number[];      // kWh/mês
    anual: number;         // kWh/ano
    diarioMedio: number;   // kWh/dia
  };
  performance: {
    prMedio: number;       // Performance Ratio médio
    yieldEspecifico: number; // kWh/kWp/ano
    fatorCapacidade: number; // %
  };
  source: 'pvlib' | 'estimated';  // Fonte dos dados
}

export class AdvancedSolarCalculator {
  
  // Dados de irradiação solar do Brasil por região (valores médios)
  private static readonly IRRADIATION_DATA: Record<string, number[]> = {
    'AC': [5.8, 5.9, 6.0, 5.8, 5.5, 5.2, 5.3, 5.6, 5.8, 6.0, 5.9, 5.8], // Acre
    'AL': [6.2, 6.0, 5.8, 5.5, 5.2, 4.8, 4.9, 5.3, 5.7, 6.0, 6.1, 6.2], // Alagoas
    'AP': [5.5, 5.7, 5.8, 5.6, 5.3, 5.0, 5.1, 5.4, 5.6, 5.8, 5.7, 5.6], // Amapá
    'AM': [5.2, 5.4, 5.5, 5.3, 5.0, 4.7, 4.8, 5.1, 5.3, 5.5, 5.4, 5.3], // Amazonas
    'BA': [6.8, 6.5, 6.2, 5.8, 5.4, 5.0, 5.2, 5.6, 6.0, 6.4, 6.6, 6.8], // Bahia
    'CE': [6.5, 6.2, 5.9, 5.5, 5.1, 4.7, 4.9, 5.3, 5.7, 6.1, 6.3, 6.5], // Ceará
    'DF': [6.0, 5.8, 5.6, 5.2, 4.8, 4.5, 4.7, 5.1, 5.5, 5.8, 5.9, 6.0], // Distrito Federal
    'ES': [5.8, 5.6, 5.4, 5.0, 4.6, 4.2, 4.4, 4.8, 5.2, 5.5, 5.7, 5.8], // Espírito Santo
    'GO': [6.2, 6.0, 5.8, 5.4, 5.0, 4.6, 4.8, 5.2, 5.6, 5.9, 6.1, 6.2], // Goiás
    'MA': [6.0, 5.8, 5.6, 5.2, 4.8, 4.4, 4.6, 5.0, 5.4, 5.7, 5.9, 6.0], // Maranhão
    'MT': [6.5, 6.3, 6.1, 5.7, 5.3, 4.9, 5.1, 5.5, 5.9, 6.2, 6.4, 6.5], // Mato Grosso
    'MS': [6.3, 6.1, 5.9, 5.5, 5.1, 4.7, 4.9, 5.3, 5.7, 6.0, 6.2, 6.3], // Mato Grosso do Sul
    'MG': [6.0, 5.8, 5.6, 5.2, 4.8, 4.4, 4.6, 5.0, 5.4, 5.7, 5.9, 6.0], // Minas Gerais
    'PA': [5.5, 5.7, 5.8, 5.6, 5.3, 5.0, 5.1, 5.4, 5.6, 5.8, 5.7, 5.6], // Pará
    'PB': [6.3, 6.1, 5.9, 5.5, 5.1, 4.7, 4.9, 5.3, 5.7, 6.0, 6.2, 6.3], // Paraíba
    'PR': [5.2, 5.0, 4.8, 4.4, 4.0, 3.6, 3.8, 4.2, 4.6, 4.9, 5.1, 5.2], // Paraná
    'PE': [6.4, 6.2, 6.0, 5.6, 5.2, 4.8, 5.0, 5.4, 5.8, 6.1, 6.3, 6.4], // Pernambuco
    'PI': [6.1, 5.9, 5.7, 5.3, 4.9, 4.5, 4.7, 5.1, 5.5, 5.8, 6.0, 6.1], // Piauí
    'RJ': [5.5, 5.3, 5.1, 4.7, 4.3, 3.9, 4.1, 4.5, 4.9, 5.2, 5.4, 5.5], // Rio de Janeiro
    'RN': [6.4, 6.2, 6.0, 5.6, 5.2, 4.8, 5.0, 5.4, 5.8, 6.1, 6.3, 6.4], // Rio Grande do Norte
    'RS': [5.8, 5.6, 5.4, 5.0, 4.6, 4.2, 4.4, 4.8, 5.2, 5.5, 5.7, 5.8], // Rio Grande do Sul
    'RO': [5.3, 5.5, 5.6, 5.4, 5.1, 4.8, 4.9, 5.2, 5.4, 5.6, 5.5, 5.4], // Rondônia
    'RR': [5.0, 5.2, 5.3, 5.1, 4.8, 4.5, 4.6, 4.9, 5.1, 5.3, 5.2, 5.1], // Roraima
    'SC': [5.0, 4.8, 4.6, 4.2, 3.8, 3.4, 3.6, 4.0, 4.4, 4.7, 4.9, 5.0], // Santa Catarina
    'SP': [5.8, 5.6, 5.4, 5.0, 4.6, 4.2, 4.4, 4.8, 5.2, 5.5, 5.7, 5.8], // São Paulo
    'SE': [6.1, 5.9, 5.7, 5.3, 4.9, 4.5, 4.7, 5.1, 5.5, 5.8, 6.0, 6.1], // Sergipe
    'TO': [6.0, 5.8, 5.6, 5.2, 4.8, 4.4, 4.6, 5.0, 5.4, 5.7, 5.9, 6.0], // Tocantins
  };

  // Temperaturas médias do Brasil por região
  private static readonly TEMPERATURE_DATA: Record<string, number[]> = {
    'SP': [24, 25, 24, 22, 19, 18, 17, 19, 21, 23, 24, 24], // São Paulo
    'RJ': [26, 27, 26, 24, 22, 21, 21, 22, 23, 25, 26, 26], // Rio de Janeiro
    'MG': [23, 24, 23, 21, 19, 18, 18, 20, 22, 23, 23, 23], // Minas Gerais
    'BA': [27, 28, 27, 26, 24, 23, 23, 24, 25, 26, 27, 27], // Bahia
    // Adicionar mais estados conforme necessário
  };

  static async calculateDetailedSolar(
    potenciaKw: number,
    options: SolarCalculationOptions,
    advancedResult?: any,
    irradiationData?: any
  ): Promise<DetailedSolarResults> {
    
    // Se temos dados avançados da API, usar eles
    if (advancedResult && advancedResult.perdas_detalhadas) {
      console.log('✅ Usando dados avançados da API Python');
      
      return {
        irradiacaoMensal: irradiationData?.irradiacaoMensal || this.getRegionalIrradiation(options.location),
        irradiacaoInclinada: irradiationData?.irradiacaoMensal || this.getRegionalIrradiation(options.location),
        fatorTemperatura: this.calculateTemperatureFactorsFromLocation(options.location),
        perdas: {
          sombreamento: advancedResult.perdas_detalhadas.sombreamento || Array(12).fill(3),
          mismatch: advancedResult.perdas_detalhadas.mismatch || Array(12).fill(2),
          cabeamento: advancedResult.perdas_detalhadas.cabeamento || Array(12).fill(2),
          sujeira: advancedResult.perdas_detalhadas.sujeira || Array(12).fill(5),
          inversor: advancedResult.perdas_detalhadas.inversor || Array(12).fill(3),
          outras: advancedResult.perdas_detalhadas.outras,
          total: advancedResult.perdas_detalhadas.total || Array(12).fill(20)
        },
        geracaoEstimada: {
          mensal: advancedResult.geracao_mensal || this.estimateMonthlyGeneration(advancedResult.energia_total_anual_kwh),
          anual: advancedResult.energia_total_anual_kwh,
          diarioMedio: advancedResult.energia_total_anual_kwh / 365
        },
        performance: {
          prMedio: advancedResult.pr_medio || 85,
          yieldEspecifico: advancedResult.yield_especifico || 1200,
          fatorCapacidade: advancedResult.fator_capacidade || 15
        },
        source: 'pvlib' as 'pvlib' | 'estimated'
      };
    }
    
    // Fallback para cálculo antigo
    const { location, tilt, azimuth } = options;
    
    try {
      // Tentar usar PVLIB para dados precisos
      const pvlibResults = await this.calculateWithPVLIB(
        potenciaKw,
        location,
        tilt,
        azimuth,
        options
      );
      console.log('✅ PVLIB Avançado usado com sucesso para análise solar detalhada');
      return pvlibResults;
    } catch (error) {
      console.warn('⚠️ PVLIB não disponível, usando cálculos estimados:', error);
      // Fallback para cálculos estimados
      return await this.calculateWithEstimatedData(potenciaKw, options);
    }
  }

  /**
   * Cálculo usando serviço PVLIB para máxima precisão
   */
  private static async calculateWithPVLIB(
    potenciaKw: number,
    location: LocationData,
    tilt: number,
    azimuth: number,
    options: SolarCalculationOptions
  ): Promise<DetailedSolarResults> {
    
    console.log('🔄 PVLIB: Tentando usar serviço PVLIB completo...');
    
    // Estimar irradiação horizontal base (para referência)
    const stateCode = location.state || 'SP';
    const baseIrradiation = this.IRRADIATION_DATA[stateCode] || this.IRRADIATION_DATA['SP'];
    
    // Tentar obter irradiação corrigida da nossa API Python primeiro
    let irradiacaoInclinada: number[];
    try {
      console.log('📡 PVLIB: Chamando nossa API Python para correção de irradiação...');
      const correctionResult = await SolarSystemService.calculateIrradiationCorrection({
        baseIrradiation,
        latitude: location.latitude,
        tilt,
        azimuth
      });
      
      irradiacaoInclinada = correctionResult.irradiacaoCorrigida;
      console.log('✅ PVLIB: Usando irradiação corrigida da nossa API Python:', irradiacaoInclinada);
    } catch (error) {
      console.warn('⚠️ PVLIB: Nossa API Python não disponível, tentando serviço PVLIB original...');
      
      // Fallback para o serviço PVLIB original
      try {
        const response = await fetch('http://localhost:8110/pv-system', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              altitude: location.altitude || 0,
              timezone: location.timezone || 'America/Sao_Paulo'
            },
            surface_tilt: tilt,
            surface_azimuth: azimuth,
            module_power: 550, // Assumindo módulos de 550W
            num_modules: Math.round((potenciaKw * 1000) / 550),
            inverter_efficiency: 0.96,
            system_losses: 0.14 // 14% perdas do sistema
          }),
        });

        if (!response.ok) {
          throw new Error(`PVLIB API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Calcular irradiação inclinada baseada na geração PVLIB
        const geracaoMensal = data.monthly_energy;
        irradiacaoInclinada = geracaoMensal.map((geracao: number) => {
          // Reverse engineering: geracao / (potencia * dias * eficiencia)
          const diasMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          return geracao / (potenciaKw * diasMes[geracaoMensal.indexOf(geracao)] * 0.86);
        });
        console.log('📊 PVLIB: Usando dados do serviço PVLIB original');
      } catch (pvlibError) {
        console.warn('⚠️ PVLIB: Serviço PVLIB original também não disponível, usando correção local');
        // Fallback final para correção local
        irradiacaoInclinada = await this.correctForTiltAndAzimuth(
          baseIrradiation,
          location.latitude,
          tilt,
          azimuth
        );
      }
    }
    
    // Calcular fatores de temperatura
    const temperatures = this.TEMPERATURE_DATA[stateCode] || this.TEMPERATURE_DATA['SP'];
    const fatorTemperatura = this.calculateTemperatureFactor(temperatures);
    
    // Calcular perdas detalhadas
    const perdas = this.calculateLosses(options, irradiacaoInclinada);
    
    // Calcular geração estimada com os dados corrigidos
    const geracaoMensal = irradiacaoInclinada.map((irr, month) => {
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
      const tempFactor = fatorTemperatura[month];
      const totalLossFactor = 1 - (perdas.total[month] / 100);
      
      return potenciaKw * irr * daysInMonth * tempFactor * totalLossFactor;
    });
    
    const geracaoAnual = geracaoMensal.reduce((sum, gen) => sum + gen, 0);
    const geracaoDiarioMedio = geracaoAnual / 365;
    
    // Métricas de performance
    const prMedio = this.calculatePerformanceRatio(geracaoMensal, irradiacaoInclinada, potenciaKw);
    const yieldEspecifico = geracaoAnual / potenciaKw;
    const fatorCapacidade = (geracaoAnual / (potenciaKw * 8760)) * 100;
    
    return {
      irradiacaoMensal: baseIrradiation,
      irradiacaoInclinada,
      fatorTemperatura,
      perdas,
      geracaoEstimada: {
        mensal: geracaoMensal,
        anual: geracaoAnual,
        diarioMedio: geracaoDiarioMedio
      },
      performance: {
        prMedio,
        yieldEspecifico,
        fatorCapacidade
      },
      source: 'pvlib'
    };
  }

  /**
   * Cálculo com dados estimados (fallback)
   */
  private static async calculateWithEstimatedData(
    potenciaKw: number,
    options: SolarCalculationOptions
  ): Promise<DetailedSolarResults> {
    
    const { location, tilt, azimuth } = options;
    
    // 1. Obter irradiação base para o estado
    const stateCode = location.state || 'SP';
    const baseIrradiation = this.IRRADIATION_DATA[stateCode] || this.IRRADIATION_DATA['SP'];
    
    // 2. Correção para inclinação e azimute
    const irradiacaoInclinada = await this.correctForTiltAndAzimuth(
      baseIrradiation,
      location.latitude,
      tilt,
      azimuth
    );
    
    // 3. Correção por temperatura
    const temperatures = this.TEMPERATURE_DATA[stateCode] || this.TEMPERATURE_DATA['SP'];
    const fatorTemperatura = this.calculateTemperatureFactor(temperatures);
    
    // 4. Calcular perdas
    const perdas = this.calculateLosses(options, irradiacaoInclinada);
    
    // 5. Geração estimada
    const geracaoMensal = irradiacaoInclinada.map((irr, month) => {
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
      const tempFactor = fatorTemperatura[month];
      const totalLossFactor = 1 - (perdas.total[month] / 100);
      
      return potenciaKw * irr * daysInMonth * tempFactor * totalLossFactor;
    });
    
    const geracaoAnual = geracaoMensal.reduce((sum, gen) => sum + gen, 0);
    const geracaoDiarioMedio = geracaoAnual / 365;
    
    // 6. Métricas de performance
    const prMedio = this.calculatePerformanceRatio(geracaoMensal, irradiacaoInclinada, potenciaKw);
    const yieldEspecifico = geracaoAnual / potenciaKw;
    const fatorCapacidade = (geracaoAnual / (potenciaKw * 8760)) * 100;
    
    return {
      irradiacaoMensal: baseIrradiation,
      irradiacaoInclinada,
      fatorTemperatura,
      perdas,
      geracaoEstimada: {
        mensal: geracaoMensal,
        anual: geracaoAnual,
        diarioMedio: geracaoDiarioMedio
      },
      performance: {
        prMedio,
        yieldEspecifico,
        fatorCapacidade
      },
      source: 'estimated'
    };
  }

  private static async correctForTiltAndAzimuth(
    baseIrradiation: number[],
    latitude: number,
    tilt: number,
    azimuth: number
  ): Promise<number[]> {
    console.log('🔄 Iniciando correção de inclinação com parâmetros:', { baseIrradiation, latitude, tilt, azimuth });
    
    try {
      // Tentar usar API Python primeiro
      console.log('📡 Chamando API Python para correção de irradiação...');
      const result = await SolarSystemService.calculateIrradiationCorrection({
        baseIrradiation,
        latitude,
        tilt,
        azimuth
      });
      
      console.log('✅ Usando irradiação corrigida da API Python:', result.irradiacaoCorrigida);
      return result.irradiacaoCorrigida;
    } catch (error) {
      console.warn('⚠️ API Python não disponível, usando cálculo local:', error);
      
      // Fallback para cálculo local
      return baseIrradiation.map((irr, month) => {
        // Fator de correção baseado em modelos simplificados
        // Em implementação real, usaria bibliotecas como pvlib
        
        const declinacao = this.calculateSolarDeclination(month);
        const anguloPerfil = this.calculateProfileAngle(latitude, declinacao, tilt);
        const fatorInclinacao = this.calculateTiltFactor(anguloPerfil, tilt);
        const fatorAzimute = this.calculateAzimuthFactor(azimuth);
        
        return irr * fatorInclinacao * fatorAzimute;
      });
    }
  }

  private static calculateSolarDeclination(month: number): number {
    // Declinação solar simplificada por mês
    const declinations = [-20.9, -13.0, -2.4, 9.4, 18.8, 23.1, 21.2, 13.5, 2.2, -9.6, -18.9, -23.0];
    return declinations[month] * (Math.PI / 180); // Converter para radianos
  }

  private static calculateProfileAngle(
    latitude: number,
    declination: number,
    tilt: number
  ): number {
    const latRad = latitude * (Math.PI / 180);
    const tiltRad = tilt * (Math.PI / 180);
    
    // Cálculo simplificado do ângulo de perfil
    return Math.acos(
      Math.sin(latRad - tiltRad) * Math.sin(declination) +
      Math.cos(latRad - tiltRad) * Math.cos(declination)
    );
  }

  private static calculateTiltFactor(profileAngle: number, tilt: number): number {
    // Fator de correção para inclinação (simplificado)
    const optimalTilt = Math.abs(profileAngle * (180 / Math.PI));
    const tiltDifference = Math.abs(tilt - optimalTilt);
    
    // Redução baseada na diferença do ângulo ótimo
    return Math.max(0.7, 1 - (tiltDifference * 0.005));
  }

  private static calculateAzimuthFactor(azimuth: number): number {
    // Fator de correção para azimute (Sul = 180° = fator 1.0)
    const azimuthDifference = Math.abs(azimuth - 180);
    return Math.max(0.85, 1 - (azimuthDifference * 0.002));
  }

  private static getRegionalIrradiation(location: LocationData): number[] {
    // Usar estado se disponível, senão usar uma média baseada na latitude
    const state = location.state;
    if (state && this.IRRADIATION_DATA[state]) {
      return this.IRRADIATION_DATA[state];
    }
    
    // Fallback baseado na latitude
    const lat = location.latitude;
    if (lat > -15) {
      return [6.0, 5.8, 5.6, 5.2, 4.8, 4.4, 4.6, 5.0, 5.4, 5.7, 5.9, 6.0]; // Norte
    } else if (lat > -25) {
      return [5.8, 5.6, 5.4, 5.0, 4.6, 4.2, 4.4, 4.8, 5.2, 5.5, 5.7, 5.8]; // Sudeste
    } else {
      return [5.2, 5.0, 4.8, 4.4, 4.0, 3.6, 3.8, 4.2, 4.6, 4.9, 5.1, 5.2]; // Sul
    }
  }

  private static calculateTemperatureFactorsFromLocation(location: LocationData): number[] {
    const state = location.state;
    const temperatures = (state && this.TEMPERATURE_DATA[state]) || 
      this.getRegionalTemperature(location.latitude);
    
    return this.calculateTemperatureFactor(temperatures);
  }

  private static getRegionalTemperature(latitude: number): number[] {
    if (latitude > -15) {
      return [28, 29, 30, 30, 31, 32, 32, 33, 32, 31, 30, 28]; // Norte - mais quente
    } else if (latitude > -25) {
      return [26, 27, 28, 27, 24, 22, 22, 25, 28, 29, 28, 26]; // Sudeste
    } else {
      return [24, 25, 23, 20, 17, 15, 15, 17, 19, 22, 23, 24]; // Sul - mais frio
    }
  }

  private static estimateMonthlyGeneration(annualGeneration: number): number[] {
    // Distribuição sazonal típica
    const factors = [1.25, 1.15, 1.05, 0.90, 0.75, 0.70, 0.75, 0.85, 0.95, 1.10, 1.20, 1.25];
    const avgFactor = factors.reduce((a, b) => a + b, 0) / 12;
    const normalized = factors.map(f => f / avgFactor);
    const monthlyAvg = annualGeneration / 12;
    return normalized.map(f => monthlyAvg * f);
  }

  private static calculateTemperatureFactor(temperatures: number[]): number[] {
    return temperatures.map(temp => {
      // Coeficiente de temperatura típico: -0.4%/°C acima de 25°C
      const tempCoeff = -0.004;
      const referenceTTemp = 25;
      return 1 + (tempCoeff * (temp - referenceTTemp));
    });
  }

  private static calculateLosses(
    options: SolarCalculationOptions,
    irradiacao: number[]
  ): DetailedSolarResults['perdas'] {
    
    const { 
      considerarSombreamento, 
      sombreamento = [], 
      considerarSujeira, 
      sujeira = 3, 
      outrasPerdasPercentual = 0,
      perdaMismatch = 2,
      perdaCabeamento = 2,
      perdaInversor = 3
    } = options;
    
    return {
      sombreamento: considerarSombreamento ? 
        (sombreamento.length === 12 ? sombreamento : Array(12).fill(sombreamento[0] || 3)) : 
        Array(12).fill(0),
      mismatch: Array(12).fill(perdaMismatch),
      cabeamento: Array(12).fill(perdaCabeamento),
      sujeira: Array(12).fill(considerarSujeira ? sujeira : 0),
      inversor: Array(12).fill(perdaInversor),
      outras: outrasPerdasPercentual > 0 ? Array(12).fill(outrasPerdasPercentual) : undefined,
      total: irradiacao.map((_, month) => {
        const shadingLoss = considerarSombreamento ? (sombreamento[month] || sombreamento[0] || 0) : 0;
        const mismatchLoss = perdaMismatch;
        const cablingLoss = perdaCabeamento;
        const soilingLoss = considerarSujeira ? sujeira : 0;
        const inverterLoss = perdaInversor;
        const otherLoss = outrasPerdasPercentual || 0;
        
        // Perdas não são simplesmente aditivas - aplicar fórmula multiplicativa
        const totalEfficiency = (1 - shadingLoss/100) * 
                               (1 - mismatchLoss/100) * 
                               (1 - cablingLoss/100) * 
                               (1 - soilingLoss/100) * 
                               (1 - inverterLoss/100) * 
                               (1 - otherLoss/100);
        
        return (1 - totalEfficiency) * 100;
      })
    };
  }

  private static calculatePerformanceRatio(
    geracaoMensal: number[],
    irradiacao: number[],
    potenciaKw: number
  ): number {
    const totalGeracao = geracaoMensal.reduce((sum, gen) => sum + gen, 0);
    const totalIrradiacao = irradiacao.reduce((sum, irr) => sum + irr * 30, 0); // Aproximando 30 dias/mês
    const geracaoTeorica = potenciaKw * totalIrradiacao;
    
    return totalGeracao / geracaoTeorica;
  }

  // Método para estimar irradiação por coordenadas (quando não há dados específicos)
  static estimateIrradiationByCoordinates(
    latitude: number,
    longitude: number
  ): number[] {
    // Modelo simplificado baseado na latitude
    const baseIrradiation = Math.max(3.5, Math.min(7.0, 5.5 - Math.abs(latitude) * 0.05));
    
    // Variação sazonal baseada na latitude
    const seasonalVariation = Math.abs(latitude) * 0.3;
    
    return Array.from({ length: 12 }, (_, month) => {
      // Variação sazonal: máximo no verão, mínimo no inverno
      const seasonalFactor = latitude < 0 ? // Hemisfério Sul
        Math.cos((month + 6) * Math.PI / 6) * seasonalVariation :
        Math.cos(month * Math.PI / 6) * seasonalVariation;
      
      return Math.max(2.0, baseIrradiation + seasonalFactor);
    });
  }
}