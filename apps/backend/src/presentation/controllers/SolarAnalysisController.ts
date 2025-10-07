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
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      
      // Chamar o serviço Python - CORRIGIDO: usar endpoint que existe
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/modules/calculate`,
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
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      
      // Chamar o serviço Python - CORRIGIDO: usar endpoint que existe
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/irradiation/monthly`,
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
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      
      // Chamar o serviço Python - CORRIGIDO: usar endpoint que existe  
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/modules/calculate`,
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
      console.log('\n' + '='.repeat(80));
      console.log('🚀 [NODE.JS - SolarAnalysisController] INÍCIO - calculateAdvancedModules');
      console.log('='.repeat(80));

      const params = req.body;

      console.log('📥 [NODE.JS] REQUEST BODY COMPLETO:');
      console.log(JSON.stringify(params, null, 2));
      console.log('\n📥 [NODE.JS] Campos importantes extraídos:');
      console.log('   - Latitude:', params.lat);
      console.log('   - Longitude:', params.lon);
      console.log('   - Origem dados:', params.origem_dados);
      console.log('   - Período:', params.startyear, '-', params.endyear);
      console.log('   - Consumo Anual:', params.consumo_anual_kwh, 'kWh');
      console.log('   - Módulo:', params.modulo?.fabricante, params.modulo?.modelo);
      console.log('   - Potência Módulo:', params.modulo?.potencia_nominal_w, 'W');
      console.log('   - Águas de telhado:', params.aguasTelhado?.length || 0);

      // Validação dos parâmetros obrigatórios
      if (!params.lat || !params.lon || !params.modulo || !params.consumo_anual_kwh) {
        console.log('❌ [NODE.JS] Validação falhou - parâmetros obrigatórios ausentes');
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: lat, lon, modulo, consumo_anual_kwh');
      }

      console.log('✅ [NODE.JS] Validação inicial passou');

      // Validar que cada água de telhado tem inversor embutido
      if (params.aguasTelhado && params.aguasTelhado.length > 0) {
        const aguasSemInversor = params.aguasTelhado.filter((agua: any) => !agua.inversor);
        if (aguasSemInversor.length > 0) {
          console.log('❌ [NODE.JS] Águas sem inversor:', aguasSemInversor.map((a: any) => a.nome || a.id));
          return this.badRequest(res, `Todas as águas de telhado devem ter um inversor embutido. Águas sem inversor: ${aguasSemInversor.length}`);
        }
        console.log('✅ [NODE.JS] Todas as águas têm inversores embutidos');
      }

      // URL do serviço PVLIB (Python)
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';

      console.log('\n📊 [NODE.JS] Preparando transformação de payload para novo formato /api/v1/solar/calculate...');

      // Calcular consumo mensal a partir do anual
      const consumoMensalKwh = Array(12).fill(params.consumo_anual_kwh / 12);
      console.log('   - Consumo mensal calculado:', consumoMensalKwh[0].toFixed(2), 'kWh/mês');

      // Use perdas from frontend if available, otherwise create defaults
      const perdas = params.perdas || {
        sujeira: 2.0,
        sombreamento: params.aguasTelhado?.[0]?.sombreamentoParcial || 0.0,
        incompatibilidade: 1.0,
        fiacao: 0.5,
        outras: 0.5
      };

      // Log what we're using for debugging
      console.log('📊 [NODE.JS] Perdas detalhadas:', perdas);
      console.log('   - Fonte:', params.perdas ? 'Frontend' : 'Valores padrão');

      // Preparar módulo com parâmetros Sandia (defaults razoáveis se não fornecidos)
      const modulo = {
        fabricante: params.modulo.fabricante,
        modelo: params.modulo.modelo,
        potencia_nominal_w: params.modulo.potencia_nominal_w,
        largura_mm: params.modulo.largura_mm,
        altura_mm: params.modulo.altura_mm,
        peso_kg: params.modulo.peso_kg || 25.0,
        vmpp: params.modulo.vmpp,
        impp: params.modulo.impp,
        voc_stc: params.modulo.voc_stc || (params.modulo.vmpp * 1.2), // Estimativa se não fornecido
        isc_stc: params.modulo.isc_stc || (params.modulo.impp * 1.1), // Estimativa se não fornecido
        eficiencia: params.modulo.eficiencia,
        temp_coef_pmax: params.modulo.temp_coef_pmax,
        // Parâmetros Sandia adicionais com defaults razoáveis
        alpha_sc: params.modulo.alpha_sc || 0.05,
        beta_oc: params.modulo.beta_oc || -0.31,
        gamma_r: params.modulo.gamma_r || params.modulo.temp_coef_pmax || -0.37,
        cells_in_series: params.modulo.cells_in_series || 144,
        a_ref: params.modulo.a_ref || 1.847,
        il_ref: params.modulo.il_ref || params.modulo.impp || 13.9,
        io_ref: params.modulo.io_ref || 3.31e-10,
        rs: params.modulo.rs || 0.207,
        rsh_ref: params.modulo.rsh_ref || 286.5
      };
      console.log('   - Módulo preparado com parâmetros Sandia');

      // Processar águas de telhado e agrupar por inversor
      const inversoresMap = new Map<string, any>();

      if (params.aguasTelhado && params.aguasTelhado.length > 0) {
        console.log(`🏠 [NODE.JS] Processando ${params.aguasTelhado.length} águas de telhado`);

        params.aguasTelhado.forEach((agua: any) => {
          console.log(`   - Água: ${agua.nome} (${agua.orientacao}°, ${agua.inclinacao}°, ${agua.numeroModulos} módulos)`);

          const inversorId = agua.inversorId || `${agua.inversor.fabricante}_${agua.inversor.modelo}`;

          if (!inversoresMap.has(inversorId)) {
            // Criar entrada para novo inversor
            inversoresMap.set(inversorId, {
              inversor: {
                fabricante: agua.inversor.fabricante,
                modelo: agua.inversor.modelo,
                potencia_saida_ca_w: agua.inversor.potencia_saida_ca_w,
                tipo_rede: agua.inversor.tipo_rede,
                potencia_fv_max_w: agua.inversor.potencia_fv_max_w,
                tensao_cc_max_v: agua.inversor.tensao_cc_max_v,
                numero_mppt: agua.inversor.numero_mppt,
                strings_por_mppt: agua.inversor.strings_por_mppt,
                eficiencia_max: agua.inversor.eficiencia_max,
                efficiency_dc_ac: agua.inversor.eficiencia_max / 100 // Converter percentual para decimal
              },
              orientacoes: []
            });
          }

          // Adicionar orientação ao inversor
          const inversorData = inversoresMap.get(inversorId);
          inversorData.orientacoes.push({
            nome: agua.nome,
            orientacao: agua.orientacao,
            inclinacao: agua.inclinacao,
            modulos_por_string: agua.numeroModulos, // Assumindo todos em série por enquanto
            numero_strings: 1 // Pode ser ajustado conforme necessidade
          });
        });

        console.log(`✅ [NODE.JS] ${inversoresMap.size} inversores únicos identificados`);
      }

      // Converter Map para array de inversores
      const inversores = Array.from(inversoresMap.values());

      // Montar payload no novo formato esperado pelo Python
      console.log('🔍 [DEBUG BACKEND] Verificando origem_dados:', {
        'params.origem_dados': params.origem_dados,
        'typeof params.origem_dados': typeof params.origem_dados,
        'params.origem_dados existe': !!params.origem_dados,
        'params completos': params
      });

      // TEMPORÁRIO: Remover fallback para debug
      if (!params.origem_dados) {
        console.error('❌ [DEBUG BACKEND] origem_dados não fornecido em calculateAdvancedModules!');
        return this.badRequest(res, 'origem_dados é obrigatório (PVGIS ou NASA)');
      }

      const pythonParams = {
        lat: params.lat,
        lon: params.lon,
        origem_dados: params.origem_dados, // OBRIGATÓRIO: sem fallback
        startyear: params.startyear || 2015,
        endyear: params.endyear || 2020,
        modelo_decomposicao: params.modelo_decomposicao || 'louche',
        modelo_transposicao: params.modelo_transposicao || 'perez',
        mount_type: params.mount_type || 'open_rack_glass_glass',
        consumo_mensal_kwh: consumoMensalKwh,
        perdas: perdas,
        modulo: modulo,
        inversores: inversores
      };

      console.log('🔍 [DEBUG BACKEND] calculateAdvancedModules - origem_dados usado:', params.origem_dados);

      // Log detalhado dos dados sendo enviados ao Python
      console.log('\n🚀 [NODE.JS] Preparando chamada para API Python (novo formato):');
      console.log('📍 Localização:', { lat: pythonParams.lat, lon: pythonParams.lon });
      console.log('🔋 Módulo:', pythonParams.modulo.fabricante, pythonParams.modulo.modelo);
      console.log('🎯 Consumo mensal:', pythonParams.consumo_mensal_kwh[0].toFixed(2), 'kWh/mês');
      console.log('📊 Perdas:', pythonParams.perdas);
      console.log('🏠 Inversores:', pythonParams.inversores.length);

      // 💾 SALVAR PAYLOAD EM ARQUIVO JSON
      try {
        const fs = require('fs');
        const path = require('path');

        // Criar pasta para payloads se não existir
        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-new-solar-calculate-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        // Salvar payload
        fs.writeFileSync(filepath, JSON.stringify(pythonParams, null, 2), 'utf8');
        console.log(`💾 [NODE.JS] Payload salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [NODE.JS] Erro ao salvar payload:', error);
      }

      console.log('\n🌐 [NODE.JS] Chamando API Python - /api/v1/solar/calculate (NOVO ENDPOINT)');
      console.log('   - URL:', `${pythonServiceUrl}/api/v1/solar/calculate`);
      console.log('   - Timeout: 180s');

      // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
      try {
        const fs = require('fs');
        const path = require('path');

        // Criar pasta para payloads se não existir
        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-solar-calculate-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        // Salvar payload
        fs.writeFileSync(filepath, JSON.stringify(pythonParams, null, 2), 'utf8');
        console.log(`💾 [SolarAnalysisController] Payload solar salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [SolarAnalysisController] Erro ao salvar payload solar:', error);
      }

      // Chamar novo endpoint de cálculo solar completo
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/solar/calculate`,
        pythonParams,
        {
          timeout: 180000, // 3 minutos para ModelChain + PVGIS
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✅ [NODE.JS] Resposta recebida do Python');
      console.log('📊 Resultado do dimensionamento:');
      console.log(`   - Status HTTP: ${response.status}`);
      console.log(`   - Keys da resposta:`, Object.keys(response.data));

      // Verificar se a resposta contém os dados esperados
      if (response.data) {
        console.log(`   - Potência total: ${response.data.potencia_total_kwp || 'N/A'} kWp`);
        console.log(`   - Energia anual: ${response.data.energia_anual_kwh || 'N/A'} kWh`);
        console.log(`   - Energia DC anual: ${response.data.energia_dc_anual_kwh || 'N/A'} kWh`);
        console.log(`   - Perda clipping: ${response.data.perda_clipping_pct || 'N/A'}%`);
        console.log(`   - PR Total: ${response.data.pr_total || 'N/A'}%`);
      }

      // Padronizar resposta para o frontend (mantendo compatibilidade com formato anterior)
      const pythonData = response.data;

      // Calcular breakdown detalhado de perdas (fallback se Python não fornecer)
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

      // Calcular número de módulos a partir da potência total
      const modulePowerKw = (params.modulo?.potencia_nominal_w || 550) / 1000;
      const num_modulos = Math.round(pythonData.potencia_total_kwp / modulePowerKw);

      // Padronizar resposta para o frontend
      const standardizedData = {
        num_modulos: num_modulos,
        potencia_total_kw: pythonData.potencia_total_kwp,
        energia_por_modulo_kwh: pythonData.energia_por_modulo,
        energia_total_anual_kwh: pythonData.energia_anual_kwh,
        energia_dc_anual_kwh: pythonData.energia_dc_anual_kwh,
        perda_clipping_kwh: pythonData.perda_clipping_kwh,
        perda_clipping_pct: pythonData.perda_clipping_pct,
        geracao_mensal_kwh: pythonData.geracao_mensal_kwh,
        consumo_anual_kwh: pythonData.consumo_anual_kwh,
        yield_especifico: pythonData.yield_especifico,
        cobertura_percentual: pythonData.cobertura_percentual,
        fator_capacidade: pythonData.fator_capacidade,
        pr_total: pythonData.pr_total,
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
        // Breakdown detalhado de perdas (usar dados do Python se disponíveis, senão usar calculados pelo Node.js)
        perdas_detalhadas: pythonData.perdas_detalhadas || detailedLosses,
        parametros_completos: {
          consumo_anual_kwh: params.consumo_anual_kwh,
          localizacao: { lat: params.lat, lon: params.lon },
          modulo: {
            ...params.modulo,
            // Converter W para kW e renomear com unidades
            potencia_nominal_kw: params.modulo.potencia_nominal_w / 1000,
            potencia_nominal_w: undefined // Remover campo original
          },
          perdas: perdas, // Use the detailed perdas object
          fator_seguranca: params.fator_seguranca || 1.1
        },
        dados_processados: pythonData.dados_processados,
        anos_analisados: pythonData.anos_analisados,
        periodo_dados: pythonData.periodo_dados,
        // Incluir dados das águas de telhado (mantendo formato original para compatibilidade)
        aguas_telhado: params.aguasTelhado,
        // Incluir dados dos inversores no novo formato (se disponível na resposta)
        inversores: pythonData.inversores
      };

      // Limpar campos undefined
      const cleanData = JSON.parse(JSON.stringify(standardizedData));

      console.log('\n✅ [NODE.JS] Resposta final preparada. Enviando ao cliente...');
      console.log('   - success: true');
      console.log('   - num_modulos:', cleanData.num_modulos, '(calculado)');
      console.log('   - potencia_total_kw:', cleanData.potencia_total_kw, 'kWp');
      console.log('   - energia_total_anual_kwh:', cleanData.energia_total_anual_kwh, 'kWh');
      console.log('   - pr_total:', cleanData.pr_total, '%');
      console.log('   - yield_especifico:', cleanData.yield_especifico, 'kWh/kWp');
      console.log('   - inversores:', cleanData.inversores?.length || 0);
      console.log('   - aguas_telhado:', cleanData.aguas_telhado?.length || 0);
      console.log('='.repeat(80));
      console.log('🏁 [NODE.JS - SolarAnalysisController] FIM - calculateAdvancedModules');
      console.log('='.repeat(80) + '\n');

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
        console.error('❌ Erro 422 - Detalhes:', error.response.data);
        return this.badRequest(res, error.response.data.detail || 'Parâmetros inválidos');
      }

      if (error.response?.status === 502) {
        return this.internalServerError(res, 'Erro na comunicação com PVGIS. Tente novamente.');
      }

      if (error.response?.status === 500) {
        console.error('❌ Erro 500 - Detalhes:', error.response.data);
        return this.internalServerError(res, error.response.data?.error || 'Erro interno no serviço de cálculos.');
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
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      
      // Preparar parâmetros para a API Python (seguindo o schema IrradiationAnalysisRequest)
      console.log('🔍 [DEBUG BACKEND] analyzeMonthlyIrradiation - Verificando data_source:', {
        'params.data_source': params.data_source,
        'typeof params.data_source': typeof params.data_source,
        'params.data_source existe': !!params.data_source,
        'params completos': params
      });

      // TEMPORÁRIO: Remover fallback para debug
      if (!params.data_source) {
        console.error('❌ [DEBUG BACKEND] data_source não fornecido em analyzeMonthlyIrradiation!');
        return this.badRequest(res, 'data_source é obrigatório (pvgis ou nasa)');
      }

      const pythonParams = {
        lat: parseFloat(params.lat),
        lon: parseFloat(params.lon),
        tilt: params.tilt || 0,
        azimuth: params.azimuth || 0,
        modelo_decomposicao: params.modelo_decomposicao || 'erbs',
        data_source: params.data_source  // OBRIGATÓRIO: sem fallback
      };

      console.log('🔍 [DEBUG BACKEND] analyzeMonthlyIrradiation - data_source usado:', params.data_source);

      console.log('🌍 Fonte de dados solicitada:', pythonParams.data_source);

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

      console.log('✅ Fonte de dados utilizada:', response.data.configuracao.fonte_dados);
      if (response.data.configuracao.fonte_dados !== params.data_source) {
        console.log('⚠️ FALLBACK: Fonte diferente da solicitada (fallback automático ativado)');
      }

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
        fonteDados: response.data.configuracao.fonte_dados,  // NOVO: fonte realmente utilizada
        message: `Dados de irradiação obtidos com sucesso de ${response.data.configuracao.fonte_dados} para ${response.data.coordenadas.lat.toFixed(4)}, ${response.data.coordenadas.lon.toFixed(4)}`
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
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';
      
      // Buscar dados de irradiação mensal
      const irradiationResponse = await axios.post(
        `${pythonServiceUrl}/api/v1/irradiation/monthly`,
        {
          lat: parseFloat(lat as string),
          lon: parseFloat(lon as string),
          tilt: tilt ? parseFloat(tilt as string) : 0,
          azimuth: azimuth ? parseFloat(azimuth as string) : 0,
          modelo_decomposicao: 'erbs',
          data_source: (req.query.data_source as string) || 'pvgis'  // NOVO
        },
        { timeout: 30000 }
      );

      return this.ok(res, {
        irradiacaoMensal: irradiationResponse.data.irradiacao_mensal,
        mediaAnual: irradiationResponse.data.media_anual,
        configuracao: irradiationResponse.data.configuracao,
        fonteDados: irradiationResponse.data.configuracao.fonte_dados,  // NOVO
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
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';

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
      console.log('📊 Valores chave para economia:', {
        geracao_anual_total: financialInput.geracao_mensal.reduce((a: number, b: number) => a + b, 0),
        consumo_anual_total: financialInput.consumo_mensal.reduce((a: number, b: number) => a + b, 0),
        tarifa_energia: financialInput.tarifa_energia,
        custo_fio_b: financialInput.custo_fio_b,
        investimento_inicial: financialInput.investimento_inicial
      });

      // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
      try {
        const fs = require('fs');
        const path = require('path');

        // Criar pasta para payloads se não existir
        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-financial-calculate-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        // Salvar payload
        fs.writeFileSync(filepath, JSON.stringify(financialInput, null, 2), 'utf8');
        console.log(`💾 [SolarAnalysisController] Payload financeiro salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [SolarAnalysisController] Erro ao salvar payload financeiro:', error);
      }
      
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
        // Investimento
        investimento_inicial: financialInput.investimento_inicial,
        
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

  async calculateMPPTLimits(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;

      console.log('🔄 Recebendo requisição de cálculo MPPT:', JSON.stringify(params, null, 2));

      // Validação dos parâmetros obrigatórios
      if (!params.fabricante || !params.modelo || !params.potencia_modulo_w || !params.voc_stc || !params.temp_coef_voc || !params.latitude || !params.longitude) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: fabricante, modelo, potencia_modulo_w, voc_stc, temp_coef_voc, latitude, longitude');
      }

      // URL do serviço PVLIB (Python)
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';

      console.log('🚀 Enviando para API Python (MPPT):', JSON.stringify(params, null, 2));

      // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
      try {
        const fs = require('fs');
        const path = require('path');

        // Criar pasta para payloads se não existir
        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-mppt-calculate-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        // Salvar payload
        fs.writeFileSync(filepath, JSON.stringify(params, null, 2), 'utf8');
        console.log(`💾 [SolarAnalysisController] Payload MPPT salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [SolarAnalysisController] Erro ao salvar payload MPPT:', error);
      }

      // Chamar a API Python (MPPT Calculation)
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/mppt/calculate-modules-per-mppt`,
        params,
        {
          timeout: 30000, // 30 segundos para cálculos MPPT
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Resposta da API Python (MPPT):', {
        status: response.status,
        modulos_por_mppt: response.data.modulos_por_mppt,
        modulos_total_sistema: response.data.modulos_total_sistema,
        limitacao_principal: response.data.limitacao_principal
      });

      // Retornar diretamente a resposta da API Python (já está no formato correto)
      return res.status(200).json(response.data);

    } catch (error: any) {
      console.error('❌ Erro ao calcular limites MPPT:', error);

      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço PVLIB indisponível. Tente novamente em alguns instantes.');
      }

      if (error.response?.status === 422) {
        return this.badRequest(res, error.response.data.detail || 'Parâmetros inválidos para cálculo MPPT');
      }

      if (error.response?.status === 500) {
        return this.internalServerError(res, 'Erro interno no serviço de cálculos MPPT.');
      }

      if (error.response?.data?.detail) {
        return this.badRequest(res, error.response.data.detail);
      }

      return this.internalServerError(res, 'Erro interno no cálculo de limites MPPT');
    }
  }

  async calculateCompleteSolarSystem(req: Request, res: Response): Promise<Response> {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('🚀 [NODE.JS - SolarAnalysisController] INÍCIO - calculateCompleteSolarSystem');
      console.log('='.repeat(80));

      const params = req.body;

      console.log('📥 [NODE.JS] Dados recebidos na requisição:');
      console.log('   - Latitude:', params.lat);
      console.log('   - Longitude:', params.lon);
      console.log('   - Origem dados:', params.origem_dados);
      console.log('   - Período:', params.startyear, '-', params.endyear);
      console.log('   - Modelo decomposição:', params.modelo_decomposicao);
      console.log('   - Modelo transposição:', params.modelo_transposicao);
      console.log('   - Consumo mensal:', params.consumo_mensal_kwh?.reduce((a: number, b: number) => a + b, 0), 'kWh/ano');
      console.log('   - Módulo:', params.modulo?.fabricante, params.modulo?.modelo);
      console.log('   - Inversores:', params.inversores?.length || 0);

      // Validação dos parâmetros obrigatórios
      if (!params.lat || !params.lon) {
        console.log('❌ [NODE.JS] Validação falhou - lat/lon ausentes');
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: lat, lon');
      }

      if (!params.modulo) {
        console.log('❌ [NODE.JS] Validação falhou - módulo ausente');
        return this.badRequest(res, 'Parâmetro obrigatório ausente: modulo');
      }

      if (!params.inversores || !Array.isArray(params.inversores) || params.inversores.length === 0) {
        console.log('❌ [NODE.JS] Validação falhou - inversores ausentes ou inválidos');
        return this.badRequest(res, 'Parâmetro obrigatório ausente ou inválido: inversores (deve ser um array com ao menos 1 inversor)');
      }

      if (!params.consumo_mensal_kwh || !Array.isArray(params.consumo_mensal_kwh) || params.consumo_mensal_kwh.length !== 12) {
        console.log('❌ [NODE.JS] Validação falhou - consumo_mensal_kwh ausente ou inválido');
        return this.badRequest(res, 'Parâmetro obrigatório ausente ou inválido: consumo_mensal_kwh (deve ser um array com 12 valores)');
      }

      console.log('✅ [NODE.JS] Validação inicial passou');

      // URL do serviço PVLIB (Python)
      const pythonServiceUrl = process.env.ENERGY_SERVICE_URL || 'http://localhost:8110';

      console.log('\n🌐 [NODE.JS] Chamando API Python - /api/v1/solar/calculate');
      console.log('   - URL:', `${pythonServiceUrl}/api/v1/solar/calculate`);
      console.log('   - Timeout: 180s');

      // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
      try {
        const fs = require('fs');
        const path = require('path');

        // Criar pasta para payloads se não existir
        const payloadsDir = path.join(process.cwd(), 'payloads');
        if (!fs.existsSync(payloadsDir)) {
          fs.mkdirSync(payloadsDir, { recursive: true });
        }

        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `payload-complete-solar-${timestamp}.json`;
        const filepath = path.join(payloadsDir, filename);

        // Salvar payload
        fs.writeFileSync(filepath, JSON.stringify(params, null, 2), 'utf8');
        console.log(`💾 [NODE.JS] Payload salvo em: ${filepath}`);
      } catch (error) {
        console.error('❌ [NODE.JS] Erro ao salvar payload:', error);
      }

      // Chamar endpoint de cálculo completo do sistema solar (PVGIS + ModelChain)
      const response = await axios.post(
        `${pythonServiceUrl}/api/v1/solar/calculate`,
        params,
        {
          timeout: 180000, // 3 minutos para PVGIS + ModelChain completo
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✅ [NODE.JS] Resposta recebida do Python');
      console.log('📊 Resultado do cálculo completo:');
      console.log(`   - Status HTTP: ${response.status}`);

      // Log detalhado da estrutura da resposta
      if (response.data) {
        console.log('   - Keys da resposta:', Object.keys(response.data));

        // Log de campos relevantes se existirem
        if (response.data.potencia_total_kw) {
          console.log(`   - Potência total: ${response.data.potencia_total_kw} kW`);
        }
        if (response.data.energia_total_anual_kwh) {
          console.log(`   - Energia anual: ${response.data.energia_total_anual_kwh} kWh`);
        }
        if (response.data.num_modulos) {
          console.log(`   - Número de módulos: ${response.data.num_modulos}`);
        }
      }

      console.log('\n✅ [NODE.JS] Resposta final preparada. Enviando ao cliente...');
      console.log('='.repeat(80));
      console.log('🏁 [NODE.JS - SolarAnalysisController] FIM - calculateCompleteSolarSystem');
      console.log('='.repeat(80) + '\n');

      // Retornar diretamente a resposta da API Python
      return res.status(200).json(response.data);

    } catch (error: any) {
      console.error('❌ Erro ao calcular sistema solar completo:', error);

      if (error.code === 'ECONNREFUSED') {
        return this.internalServerError(res, 'Serviço PVLIB indisponível. Tente novamente em alguns instantes.');
      }

      if (error.response?.status === 422) {
        console.error('❌ Erro 422 - Detalhes:', error.response.data);
        return this.badRequest(res, error.response.data.detail || 'Parâmetros inválidos');
      }

      if (error.response?.status === 502) {
        return this.internalServerError(res, 'Erro na comunicação com PVGIS. Tente novamente.');
      }

      if (error.response?.status === 500) {
        console.error('❌ Erro 500 - Detalhes:', error.response.data);
        return this.internalServerError(res, error.response.data?.error || 'Erro interno no serviço de cálculos.');
      }

      if (error.response?.data?.error) {
        return this.internalServerError(res, error.response.data.error);
      }

      return this.internalServerError(res, 'Erro interno no cálculo completo do sistema solar');
    }
  }
}