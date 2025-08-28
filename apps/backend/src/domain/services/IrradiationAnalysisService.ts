import { CalculationLogger } from "./CalculationLogger";

export interface MonthlyIrradiation {
  month: number;
  monthName: string;
  irradiation: number; // kWh/m²/dia
}

export interface IrradiationAnalysis {
  mediaAnual: number; // kWh/m²/dia
  maximo: {
    valor: number; // kWh/m²/dia
    mes: string;
    mesNumero: number;
  };
  minimo: {
    valor: number; // kWh/m²/dia
    mes: string;
    mesNumero: number;
  };
  variacao: {
    absoluta: number; // kWh/m²/dia
    percentual: number; // %
    classificacao: 'Baixa' | 'Moderada' | 'Alta' | 'Muito Alta';
  };
  sazonalidade: {
    verao: number; // Dez, Jan, Fev
    outono: number; // Mar, Abr, Mai
    inverno: number; // Jun, Jul, Ago
    primavera: number; // Set, Out, Nov
  };
  totalAnual: number; // kWh/m²/ano
  desvio: {
    padrao: number;
    coeficienteVariacao: number; // %
  };
}

export class IrradiationAnalysisService {

  private static readonly MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  /**
   * Analisa dados de irradiação mensal e calcula estatísticas detalhadas
   */
  static analyzeIrradiation(
    monthlyData: number[],
    coordinates: { latitude: number; longitude: number },
    logger?: CalculationLogger
  ): IrradiationAnalysis {

    logger?.context('Irradiação', 'Iniciando análise de irradiação solar', {
      dadosMensais: monthlyData,
      coordenadas: coordinates,
      totalMeses: monthlyData.length
    }, 'Análise estatística completa dos dados de irradiação solar obtidos do PVGIS, incluindo médias, extremos, sazonalidade e variabilidade.');

    // Validação dos dados
    if (!monthlyData || monthlyData.length !== 12) {
      throw new Error('Dados mensais devem conter exatamente 12 valores');
    }

    // 1. Cálculo da média anual
    const mediaAnual = this.calculateAnnualAverage(monthlyData, logger);

    // 2. Identificação de máximo e mínimo
    const extremos = this.findExtremes(monthlyData, logger);

    // 3. Cálculo da variação
    const variacao = this.calculateVariation(extremos.maximo.valor, extremos.minimo.valor, logger);

    // 4. Análise sazonal
    const sazonalidade = this.analyzeSeasonal(monthlyData, logger);

    // 5. Cálculo do total anual
    const totalAnual = this.calculateAnnualTotal(mediaAnual, logger);

    // 6. Análise de desvio padrão
    const desvio = this.calculateStandardDeviation(monthlyData, mediaAnual, logger);

    // 7. Análise da localização geográfica
    this.analyzeGeographicInfluence(coordinates, mediaAnual, variacao, logger);

    const resultado: IrradiationAnalysis = {
      mediaAnual,
      maximo: extremos.maximo,
      minimo: extremos.minimo,
      variacao,
      sazonalidade,
      totalAnual,
      desvio
    };

    logger?.result('Irradiação', 'Análise de irradiação concluída', {
      mediaAnual: `${mediaAnual.toFixed(2)} kWh/m²/dia`,
      maximo: `${extremos.maximo.valor.toFixed(2)} kWh/m²/dia em ${extremos.maximo.mes}`,
      minimo: `${extremos.minimo.valor.toFixed(2)} kWh/m²/dia em ${extremos.minimo.mes}`,
      variacao: `${variacao.percentual.toFixed(0)}% - ${variacao.classificacao}`,
      totalAnual: `${totalAnual.toFixed(0)} kWh/m²/ano`
    });

    return resultado;
  }

  /**
   * Calcula a média anual de irradiação
   */
  private static calculateAnnualAverage(monthlyData: number[], logger?: CalculationLogger): number {
    const soma = monthlyData.reduce((acc, val) => acc + val, 0);
    const media = soma / 12;

    logger?.formula('Irradiação', 'Média Anual de Irradiação',
      'H_média = Σ(H_mensal) / 12',
      {
        H_mensal: monthlyData,
        soma_total: soma,
        numero_meses: 12
      },
      media,
      {
        description: 'Média aritmética simples dos valores mensais de irradiação. Representa a irradiação solar média diária ao longo do ano.',
        units: 'kWh/m²/dia',
        references: [
          'PVGIS - Photovoltaic Geographical Information System',
          'Solar Resource Assessment - NREL',
          'IEC 61724-1:2017 - Photovoltaic system performance monitoring'
        ]
      }
    );

    return media;
  }

