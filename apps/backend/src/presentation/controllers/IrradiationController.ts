import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GetSolarIrradiationUseCase } from '@/application/use-cases/irradiation/GetSolarIrradiationUseCase';
import { PvgisApiService } from '@/infrastructure/external-apis/PvgisApiService';
import { CalculationLogger } from '@/domain/services/CalculationLogger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class IrradiationController extends BaseController {
  private pvgisService: PvgisApiService;

  constructor(
    private getSolarIrradiationUseCase: GetSolarIrradiationUseCase
  ) {
    super();
    this.pvgisService = new PvgisApiService({
      baseUrl: 'https://re.jrc.ec.europa.eu/api/v5_2',
      defaultParams: {
        outputformat: 'json',
        browser: 1
      }
    });
  }

  async getSolarIrradiation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      const { latitude, longitude, source, useCache } = req.query;

      // Validações
      if (!latitude || !longitude) {
        this.badRequest(res, 'Latitude e longitude são obrigatórias');
        return;
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      if (isNaN(lat) || isNaN(lng)) {
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      const preferredSource = source as 'PVGIS' | 'NASA' | 'AUTO' || 'AUTO';
      const shouldUseCache = useCache !== 'false'; // padrão: usar cache

      const result = await this.getSolarIrradiationUseCase.execute({
        latitude: lat,
        longitude: lng,
        preferredSource,
        useCache: shouldUseCache
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

  async getAvailableSources(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      const sources = [
        {
          id: 'PVGIS',
          name: 'PVGIS (European Commission)',
          description: 'Dados de satélite de alta precisão para Europa, África e Ásia',
          coverage: 'Global (melhor para Europa/África)',
          accuracy: 'Alta',
          update_frequency: 'Anual',
          data_period: '2016-2020',
          strengths: [
            'Dados de satélite SARAH-2',
            'Alta resolução espacial',
            'Inclui dados de temperatura',
            'Considera horizonte local'
          ],
          limitations: [
            'Pode ter latência em algumas regiões',
            'Requer conexão com internet'
          ]
        },
        {
          id: 'NASA',
          name: 'NASA POWER',
          description: 'Dados meteorológicos globais da NASA',
          coverage: 'Global',
          accuracy: 'Boa',
          update_frequency: 'Mensal',
          data_period: '1981-presente',
          strengths: [
            'Cobertura global completa',
            'Longo histórico de dados',
            'API confiável',
            'Dados de temperatura inclusos'
          ],
          limitations: [
            'Resolução espacial menor',
            'Pode superestimar em algumas regiões'
          ]
        },
        {
          id: 'INMET',
          name: 'INMET (Instituto Nacional de Meteorologia)',
          description: 'Dados meteorológicos oficiais do Brasil',
          coverage: 'Brasil',
          accuracy: 'Estimativa',
          update_frequency: 'Baseado em dados históricos',
          data_period: 'Atlas Solar Brasileiro',
          strengths: [
            'Dados específicos para o Brasil',
            'Considera características locais',
            'Sempre disponível (offline)'
          ],
          limitations: [
            'Apenas estimativas',
            'Limitado ao território brasileiro',
            'Menor precisão'
          ]
        }
      ];

      this.ok(res, {
        sources,
        recommendations: {
          for_brazil: 'PVGIS ou NASA (INMET como fallback)',
          for_europe: 'PVGIS',
          for_global: 'NASA',
          for_accuracy: 'PVGIS',
          for_reliability: 'NASA'
        }
      });
    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async compareIrradiationSources(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        this.badRequest(res, 'Latitude e longitude são obrigatórias');
        return;
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      // Obter dados de todas as fontes disponíveis
      const sources = ['PVGIS', 'NASA'] as const;
      const results = [];
      const errors = [];

      for (const source of sources) {
        try {
          const result = await this.getSolarIrradiationUseCase.execute({
            latitude: lat,
            longitude: lng,
            preferredSource: source,
            useCache: true
          });

          if (result.isSuccess) {
            results.push({
              source,
              data: result.value,
              status: 'success'
            });
          } else {
            errors.push({
              source,
              error: result.error,
              status: 'error'
            });
          }
        } catch (error: any) {
          errors.push({
            source,
            error: error.message,
            status: 'error'
          });
        }
      }

      // Adicionar dados estimados do INMET se no Brasil
      if (lat > -34 && lat < 5 && lng > -74 && lng < -34) {
        try {
          const result = await this.getSolarIrradiationUseCase.execute({
            latitude: lat,
            longitude: lng,
            preferredSource: 'AUTO', // Vai usar estimativa brasileira
            useCache: true
          });

          if (result.isSuccess && result.value && result.value.irradiation_data.source === 'INMET') {
            results.push({
              source: 'INMET',
              data: result.value,
              status: 'success'
            });
          }
        } catch (error) {
          // Ignorar erro do INMET
        }
      }

      if (results.length === 0) {
        this.badRequest(res, 'Nenhuma fonte de dados disponível para esta localização');
        return;
      }

      // Comparar resultados
      const comparison = this.generateSourceComparison(results);

      this.ok(res, {
        location: { latitude: lat, longitude: lng },
        comparison,
        successful_sources: results.length,
        failed_sources: errors.length,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  async getBulkIrradiation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Usuário não autenticado');
        return;
      }

      const { locations, source } = req.body;

      if (!locations || !Array.isArray(locations)) {
        this.badRequest(res, 'Lista de localizações é obrigatória');
        return;
      }

      if (locations.length > 10) {
        this.badRequest(res, 'Máximo de 10 localizações por requisição');
        return;
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        
        if (!location.latitude || !location.longitude) {
          errors.push({
            index: i,
            error: 'Latitude e longitude são obrigatórias',
            location
          });
          continue;
        }

        try {
          const result = await this.getSolarIrradiationUseCase.execute({
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
            preferredSource: source || 'AUTO',
            useCache: true
          });

          if (result.isSuccess) {
            results.push({
              index: i,
              location,
              data: result.value,
              status: 'success'
            });
          } else {
            errors.push({
              index: i,
              location,
              error: result.error,
              status: 'error'
            });
          }

          // Delay para evitar rate limiting
          if (i < locations.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error: any) {
          errors.push({
            index: i,
            location,
            error: error.message,
            status: 'error'
          });
        }
      }

      this.ok(res, {
        total_requested: locations.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      this.internalServerError(res, `Erro interno: ${error.message}`);
    }
  }

  private generateSourceComparison(results: any[]) {
    if (results.length < 2) {
      return { message: 'Pelo menos 2 fontes necessárias para comparação' };
    }

    const annual_values = results.map(r => ({
      source: r.source,
      annual_irradiation: r.data.irradiation_data.annual_irradiation,
      confidence_score: r.data.data_quality.confidence_score
    }));

    // Estatísticas
    const values = annual_values.map(v => v.annual_irradiation);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Encontrar melhor fonte
    const bestByConfidence = annual_values.reduce((best, current) => 
      current.confidence_score > best.confidence_score ? current : best
    );

    const bestByValue = annual_values.reduce((best, current) => 
      current.annual_irradiation > best.annual_irradiation ? current : best
    );

    // Diferenças percentuais
    const differences = annual_values.map(source => ({
      source: source.source,
      difference_from_average: ((source.annual_irradiation - average) / average * 100).toFixed(1),
      difference_from_max: ((source.annual_irradiation - max) / max * 100).toFixed(1)
    }));

    return {
      statistics: {
        average: Math.round(average),
        minimum: Math.round(min),
        maximum: Math.round(max),
        standard_deviation: Math.round(stdDev),
        coefficient_of_variation: (stdDev / average * 100).toFixed(1) + '%'
      },
      best_source: {
        by_confidence: bestByConfidence.source,
        by_value: bestByValue.source
      },
      sources: annual_values,
      differences,
      recommendation: this.getRecommendationFromComparison(annual_values, stdDev, average)
    };
  }

  private getRecommendationFromComparison(sources: any[], stdDev: number, average: number): string {
    const cv = stdDev / average; // Coefficient of variation

    if (cv < 0.05) {
      return 'Todas as fontes apresentam valores muito similares. Use qualquer uma.';
    } else if (cv < 0.15) {
      return 'Pequenas diferenças entre fontes. Recomenda-se usar a fonte com maior confiança.';
    } else {
      const highestConfidence = sources.reduce((best, current) => 
        current.confidence_score > best.confidence_score ? current : best
      );
      return `Diferenças significativas entre fontes. Recomenda-se usar ${highestConfidence.source} (maior confiança).`;
    }
  }

  async getPVGISData(req: Request, res: Response): Promise<void> {
    try {
      // Endpoint público para PVGIS - não requer autenticação

      const {
        lat,
        lon,
        peakpower,
        loss,
        angle,
        aspect,
        mountingplace,
        trackingtype,
        pvtechchoice,
        raddatabase,
        startyear,
        endyear,
        js,
        data_source // NOVO: extrair fonte de dados do usuário
      } = req.query;

      // Validações básicas
      if (!lat || !lon) {
        this.badRequest(res, 'Latitude (lat) e longitude (lon) são obrigatórias');
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      // CORRIGIDO: Rotear para o serviço Python que suporta NASA e PVGIS
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';

      // Preparar dados para o serviço Python
      const pythonRequest = {
        lat: latitude,
        lon: longitude,
        tilt: angle ? parseFloat(angle as string) : 0,
        azimuth: aspect ? parseFloat(aspect as string) : 0,
        data_source: (data_source as string) || 'pvgis', // CORRIGIDO: passar fonte de dados
        modelo_decomposicao: 'erbs'
      };

      console.log('[IrradiationController] Enviando para Python service:', {
        url: `${pythonServiceUrl}/api/v1/irradiation/monthly`,
        request: pythonRequest
      });

      // Chamar o serviço Python que suporta múltiplas fontes
      const response = await fetch(`${pythonServiceUrl}/api/v1/irradiation/monthly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pythonRequest)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.ok(res, result);
    } catch (error: any) {
      console.error('Erro no proxy PVGIS:', error);
      this.internalServerError(res, `Erro ao buscar dados do PVGIS: ${error.message}`);
    }
  }

  async getPVGISMRData(req: Request, res: Response): Promise<void> {
    const logger = new CalculationLogger(`pvgis-mr-${Date.now()}`);
    
    try {
      const {
        lat,
        lon,
        raddatabase,
        outputformat,
        startyear,
        endyear,
        mountingplace,
        angle,
        aspect,
        components,
        hourlyoptimal
      } = req.query;

      logger.context('PVGIS', 'Requisição de dados mensais PVGIS iniciada', 
        { lat, lon, raddatabase, startyear, endyear, components, hourlyoptimal },
        'Endpoint público para buscar dados mensais de irradiação solar via PVGIS MRcalc com componentes e otimização horária'
      );

      // Validações básicas
      if (!lat || !lon) {
        logger.error('Validação', 'Coordenadas não fornecidas', { lat, lon });
        this.badRequest(res, 'Latitude (lat) e longitude (lon) são obrigatórias');
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        logger.error('Validação', 'Coordenadas inválidas', { latitude, longitude });
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      logger.result('Validação', 'Coordenadas validadas com sucesso', { latitude, longitude });

      const params = {
        raddatabase: (raddatabase as string) || 'PVGIS-SARAH2',
        outputformat: (outputformat as string) || 'json',
        startyear: startyear ? parseInt(startyear as string) : 2016,
        endyear: endyear ? parseInt(endyear as string) : 2020,
        mountingplace: (mountingplace as string) || 'free',
        angle: angle ? parseFloat(angle as string) : 0,
        aspect: aspect ? parseFloat(aspect as string) : 0,
        components: components ? parseInt(components as string) : 1,
        hourlyoptimal: hourlyoptimal ? parseInt(hourlyoptimal as string) : 1
      };

      logger.info('PVGIS', 'Parâmetros da consulta PVGIS configurados', {
        ...params,
        hasComponents: params.components === 1,
        hasHourlyOptimal: params.hourlyoptimal === 1,
        expectedFeatures: [
          params.components === 1 ? 'Componentes de radiação (direta, difusa, refletida)' : null,
          params.hourlyoptimal === 1 ? 'Ângulos ótimos horários' : null
        ].filter(Boolean)
      });

      // Chamar o serviço PVGIS MRcalc com logging
      const result = await this.pvgisService.getMonthlyRadiationCalc(latitude, longitude, params, logger);

      logger.result('PVGIS', 'Dados PVGIS MRcalc retornados com sucesso', {
        hasOutputs: !!result.outputs,
        hasMonthly: !!result.outputs?.monthly,
        monthlyCount: result.outputs?.monthly?.length || 0,
        hasHourly: !!result.outputs?.hourly,
        hourlyCount: result.outputs?.hourly?.length || 0,
        hasComponents: !!result.outputs?.components || !!result.outputs?.radiation_components,
        hasOptimalAngles: !!result.outputs?.optimal_angles,
        outputStructure: result.outputs ? Object.keys(result.outputs) : [],
        componentsRequested: params.components === 1,
        hourlyOptimalRequested: params.hourlyoptimal === 1
      });

      // Processar e logar dados horários se disponíveis
      this.processHourlyData(result, logger, params);
      
      this.ok(res, result);
    } catch (error: any) {
      logger.error('PVGIS', 'Erro no proxy PVGIS MRcalc', { 
        message: error.message, 
        stack: error.stack 
      });
      console.error('Erro no proxy PVGIS MRcalc:', error);
      this.internalServerError(res, `Erro ao buscar dados MRcalc do PVGIS: ${error.message}`);
    }
  }

  async getPVGISMonthlyComponents(req: Request, res: Response): Promise<void> {
    const logger = new CalculationLogger(`pvgis-components-${Date.now()}`);
    
    try {
      const {
        lat,
        lon,
        raddatabase,
        startyear,
        endyear
      } = req.query;

      logger.context('PVGIS-Components', 'Requisição otimizada para componentes mensais', 
        { lat, lon, raddatabase, startyear, endyear },
        'Endpoint otimizado para buscar apenas componentes de radiação mensal do PVGIS'
      );

      // Validações básicas
      if (!lat || !lon) {
        logger.error('Validação', 'Coordenadas não fornecidas', { lat, lon });
        this.badRequest(res, 'Latitude (lat) e longitude (lon) são obrigatórias');
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        logger.error('Validação', 'Coordenadas inválidas', { latitude, longitude });
        this.badRequest(res, 'Latitude e longitude devem ser números válidos');
        return;
      }

      logger.result('Validação', 'Coordenadas validadas com sucesso', { latitude, longitude });

      // Parâmetros otimizados para componentes mensais (mais rápido)
      const params = {
        raddatabase: (raddatabase as string) || 'PVGIS-SARAH2',
        outputformat: 'json',
        startyear: startyear ? parseInt(startyear as string) : 2020,
        endyear: endyear ? parseInt(endyear as string) : 2020,
        mountingplace: 'free',
        angle: 0,
        aspect: 0,
        components: 1,
        hourlyoptimal: 0 // Desabilitar hourly para ser mais rápido
      };

      logger.info('PVGIS-Components', 'Parâmetros otimizados configurados', {
        ...params,
        optimizations: [
          'hourlyoptimal=0 para velocidade',
          'components=1 para dados detalhados',
          'período limitado para eficiência'
        ]
      });

      // Chamar o serviço PVGIS com parâmetros otimizados
      const result = await this.pvgisService.getMonthlyRadiationCalc(latitude, longitude, params, logger);

      // Processar e otimizar resposta
      const optimizedResult = await this.optimizeComponentsResponse(result, logger, latitude, longitude);

      logger.result('PVGIS-Components', 'Componentes mensais retornados com sucesso', {
        hasMonthlyData: !!optimizedResult.monthly,
        hasComponents: !!optimizedResult.components,
        dataSize: JSON.stringify(optimizedResult).length,
        optimized: true
      });

      this.ok(res, optimizedResult);
    } catch (error: any) {
      logger.error('PVGIS-Components', 'Erro no endpoint de componentes mensais', { 
        message: error.message, 
        stack: error.stack 
      });
      console.error('Erro no endpoint PVGIS Components:', error);
      this.internalServerError(res, `Erro ao buscar componentes mensais do PVGIS: ${error.message}`);
    }
  }

  private processHourlyData(result: any, logger: CalculationLogger, params: any): void {
    try {
      // Verificar diferentes estruturas possíveis dos dados horários
      const hourlyData = result.outputs?.hourly || 
                        result.outputs?.hourly_radiation ||
                        result.outputs?.['hourly'] ||
                        result.outputs?.timeseries;
      
      if (hourlyData && Array.isArray(hourlyData)) {
        logger.info('PVGIS-Hourly', 'Dados horários processados', {
          totalHours: hourlyData.length,
          timeRange: {
            start: hourlyData[0]?.time || hourlyData[0]?.timestamp,
            end: hourlyData[hourlyData.length - 1]?.time || hourlyData[hourlyData.length - 1]?.timestamp
          },
          dataStructure: Object.keys(hourlyData[0] || {})
        });

        // Análise estatística dos dados horários
        const irradiationValues = hourlyData.map((hour: any) => 
          hour['H(i)'] || hour.irradiation || hour['G(i)'] || hour.H_i || 0
        ).filter((val: number) => val > 0);

        if (irradiationValues.length > 0) {
          const avgIrradiation = irradiationValues.reduce((sum: number, val: number) => sum + val, 0) / irradiationValues.length;
          const maxIrradiation = Math.max(...irradiationValues);
          const minIrradiation = Math.min(...irradiationValues);

          logger.result('PVGIS-Hourly', 'Estatísticas de irradiação horária', {
            average: avgIrradiation,
            maximum: maxIrradiation,
            minimum: minIrradiation,
            validHours: irradiationValues.length,
            totalHours: hourlyData.length,
            dataCompleteness: (irradiationValues.length / hourlyData.length * 100).toFixed(1) + '%'
          });
        }

        // Log das primeiras 24 horas com detalhes
        const first24Hours = hourlyData.slice(0, 24);
        logger.info('PVGIS-Hourly', 'Primeiras 24 horas detalhadas', {
          hourlyDetails: first24Hours.map((hour: any, index: number) => {
            const irradiation = hour['H(i)'] || hour.irradiation || hour['G(i)'] || hour.H_i || 0;
            const directRad = hour['Gb(i)'] || hour.beam || hour.direct || 0;
            const diffuseRad = hour['Gd(i)'] || hour.diffuse || 0;
            const temp = hour.T2m || hour.temperature || 0;
            
            return {
              hour: index,
              timestamp: hour.time || hour.timestamp || `${params.startyear}-01-01 ${String(index).padStart(2, '0')}:00`,
              irradiation: Number(irradiation).toFixed(2),
              directRadiation: Number(directRad).toFixed(2),
              diffuseRadiation: Number(diffuseRad).toFixed(2),
              temperature: Number(temp).toFixed(1),
              hasOptimalAngle: !!hour.optimal_angle,
              allKeys: Object.keys(hour)
            };
          })
        });

        // Log de picos de irradiação
        const peakHours = hourlyData
          .map((hour: any, index: number) => ({
            index,
            irradiation: hour['H(i)'] || hour.irradiation || hour['G(i)'] || hour.H_i || 0,
            time: hour.time || hour.timestamp || `Hour-${index}`
          }))
          .filter((hour: any) => hour.irradiation > 800) // Acima de 800 W/m²
          .sort((a: any, b: any) => b.irradiation - a.irradiation)
          .slice(0, 10); // Top 10 picos

        if (peakHours.length > 0) {
          logger.result('PVGIS-Hourly', 'Picos de irradiação identificados', {
            totalPeaks: peakHours.length,
            topPeaks: peakHours
          });
        }
      } else {
        logger.info('PVGIS-Hourly', 'Dados horários não encontrados na resposta', {
          availableOutputs: result.outputs ? Object.keys(result.outputs) : [],
          hourlyOptimalRequested: params.hourlyoptimal === 1
        });
      }

      // Verificar dados de componentes
      const components = result.outputs?.components || result.outputs?.radiation_components;
      if (components && params.components === 1) {
        logger.info('PVGIS-Components', 'Componentes de radiação detectados', {
          structure: typeof components,
          keys: typeof components === 'object' ? Object.keys(components) : [],
          hasBeamData: !!(components.beam || components.direct),
          hasDiffuseData: !!(components.diffuse),
          hasReflectedData: !!(components.reflected)
        });
      }
      
    } catch (error: any) {
      logger.error('PVGIS-Hourly', 'Erro ao processar dados horários', {
        error: error.message,
        hasOutputs: !!result.outputs
      });
    }
  }

  private async optimizeComponentsResponse(rawData: any, logger: CalculationLogger, latitude: number, longitude: number): Promise<any> {
    try {
      // Extrair apenas dados necessários para componentes mensais
      const optimized = {
        inputs: rawData.inputs,
        outputs: {
          monthly: rawData.outputs?.monthly || [],
          totals: rawData.outputs?.totals,
        },
        components: null as any,
        metadata: {
          optimized: true,
          endpoint: 'monthly-components',
          timestamp: new Date().toISOString()
        }
      };

      // Processar componentes se disponíveis
      if (rawData.outputs?.radiation_components) {
        optimized.components = rawData.outputs.radiation_components;
        logger.info('Optimizer', 'Componentes de radiação otimizados', {
          hasBeam: !!optimized.components.beam,
          hasDiffuse: !!optimized.components.diffuse,
          hasReflected: !!optimized.components.reflected
        });
      } else {
        // Se não temos componentes, usar endpoint básico PVGIS como fallback
        logger.info('Optimizer', 'Dados de componentes não disponíveis, buscando dados básicos PVGIS');
        
        try {
          // Buscar dados do endpoint básico PVGIS
          const basicResult = await this.pvgisService.getMonthlyRadiation(latitude, longitude, {
            peakpower: 1,
            loss: 14,
            mountingplace: 'free',
            angle: 0,
            aspect: 0
          });
          
          if (basicResult.outputs?.monthly_radiation && Array.isArray(basicResult.outputs.monthly_radiation)) {
            // Converter dados do PvgisApiService para formato esperado
            const monthlyRadiation = basicResult.outputs.monthly_radiation;
            const monthlyFixed = monthlyRadiation.map((irradiation: number, index: number) => ({
              month: index + 1,
              'H(i)_d': irradiation
            }));
            logger.info('Optimizer', 'Dados básicos PVGIS encontrados', {
              monthlyCount: monthlyFixed.length,
              firstMonth: monthlyFixed[0],
              hasIrradiationData: !!monthlyFixed[0]['H(i)_d']
            });
            
            // Atualizar dados mensais com dados reais
            optimized.outputs.monthly = monthlyFixed;
            
            // Gerar componentes estimados baseados nos dados reais
            optimized.components = {
              beam: monthlyFixed.map((item: any) => {
                const total = item['H(i)_d'] || 0;
                return { 'Gb(i)_d': total * 0.65 }; // ~65% direto
              }),
              diffuse: monthlyFixed.map((item: any) => {
                const total = item['H(i)_d'] || 0;
                return { 'Gd(i)_d': total * 0.32 }; // ~32% difuso
              }),
              reflected: monthlyFixed.map((item: any) => {
                const total = item['H(i)_d'] || 0;
                return { 'Gr(i)_d': total * 0.03 }; // ~3% refletido
              }),
              estimated: true,
              source: 'fallback-basic-pvgis'
            };
            
            // Atualizar totals com dados reais
            if (basicResult.outputs.totals?.fixed) {
              optimized.outputs.totals = basicResult.outputs.totals.fixed;
            }
            
            logger.result('Optimizer', 'Dados básicos PVGIS integrados com sucesso', {
              hasRealData: true,
              totalAnnualIrradiation: basicResult.outputs.totals?.fixed?.E_y,
              estimatedComponents: true
            });
          }
        } catch (basicError: any) {
          logger.error('Optimizer', 'Erro ao buscar dados básicos PVGIS', { error: basicError.message });
          
          // Fallback para estimativas padrão do Brasil
          const monthlyEstimates = [6.09, 6.04, 5.56, 4.71, 3.58, 3.2, 3.54, 4.27, 4.78, 5.31, 6.26, 6.29];
          optimized.outputs.monthly = monthlyEstimates.map((irradiation, index) => ({
            month: index + 1,
            year: 2020,
            'H(i)_d': irradiation
          }));
          
          optimized.components = {
            beam: monthlyEstimates.map(total => ({ 'Gb(i)_d': total * 0.65 })),
            diffuse: monthlyEstimates.map(total => ({ 'Gd(i)_d': total * 0.32 })),
            reflected: monthlyEstimates.map(total => ({ 'Gr(i)_d': total * 0.03 })),
            estimated: true,
            source: 'fallback-estimates-brazil'
          };
          
          logger.info('Optimizer', 'Usando estimativas padrão do Brasil', {
            source: 'fallback-estimates-brazil',
            monthlyCount: 12
          });
        }
      }

      // Remover dados desnecessários para economizar banda
      delete rawData.outputs?.hourly;
      delete rawData.outputs?.hourly_radiation;
      delete rawData.outputs?.timeseries;

      const originalSize = JSON.stringify(rawData).length;
      const optimizedSize = JSON.stringify(optimized).length;
      
      logger.result('Optimizer', 'Resposta otimizada', {
        originalSize,
        optimizedSize,
        reduction: `${((1 - optimizedSize / originalSize) * 100).toFixed(1)}%`,
        hasComponents: !!optimized.components
      });

      return optimized;
      
    } catch (error: any) {
      logger.error('Optimizer', 'Erro na otimização da resposta', { error: error.message });
      return rawData; // Retornar dados originais em caso de erro
    }
  }
}