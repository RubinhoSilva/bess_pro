import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AnalyzeSolarPotentialUseCase } from '../../application/use-cases/solar/AnalyzeSolarPotentialUseCase';
import { LossesCalculationService, SystemLosses } from '../../application/services/LossesCalculationService';
import axios from 'axios';

export class SolarAnalysisController extends BaseController {
  constructor(private analyzeSolarPotentialUseCase: AnalyzeSolarPotentialUseCase) {
    super();
  }

  async analyzePotential(req: Request, res: Response): Promise<Response> {
    try {
      const { latitude, longitude, systemSizeKw, tilt, azimuth } = req.body;

      if (!latitude || !longitude) {
        return this.badRequest(res, 'Latitude e longitude são obrigatórios');
      }

      const result = await this.analyzeSolarPotentialUseCase.execute({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        systemSizeKw: systemSizeKw ? parseFloat(systemSizeKw) : undefined,
        tilt: tilt ? parseFloat(tilt) : undefined,
        azimuth: azimuth ? parseFloat(azimuth) : undefined
      });

      if (result.isSuccess) {
        return this.ok(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Solar analysis error:', error);
      return this.internalServerError(res, 'Erro interno na análise solar');
    }
  }

  async calculateSolarSystem(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;

      // Validação básica
      if (!params) {
        return this.badRequest(res, 'Parâmetros não fornecidos');
      }

      // URL do serviço PVLIB (Python) - usar nome do container Docker
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';
      
      // Chamar o serviço Python
      const response = await axios.post(
        `${pythonServiceUrl}/calculate-solar-system`,
        params,
        {
          timeout: 10000, // 10 segundos
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        return this.ok(res, {
          potenciaPico: response.data.potenciaPico,
          geracaoAnual: response.data.geracaoAnual,
          areaNecessaria: response.data.areaNecessaria,
          message: response.data.message
        });
      } else {
        return this.badRequest(res, response.data.message || 'Erro no cálculo');
      }

    } catch (error: any) {
      console.error('Erro ao calcular sistema solar:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço de cálculo indisponível');
      }
      
      if (error.response?.data?.message) {
        return this.badRequest(res, error.response.data.message);
      }

      return this.internalServerError(res, 'Erro interno no cálculo do sistema solar');
    }
  }

  async calculateIrradiationCorrection(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;

      // Validação básica
      if (!params) {
        return this.badRequest(res, 'Parâmetros não fornecidos');
      }

      // URL do serviço PVLIB (Python) - usar nome do container Docker
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';
      
      // Chamar o serviço Python
      const response = await axios.post(
        `${pythonServiceUrl}/calculate-irradiation-correction`,
        params,
        {
          timeout: 10000, // 10 segundos
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        return this.ok(res, {
          irradiacaoCorrigida: response.data.irradiacaoCorrigida,
          message: response.data.message
        });
      } else {
        return this.badRequest(res, response.data.message || 'Erro no cálculo de irradiação');
      }

    } catch (error: any) {
      console.error('Erro ao calcular irradiação corrigida:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço de cálculo indisponível');
      }
      
      if (error.response?.data?.message) {
        return this.badRequest(res, error.response.data.message);
      }

      return this.internalServerError(res, 'Erro interno no cálculo de irradiação corrigida');
    }
  }