  /**
   * Identifica valores máximo e mínimo
   */
  private static findExtremes(monthlyData: number[], logger?: CalculationLogger) {
    let maxVal = -Infinity;
    let minVal = Infinity;
    let maxIndex = -1;
    let minIndex = -1;

    monthlyData.forEach((valor, index) => {
      if (valor > maxVal) {
        maxVal = valor;
        maxIndex = index;
      }
      if (valor < minVal) {
        minVal = valor;
        minIndex = index;
      }
    });

    const maximo = {
      valor: maxVal,
      mes: this.MONTH_NAMES[maxIndex],
      mesNumero: maxIndex + 1
    };

    const minimo = {
      valor: minVal,
      mes: this.MONTH_NAMES[minIndex],
      mesNumero: minIndex + 1
    };

    logger?.formula('Irradiação', 'Identificação de Extremos',
      'H_max = max(H_mensal), H_min = min(H_mensal)',
      {
        dados_mensais: monthlyData,
        indice_maximo: maxIndex + 1,
        indice_minimo: minIndex + 1
      },
      { maximo, minimo },
      {
        description: 'Identificação dos meses com maior e menor irradiação solar. Importante para dimensionamento e análise de variabilidade sazonal.',
        units: 'kWh/m²/dia',
        references: [
          'Solar Energy Engineering - Kalogirou',
          'Handbook of Photovoltaic Science and Engineering'
        ]
      }
    );

    return { maximo, minimo };
  }

  /**
   * Calcula a variação entre máximo e mínimo
   */
  private static calculateVariation(max: number, min: number, logger?: CalculationLogger) {
    const absoluta = max - min;
    const percentual = (absoluta / min) * 100;

    let classificacao: 'Baixa' | 'Moderada' | 'Alta' | 'Muito Alta';
    if (percentual < 30) classificacao = 'Baixa';
    else if (percentual < 50) classificacao = 'Moderada';
    else if (percentual < 80) classificacao = 'Alta';
    else classificacao = 'Muito Alta';

    logger?.formula('Irradiação', 'Variação Sazonal',
      'Var_% = ((H_max - H_min) / H_min) × 100',
      {
        H_max: max,
        H_min: min,
        diferenca_absoluta: absoluta
      },
      { percentual, classificacao },
      {
        description: 'Variação percentual entre o mês de maior e menor irradiação. Indica o grau de sazonalidade do recurso solar no local.',
        units: '% (adimensional)',
        references: [
          'Solar Resource Variability - IRENA',
          'Renewable Energy Resource Assessment - NREL'
        ]
      }
    );

    return { absoluta, percentual, classificacao };
  }

  /**
   * Analisa a irradiação por estação do ano
   */
  private static analyzeSeasonal(monthlyData: number[], logger?: CalculationLogger) {
    // Hemisfério Sul (Brasil): 
    // Verão: Dez(11), Jan(0), Fev(1)
    // Outono: Mar(2), Abr(3), Mai(4)
    // Inverno: Jun(5), Jul(6), Ago(7)
    // Primavera: Set(8), Out(9), Nov(10)

    const verao = (monthlyData[11] + monthlyData[0] + monthlyData[1]) / 3;
    const outono = (monthlyData[2] + monthlyData[3] + monthlyData[4]) / 3;
    const inverno = (monthlyData[5] + monthlyData[6] + monthlyData[7]) / 3;
    const primavera = (monthlyData[8] + monthlyData[9] + monthlyData[10]) / 3;

    const sazonalidade = { verao, outono, inverno, primavera };

    logger?.formula('Irradiação', 'Análise Sazonal (Hemisfério Sul)',
      'H_estação = (H_mês1 + H_mês2 + H_mês3) / 3',
      {
        verao_meses: [monthlyData[11], monthlyData[0], monthlyData[1]],
        outono_meses: [monthlyData[2], monthlyData[3], monthlyData[4]],
        inverno_meses: [monthlyData[5], monthlyData[6], monthlyData[7]],
        primavera_meses: [monthlyData[8], monthlyData[9], monthlyData[10]]
      },
      sazonalidade,
      {
        description: 'Média de irradiação por estação do ano no Hemisfério Sul. Verão apresenta maior irradiação devido ao ângulo solar favorável.',
        units: 'kWh/m²/dia',
        references: [
          'Solar Position and Tracking - Braun & Mitchell',
          'Solar Engineering of Thermal Processes - Duffie & Beckman'
        ]
      }
    );

    return sazonalidade;
  }

