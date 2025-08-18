import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GetSolarIrradiationUseCase } from '@/application/use-cases/irradiation/GetSolarIrradiationUseCase';
import { PvgisApiService } from '@/infrastructure/external-apis/PvgisApiService';

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
        js
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

      // Chamar o serviço PVGIS com todos os parâmetros
      const result = await this.pvgisService.getMonthlyRadiation(latitude, longitude, {
        peakpower: peakpower ? parseFloat(peakpower as string) : 1,
        loss: loss ? parseFloat(loss as string) : 14,
        angle: angle ? parseFloat(angle as string) : undefined,
        aspect: aspect ? parseFloat(aspect as string) : undefined,
        mountingplace: (mountingplace as string) || 'free'
      });

      this.ok(res, result);
    } catch (error: any) {
      console.error('Erro no proxy PVGIS:', error);
      this.internalServerError(res, `Erro ao buscar dados do PVGIS: ${error.message}`);
    }
  }

  async getPVGISMRData(req: Request, res: Response): Promise<void> {
    try {
      // Endpoint público para PVGIS - não requer autenticação

      const {
        lat,
        lon,
        raddatabase,
        outputformat,
        startyear,
        endyear,
        mountingplace,
        angle,
        aspect
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

      // Chamar o serviço PVGIS MRcalc com todos os parâmetros
      const result = await this.pvgisService.getMonthlyRadiationCalc(latitude, longitude, {
        raddatabase: (raddatabase as string) || 'PVGIS-SARAH2',
        outputformat: (outputformat as string) || 'json',
        startyear: startyear ? parseInt(startyear as string) : 2016,
        endyear: endyear ? parseInt(endyear as string) : 2020,
        mountingplace: (mountingplace as string) || 'free',
        angle: angle ? parseFloat(angle as string) : 0,
        aspect: aspect ? parseFloat(aspect as string) : 0
      });

      this.ok(res, result);
    } catch (error: any) {
      console.error('Erro no proxy PVGIS MRcalc:', error);
      this.internalServerError(res, `Erro ao buscar dados MRcalc do PVGIS: ${error.message}`);
    }
  }
}