  async calculateModuleCount(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;

      // Validação básica
      if (!params) {
        return this.badRequest(res, 'Parâmetros não fornecidos');
      }

      // URL do serviço PVLIB (Python) - usar nome do container Docker
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';
      
      // Chamar o serviço Python
      const response = await axios.post(
        `${pythonServiceUrl}/calculate-module-count`,
        params,
        {
          timeout: 10000, // 10 segundos
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        return this.ok(res, {
          numeroModulos: response.data.numeroModulos,
          message: response.data.message
        });
      } else {
        return this.badRequest(res, response.data.message || 'Erro no cálculo do número de módulos');
      }

    } catch (error: any) {
      console.error('Erro ao calcular número de módulos:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço de cálculo indisponível');
      }
      
      if (error.response?.data?.message) {
        return this.badRequest(res, error.response.data.message);
      }

      return this.internalServerError(res, 'Erro interno no cálculo do número de módulos');
    }
  }

  async calculateAdvancedModules(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;
      
      console.log('🔄 Recebendo requisição de cálculo avançado de módulos:', JSON.stringify(params, null, 2));
      console.log('🔍 DEBUG - Inversor original:', JSON.stringify(params.inversor, null, 2));

      // Validação dos parâmetros obrigatórios
      if (!params.lat || !params.lon || !params.modulo || !params.inversor || !params.consumo_anual_kwh) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: lat, lon, modulo, inversor, consumo_anual_kwh');
      }

      // URL do serviço PVLIB (Python)
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';

      // Função para incluir apenas campos definidos
      const mapField = (value: any) => value !== undefined && value !== null ? value : undefined;
      const includeField = (obj: any, key: string, value: any) => {
        if (value !== undefined && value !== null) {
          obj[key] = value;
        }
      };

      // Mapear campos do frontend (camelCase) para Python (snake_case)
      const mappedInversor: any = {
        fabricante: params.inversor.fabricante,
        modelo: params.inversor.modelo,
        potencia_saida_ca_w: params.inversor.potenciaSaidaCA || params.inversor.potencia_saida_ca_w,
        tipo_rede: params.inversor.tipoRede || params.inversor.tipo_rede
      };

      // Adicionar campos opcionais apenas se existirem
      includeField(mappedInversor, 'potencia_fv_max_w', params.inversor.potenciaFvMax || params.inversor.potencia_fv_max_w);
      includeField(mappedInversor, 'tensao_cc_max_v', params.inversor.tensaoCcMax || params.inversor.tensao_cc_max_v);
      includeField(mappedInversor, 'numero_mppt', params.inversor.numeroMppt || params.inversor.numero_mppt);
      includeField(mappedInversor, 'strings_por_mppt', params.inversor.stringsPorMppt || params.inversor.strings_por_mppt);
      includeField(mappedInversor, 'vdco', params.inversor.vdco);
      includeField(mappedInversor, 'pso', params.inversor.pso);
      includeField(mappedInversor, 'c0', params.inversor.c0);
      includeField(mappedInversor, 'c1', params.inversor.c1);
      includeField(mappedInversor, 'c2', params.inversor.c2);
      includeField(mappedInversor, 'c3', params.inversor.c3);
      includeField(mappedInversor, 'pnt', params.inversor.pnt);

      console.log('🔍 DEBUG - Inversor mapeado:', JSON.stringify(mappedInversor, null, 2));

      const pythonParams = {
        ...params,
        inversor: mappedInversor,
        // Incluir num_modules se fornecido (para uso específico do slider)
        num_modules: params.num_modules || params.numeroModulos || undefined
      };

      // Log específico quando num_modules é fornecido
      if (pythonParams.num_modules) {
        console.log('🎯 SLIDER: Usando número específico de módulos:', pythonParams.num_modules);
      } else {
        console.log('🔢 AUTO: Calculando número de módulos automaticamente');
      }
      
      console.log('🚀 Enviando para API Python (módulos avançados):', JSON.stringify(pythonParams, null, 2));
      
      // Chamar a API Python (Cálculo avançado de módulos)
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/modules/calculate`,
        pythonParams,
        {
          timeout: 120000, // 2 minutos para ModelChain + PVGIS
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Resposta da API Python (módulos):', {
        status: response.status,
        numModulos: response.data.num_modulos,
        potenciaTotal: response.data.potencia_total_kw
      });

      // Padronizar resposta: converter W para kW e organizar formato
      const pythonData = response.data;
      
      // Calcular breakdown detalhado de perdas
      const systemLosses: SystemLosses = {
        perdaTemperatura: params.perdaTemperatura || 8,
        perdaSombreamento: params.perdaSombreamento || 3,
        perdaMismatch: params.perdaMismatch || 2,
        perdaCabeamento: params.perdaCabeamento || 2,
        perdaSujeira: params.perdaSujeira || 5,
        perdaInversor: params.perdaInversor || 3,
        perdaOutras: params.perdaOutras || 0
      };
      
      const detailedLosses = LossesCalculationService.calculateDetailedLosses(
        systemLosses,
        params.lat
      );
      
      const standardizedData = {
        num_modulos: pythonData.num_modulos,
        potencia_total_kw: pythonData.potencia_total_kw,
        energia_por_modulo_kwh: pythonData.energia_por_modulo,
        energia_total_anual_kwh: pythonData.energia_total_anual,
        cobertura_percentual: pythonData.cobertura_percentual,
        fator_capacidade: pythonData.fator_capacidade,
        hsp_equivalente_dia: pythonData.hsp_equivalente_dia,
        hsp_equivalente_anual: pythonData.hsp_equivalente_anual,
        energia_anual_std: pythonData.energia_anual_std,
        variabilidade_percentual: pythonData.variabilidade_percentual,
        energia_por_ano: pythonData.energia_por_ano,
        energia_diaria_media: pythonData.energia_diaria_media,
        energia_diaria_std: pythonData.energia_diaria_std,
        energia_diaria_min: pythonData.energia_diaria_min,
        energia_diaria_max: pythonData.energia_diaria_max,
        compatibilidade_sistema: pythonData.compatibilidade_sistema,
        area_necessaria_m2: pythonData.area_necessaria_m2,
        peso_total_kg: pythonData.peso_total_kg,
        economia_anual_co2: pythonData.economia_anual_co2,
        // Breakdown detalhado de perdas
        perdas_detalhadas: detailedLosses,
        parametros_completos: {
          consumo_anual_kwh: pythonData.parametros_completos.consumo_anual_kwh,
          localizacao: pythonData.parametros_completos.localizacao,
          orientacao: pythonData.parametros_completos.orientacao,
          modulo: {
            ...pythonData.parametros_completos.modulo,
            // Converter W para kW e renomear com unidades
            potencia_nominal_kw: pythonData.parametros_completos.modulo.potencia_nominal_w / 1000,
            potencia_nominal_w: undefined // Remover campo original
          },
          inversor: {
            ...pythonData.parametros_completos.inversor,
            // Converter W para kW
            potencia_saida_ca_kw: pythonData.parametros_completos.inversor.potencia_saida_ca_w / 1000,
            potencia_fv_max_kw: pythonData.parametros_completos.inversor.potencia_fv_max_w ? 
              pythonData.parametros_completos.inversor.potencia_fv_max_w / 1000 : null,
            // Remover campos originais em W
            potencia_saida_ca_w: undefined,
            potencia_fv_max_w: undefined
          },
          perdas_sistema: pythonData.parametros_completos.perdas_sistema,
          fator_seguranca: pythonData.parametros_completos.fator_seguranca
        },
        dados_processados: pythonData.dados_processados,
        anos_analisados: pythonData.anos_analisados,
        periodo_dados: pythonData.periodo_dados
      };

      // Limpar campos undefined
      const cleanData = JSON.parse(JSON.stringify(standardizedData));

      return res.status(200).json({
        success: true,
        data: cleanData,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Erro ao calcular módulos avançados:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço PVLIB indisponível. Tente novamente em alguns instantes.');
      }
      
      if (error.response?.status === 422) {
        return this.badRequest(res, error.response.data.detail || 'Parâmetros inválidos');
      }

      if (error.response?.status === 502) {
        return this.internalServerError(res, 'Erro na comunicação com PVGIS. Tente novamente.');
      }
      
      if (error.response?.data?.error) {
        return this.internalServerError(res, error.response.data.error);
      }
      
      return this.internalServerError(res, 'Erro interno no cálculo avançado de módulos');
    }
  }

  async analyzeMonthlyIrradiation(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;
      
      console.log('🔄 Recebendo requisição de análise de irradiação mensal:', params);

      // Validação dos parâmetros obrigatórios
      if (!params.lat || !params.lon) {
        return this.badRequest(res, 'Latitude e longitude são obrigatórios');
      }

      // URL do serviço PVLIB (Python) - usar nome do container Docker
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';
      
      // Preparar parâmetros para a API Python (seguindo o schema IrradiationAnalysisRequest)
      const pythonParams = {
        lat: parseFloat(params.lat),
        lon: parseFloat(params.lon),
        tilt: params.tilt || 0,
        azimuth: params.azimuth || 0,
        modelo_decomposicao: params.modelo_decomposicao || 'erbs'
      };

      console.log('🚀 Enviando para API Python:', pythonParams);
      
      // Chamar a API Python (Análise de irradiação solar mensal)
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/irradiation/monthly`,
        pythonParams,
        {
          timeout: 120000, // 2 minutos para dados PVGIS (demora mesmo)
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Resposta da API Python recebida:', {
        status: response.status,
        dataKeys: Object.keys(response.data),
        mediaAnual: response.data.media_anual
      });

      // Retornar dados formatados para o frontend
      return this.ok(res, {
        irradiacaoMensal: response.data.irradiacao_mensal,
        mediaAnual: response.data.media_anual,
        maximo: response.data.maximo,
        minimo: response.data.minimo,
        variacaoSazonal: response.data.variacao_sazonal,
        configuracao: response.data.configuracao,
        coordenadas: response.data.coordenadas,
        periodoAnalise: response.data.periodo_analise,
        registrosProcessados: response.data.registros_processados,
        message: `Dados de irradiação obtidos com sucesso para ${response.data.coordenadas.lat.toFixed(4)}, ${response.data.coordenadas.lon.toFixed(4)}`
      });

    } catch (error: any) {
      console.error('❌ Erro ao analisar irradiação mensal:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço PVLIB indisponível. Tente novamente em alguns instantes.');
      }
      
      if (error.response?.status === 422) {
        return this.badRequest(res, error.response.data.detail || 'Parâmetros inválidos');
      }

      if (error.response?.status === 502) {
        return this.internalServerError(res, 'Erro na comunicação com PVGIS. Tente novamente.');
      }
      
      if (error.response?.data?.error) {
        return this.internalServerError(res, error.response.data.error);
      }
      
      return this.internalServerError(res, 'Erro interno na análise de irradiação');
    }
  }

  async getEnhancedAnalysisData(req: Request, res: Response): Promise<Response> {
    try {
      const { lat, lon, tilt, azimuth } = req.query;

      if (!lat || !lon) {
        return this.badRequest(res, 'Latitude e longitude são obrigatórios');
      }

      // URL do serviço PVLIB (Python)
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';
      
      // Buscar dados de irradiação mensal
      const irradiationResponse = await axios.post(
        `${pythonServiceUrl}/api/v1/irradiation/monthly`,
        {
          lat: parseFloat(lat as string),
          lon: parseFloat(lon as string),
          tilt: tilt ? parseFloat(tilt as string) : 0,
          azimuth: azimuth ? parseFloat(azimuth as string) : 0,
          modelo_decomposicao: 'erbs'
        },
        { timeout: 30000 }
      );

      return this.ok(res, {
        irradiacaoMensal: irradiationResponse.data.irradiacao_mensal,
        mediaAnual: irradiationResponse.data.media_anual,
        configuracao: irradiationResponse.data.configuracao,
        coordenadas: {
          lat: parseFloat(lat as string),
          lon: parseFloat(lon as string)
        }
      });

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados para análise avançada:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço PVLIB indisponível');
      }
      
      return this.internalServerError(res, 'Erro interno na busca de dados de análise');
    }
  }

  async calculateAdvancedFinancialAnalysis(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;
      
      console.log('🔄 Recebendo requisição de análise financeira avançada:', JSON.stringify(params, null, 2));

      // Validação dos parâmetros obrigatórios
      if (!params.investimento_inicial || !params.geracao_mensal || !params.consumo_mensal || !params.tarifa_energia) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: investimento_inicial, geracao_mensal, consumo_mensal, tarifa_energia');
      }

      // URL do serviço PVLIB (Python)
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';

      // Mapear campos do frontend para o formato esperado pela API Python
      const financialInput = {
        investimento_inicial: params.investimento_inicial,
        geracao_mensal: params.geracao_mensal,
        consumo_mensal: params.consumo_mensal,
        tarifa_energia: params.tarifa_energia,
        custo_fio_b: params.custo_fio_b || 0.3,
        vida_util: params.vida_util || 25,
        taxa_desconto: params.taxa_desconto || 8.0,
        inflacao_energia: params.inflacao_energia || 4.5,
        degradacao_modulos: params.degradacao_modulos || 0.5,
        custo_om: params.custo_om || 0,
        inflacao_om: params.inflacao_om || 4.0,
        modalidade_tarifaria: params.modalidade_tarifaria || 'convencional'
      };

      console.log('🚀 Enviando para API Python (análise financeira):', JSON.stringify(financialInput, null, 2));
      
      // Chamar a API Python (Análise Financeira Avançada)
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/financial/calculate-advanced`,
        financialInput,
        {
          timeout: 60000, // 1 minuto para cálculos financeiros
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Resposta da API Python (análise financeira):', {
        status: response.status,
        success: response.data.success,
        vpl: response.data.data?.vpl,
        tir: response.data.data?.tir
      });

      // Padronizar resposta para o frontend
      const financialData = response.data.data;
      
      const standardizedData = {
        // Indicadores principais
        vpl: financialData.vpl,
        tir: financialData.tir,
        payback_simples: financialData.payback_simples,
        payback_descontado: financialData.payback_descontado,
        economia_total_25_anos: financialData.economia_total_25_anos,
        economia_anual_media: financialData.economia_anual_media,
        lucratividade_index: financialData.lucratividade_index,
        
        // Fluxo de caixa detalhado
        cash_flow: financialData.cash_flow,
        
        // Indicadores de performance
        indicadores: financialData.indicadores,
        
        // Análise de sensibilidade
        sensibilidade: financialData.sensibilidade,
        
        // Análise de cenários
        cenarios: financialData.cenarios
      };

      return res.status(200).json({
        success: true,
        data: standardizedData,
        timestamp: new Date().toISOString(),
        message: 'Análise financeira avançada calculada com sucesso'
      });

    } catch (error: any) {
      console.error('❌ Erro ao calcular análise financeira avançada:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço PVLIB indisponível. Tente novamente em alguns instantes.');
      }
      
      if (error.response?.status === 422) {
        return this.badRequest(res, error.response.data.detail || 'Parâmetros inválidos');
      }

      if (error.response?.status === 500) {
        return this.internalServerError(res, 'Erro interno no serviço de cálculos financeiros.');
      }
      
      if (error.response?.data?.error) {
        return this.internalServerError(res, error.response.data.error);
      }
      
      return this.internalServerError(res, 'Erro interno na análise financeira avançada');
    }
  }
}