  /**
   * Calcula o total anual de irradiação
   */
  private static calculateAnnualTotal(mediaAnual: number, logger?: CalculationLogger): number {
    const totalAnual = mediaAnual * 365;

    logger?.formula('Irradiação', 'Irradiação Total Anual',
      'H_total = H_média × 365',
      {
        H_media_diaria: mediaAnual,
        dias_por_ano: 365
      },
      totalAnual,
      {
        description: 'Irradiação solar total acumulada no ano. Usado para cálculos de energia anual e comparações regionais.',
        units: 'kWh/m²/ano',
        references: [
          'Atlas Brasileiro de Energia Solar - INPE',
          'Global Solar Atlas - World Bank'
        ]
      }
    );

    return totalAnual;
  }

  /**
   * Calcula desvio padrão e coeficiente de variação
   */
  private static calculateStandardDeviation(monthlyData: number[], media: number, logger?: CalculationLogger) {
    const variancia = monthlyData.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / 12;
    const desvioPadrao = Math.sqrt(variancia);
    const coeficienteVariacao = (desvioPadrao / media) * 100;

    logger?.formula('Irradiação', 'Desvio Padrão e Coeficiente de Variação',
      'σ = √(Σ(H_i - H_média)² / n), CV = (σ / H_média) × 100',
      {
        H_mensal: monthlyData,
        H_media: media,
        variancia: variancia,
        n: 12
      },
      { desvioPadrao, coeficienteVariacao },
      {
        description: 'Medidas de dispersão dos dados. Desvio padrão indica variabilidade absoluta e CV a variabilidade relativa.',
        units: 'σ: kWh/m²/dia, CV: %',
        references: [
          'Statistical Methods in Solar Energy - Gueymard',
          'Solar Resource Variability - Kleissl'
        ]
      }
    );

    return { padrao: desvioPadrao, coeficienteVariacao };
  }

  /**
   * Analisa influência geográfica
   */
  private static analyzeGeographicInfluence(
    coordinates: { latitude: number; longitude: number },
    mediaAnual: number,
    variacao: { percentual: number; classificacao: string },
    logger?: CalculationLogger
  ) {
    const { latitude, longitude } = coordinates;
    const latitudeAbs = Math.abs(latitude);
    
    // Classificação climática baseada na latitude
    let climaRegiao: string;
    if (latitudeAbs < 23.5) climaRegiao = 'Tropical';
    else if (latitudeAbs < 35) climaRegiao = 'Subtropical';
    else climaRegiao = 'Temperado';

    // Análise de potencial solar
    let potencialSolar: string;
    if (mediaAnual > 5.5) potencialSolar = 'Excelente';
    else if (mediaAnual > 4.5) potencialSolar = 'Muito Bom';
    else if (mediaAnual > 3.5) potencialSolar = 'Bom';
    else potencialSolar = 'Regular';

    logger?.context('Irradiação', 'Análise Geográfica e Climática', {
      latitude,
      longitude,
      latitude_absoluta: latitudeAbs,
      clima_regiao: climaRegiao,
      potencial_solar: potencialSolar,
      irradiacao_media: mediaAnual,
      variacao_sazonal: variacao.percentual
    }, `Localização em região ${climaRegiao.toLowerCase()} com potencial solar ${potencialSolar.toLowerCase()}. A latitude de ${latitude.toFixed(2)}° influencia diretamente a variação sazonal da irradiação.`);

    // Análise específica para o Brasil
    if (latitude > -35 && latitude < 5 && longitude > -75 && longitude < -30) {
      logger?.context('Irradiação', 'Contexto Brasileiro', {
        regiao: this.identifyBrazilianRegion(latitude, longitude),
        caracteristicas: this.getBrazilianSolarCharacteristics(latitude)
      }, 'O Brasil possui um dos melhores recursos solares do mundo, com irradiação média entre 4,25-6,75 kWh/m²/dia.');
    }
  }

  /**
   * Identifica região brasileira baseada em coordenadas
   */
  private static identifyBrazilianRegion(lat: number, lng: number): string {
    if (lat > -16 && lng > -48) return 'Centro-Oeste';
    if (lat > -16) return 'Norte';
    if (lat > -20 && lng < -40) return 'Sudeste';
    if (lat < -20) return 'Sul';
    return 'Nordeste';
  }

  /**
   * Características solares por região brasileira
   */
  private static getBrazilianSolarCharacteristics(lat: number): string {
    const latAbs = Math.abs(lat);
    if (latAbs < 10) return 'Baixa variação sazonal, alta irradiação constante';
    if (latAbs < 20) return 'Variação sazonal moderada, irradiação elevada';
    return 'Variação sazonal mais acentuada, bom recurso solar';
  }
}