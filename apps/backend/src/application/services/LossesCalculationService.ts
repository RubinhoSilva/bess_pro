export interface SystemLosses {
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaTemperatura?: number;
  perdaOutras?: number;
}

export interface DetailedLossesBreakdown {
  temperatura: number[];  // % perdas por mês devido à temperatura
  sombreamento: number[]; // % perdas por mês devido ao sombreamento
  mismatch: number[];     // % perdas por mês devido a descasamento
  cabeamento: number[];   // % perdas por mês devido a cabeamento
  sujeira: number[];      // % perdas por mês devido à sujeira
  inversor: number[];     // % perdas por mês devido ao inversor
  outras?: number[];      // % perdas por mês devido a outros fatores
  total: number[];        // % perdas totais por mês
}

export class LossesCalculationService {
  
  /**
   * Calcula breakdown detalhado de perdas mensais baseado em perdas do sistema
   */
  static calculateDetailedLosses(
    systemLosses: SystemLosses,
    latitude: number = -23.55,
    monthlyIrradiation?: number[]
  ): DetailedLossesBreakdown {
    
    // Perdas base por tipo
    const baseLosses = {
      temperatura: systemLosses.perdaTemperatura || 8,
      sombreamento: systemLosses.perdaSombreamento || 3,
      mismatch: systemLosses.perdaMismatch || 2,
      cabeamento: systemLosses.perdaCabeamento || 2,
      sujeira: systemLosses.perdaSujeira || 5,
      inversor: systemLosses.perdaInversor || 3,
      outras: systemLosses.perdaOutras || 0
    };
    
    // Fatores sazonais para diferentes tipos de perdas
    const seasonalFactors = this.getSeasonalFactors(latitude);
    
    // Calcular perdas mensais
    const losses: DetailedLossesBreakdown = {
      temperatura: [],
      sombreamento: [],
      mismatch: [],
      cabeamento: [],
      sujeira: [],
      inversor: [],
      outras: [],
      total: []
    };
    
    for (let month = 0; month < 12; month++) {
      // Perdas por temperatura variam com a sazonalidade (mais altas no verão)
      losses.temperatura[month] = baseLosses.temperatura * seasonalFactors.temperatura[month];
      
      // Sombreamento pode variar com a altura solar
      losses.sombreamento[month] = baseLosses.sombreamento * seasonalFactors.sombreamento[month];
      
      // Sujeira varia com período seco/chuvoso
      losses.sujeira[month] = baseLosses.sujeira * seasonalFactors.sujeira[month];
      
      // Perdas constantes ao longo do ano
      losses.mismatch[month] = baseLosses.mismatch;
      losses.cabeamento[month] = baseLosses.cabeamento;
      losses.inversor[month] = baseLosses.inversor;
      losses.outras![month] = baseLosses.outras;
      
      // Total de perdas por mês
      losses.total[month] = losses.temperatura[month] + 
                           losses.sombreamento[month] + 
                           losses.mismatch[month] + 
                           losses.cabeamento[month] + 
                           losses.sujeira[month] + 
                           losses.inversor[month] + 
                           (losses.outras![month] || 0);
    }
    
    return losses;
  }
  
  /**
   * Fatores sazonais para diferentes tipos de perdas baseados na latitude
   */
  private static getSeasonalFactors(latitude: number) {
    // Ajustar fatores com base na região
    if (latitude > -15) {
      // Norte/Nordeste - menor variação sazonal
      return {
        temperatura: [0.9, 0.95, 1.0, 1.1, 1.15, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9],
        sombreamento: [1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15],
        sujeira: [1.3, 1.2, 1.1, 0.9, 0.7, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.3]
      };
    } else if (latitude > -25) {
      // Centro-Oeste/Sudeste - variação moderada
      return {
        temperatura: [0.8, 0.9, 1.0, 1.15, 1.25, 1.3, 1.25, 1.15, 1.05, 0.95, 0.85, 0.8],
        sombreamento: [1.2, 1.1, 1.0, 0.9, 0.85, 0.8, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2],
        sujeira: [1.4, 1.3, 1.2, 1.0, 0.6, 0.5, 0.6, 0.7, 0.8, 1.0, 1.3, 1.4]
      };
    } else {
      // Sul - maior variação sazonal
      return {
        temperatura: [0.7, 0.8, 0.95, 1.1, 1.3, 1.4, 1.35, 1.2, 1.0, 0.9, 0.8, 0.7],
        sombreamento: [1.3, 1.2, 1.05, 0.9, 0.8, 0.75, 0.8, 0.85, 0.95, 1.05, 1.2, 1.3],
        sujeira: [1.5, 1.4, 1.3, 1.1, 0.7, 0.5, 0.6, 0.8, 0.9, 1.1, 1.4, 1.5]
      };
    }
  }
  
  /**
   * Calcular fator de temperatura mensal baseado em dados climáticos
   */
  private static getTemperatureFactor(month: number, latitude: number): number {
    // Temperaturas médias aproximadas por região e mês
    const tempProfile = this.getRegionalTemperatureProfile(latitude);
    
    // Temperatura de referência (25°C STC)
    const refTemp = 25;
    
    // Coeficiente de temperatura típico para silício cristalino (-0.004/°C)
    const tempCoeff = -0.004;
    
    const avgTemp = tempProfile[month];
    const tempDiff = avgTemp - refTemp;
    
    // Fator de perda por temperatura (1 = sem perda, <1 = perda)
    return Math.max(0.5, 1 + (tempCoeff * tempDiff));
  }
  
  private static getRegionalTemperatureProfile(latitude: number): number[] {
    if (latitude > -15) {
      // Norte/Nordeste - temperaturas altas e constantes
      return [28, 29, 30, 30, 31, 32, 32, 33, 32, 31, 30, 28];
    } else if (latitude > -25) {
      // Centro-Oeste/Sudeste - variação moderada
      return [26, 27, 28, 27, 24, 22, 22, 25, 28, 29, 28, 26];
    } else {
      // Sul - maior variação sazonal
      return [24, 25, 23, 20, 17, 15, 15, 17, 19, 22, 23, 24];
    }
  }
}