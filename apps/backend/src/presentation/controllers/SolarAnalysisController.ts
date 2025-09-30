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
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';
      
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
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';
      
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

      // NOVO: Verificar se está usando sistema multi-inversor (selectedInverters)
      let isMultiInverterSystem = false;
      let totalInverterCapacity = 0;
      let totalMpptChannels = 0;
      
      if (params.selectedInverters && params.selectedInverters.length > 0) {
        isMultiInverterSystem = true;
        console.log('🔄 MULTI-INVERSOR: Detectado sistema com múltiplos inversores:', params.selectedInverters.length);
        
        // Calcular totais do sistema multi-inversor
        params.selectedInverters.forEach((inverter: any, index: number) => {
          const inverterCapacity = inverter.potenciaSaidaCA * inverter.quantity;
          const mpptChannels = inverter.numeroMppt * inverter.quantity;
          totalInverterCapacity += inverterCapacity;
          totalMpptChannels += mpptChannels;
          
          console.log(`📊 Inversor ${index + 1}: ${inverter.fabricante} ${inverter.modelo}`);
          console.log(`   - Quantidade: ${inverter.quantity}x`);
          console.log(`   - Potência unitária: ${inverter.potenciaSaidaCA}W`);
          console.log(`   - Potência total: ${inverterCapacity}W`);
          console.log(`   - MPPT por unidade: ${inverter.numeroMppt}`);
          console.log(`   - Total MPPT: ${mpptChannels}`);
        });
        
        console.log(`⚡ TOTAIS DO SISTEMA:`);
        console.log(`   - Potência total dos inversores: ${totalInverterCapacity}W`);
        console.log(`   - Total de canais MPPT: ${totalMpptChannels}`);
        
        // TODO: Implementar integração completa com multi-inverter service Python
        // Por enquanto, usar o primeiro inversor para compatibilidade com a API legada
        const primeiroInversor = params.selectedInverters[0];
        
        // Mapear do formato selectedInverters para o formato legado 'inversor'
        // IMPORTANTE: Usar o primeiro inversor como referência, mas adicionar dados agregados
        params.inversor = {
          fabricante: primeiroInversor.fabricante,
          modelo: `${primeiroInversor.modelo} (Sistema Multi-Inversor)`,
          potenciaSaidaCA: totalInverterCapacity, // Usar potência total do sistema
          numeroMppt: totalMpptChannels, // Usar total de MPPTs
          stringsPorMppt: primeiroInversor.stringsPorMppt,
          tensaoCcMax: primeiroInversor.tensaoCcMax,
          // Adicionar flags para identificar sistema multi-inversor
          isMultiInverterSystem: true,
          originalSinglePower: primeiroInversor.potenciaSaidaCA,
          totalUnits: params.selectedInverters.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
        };
        
        console.log('📌 COMPATIBILIDADE: Dados agregados para API legada:', params.inversor);
      }

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
        // Prioridade: numeroModulosUsuario > num_modules > numeroModulos > cálculo automático
        num_modules: params.numeroModulosUsuario || params.num_modules || params.numeroModulos || undefined,
        // Garantir que o modelo de transposição seja repassado
        modelo_transposicao: params.modelo_transposicao || 'perez',
        
        // NOVO: Incluir dados de múltiplos inversores para futura integração
        multi_inverter_data: params.selectedInverters ? {
          is_multi_inverter: true,
          system_configuration: 'multi_inverter',
          total_inverter_units: params.selectedInverters.reduce((sum: number, inv: any) => sum + inv.quantity, 0),
          total_ca_power_w: totalInverterCapacity,
          total_ca_power_kw: totalInverterCapacity / 1000,
          total_mppt_channels: totalMpptChannels,
          inverter_models_count: params.selectedInverters.length,
          // Breakdown detalhado por modelo de inversor (formato esperado pelo Python)
          inverter_breakdown: params.selectedInverters.map((inv: any, index: number) => ({
            inverter_index: index,
            fabricante: inv.fabricante || inv.manufacturer || 'N/A',
            modelo: inv.modelo || inv.model || 'N/A',
            quantidade: inv.quantity || 1,
            potencia_unitaria_w: inv.potenciaSaidaCA || inv.potencia_saida_ca_w || inv.power_output_w || 0,
            potencia_total_w: (inv.potenciaSaidaCA || inv.potencia_saida_ca_w || inv.power_output_w || 0) * (inv.quantity || 1),
            // Parâmetros técnicos do inversor para cálculos precisos
            numero_mppt: inv.numeroMppt || inv.numero_mppt || inv.mppt_count || 4,
            strings_por_mppt: inv.stringsPorMppt || inv.strings_per_mppt || inv.strings_por_mppt || 2,
            tensao_cc_max_v: inv.tensaoCcMax || inv.tensao_cc_max_v || inv.max_dc_voltage || 1500,
            // Parâmetros Sandia para simulação precisa (com fallbacks do inversor base se disponíveis)
            vdco: inv.vdco || params.inversor?.vdco || null,
            pso: inv.pso || params.inversor?.pso || null,
            c0: inv.c0 || params.inversor?.c0 || null,
            c1: inv.c1 || params.inversor?.c1 || null,
            c2: inv.c2 || params.inversor?.c2 || null,
            c3: inv.c3 || params.inversor?.c3 || null,
            pnt: inv.pnt || params.inversor?.pnt || null,
            // Capacidade relativa no sistema
            percentual_potencia_sistema: parseFloat(((inv.potenciaSaidaCA * inv.quantity) / totalInverterCapacity * 100).toFixed(1))
          })),
          // Dados para distribuição de módulos por MPPT (futura implementação)
          mppt_distribution_ready: true,
          roof_areas_assigned: false, // Será true quando implementarmos distribuição por águas do telhado
          // Dados completos originais para debugging
          raw_selected_inverters: params.selectedInverters
        } : {
          is_multi_inverter: false,
          system_configuration: 'single_inverter',
          total_inverter_units: 1,
          total_ca_power_w: params.inversor?.potenciaSaidaCA || 0,
          total_ca_power_kw: (params.inversor?.potenciaSaidaCA || 0) / 1000,
          total_mppt_channels: params.inversor?.numeroMppt || 2
        }
      };

      // Log específico baseado na origem do número de módulos
      if (params.numeroModulosUsuario) {
        console.log('👤 USUÁRIO: Usando número de módulos definido pelo usuário:', params.numeroModulosUsuario);
      } else if (params.num_modules) {
        console.log('🎯 SLIDER: Usando número específico de módulos:', params.num_modules);
      } else if (params.numeroModulos) {
        console.log('📊 LEGACY: Usando número de módulos do campo legado:', params.numeroModulos);
      } else {
        console.log('🔢 AUTO: Calculando número de módulos automaticamente baseado no consumo');
      }
      
      // Log detalhado dos dados sendo enviados ao Python
      console.log('🚀 Enviando para API Python (módulos avançados):');
      console.log('📍 Localização:', { lat: pythonParams.lat, lon: pythonParams.lon });
      console.log('📐 Orientação:', { tilt: pythonParams.tilt, azimuth: pythonParams.azimuth });
      console.log('🔋 Módulo:', pythonParams.modulo.fabricante, pythonParams.modulo.modelo);
      console.log('⚡ Sistema inversor:', pythonParams.multi_inverter_data.system_configuration);
      
      if (isMultiInverterSystem) {
        console.log('🔢 Multi-inversor stats:');
        console.log(`   - Total de unidades: ${pythonParams.multi_inverter_data.total_inverter_units}`);
        console.log(`   - Potência total: ${pythonParams.multi_inverter_data.total_ca_power_kw}kW`);
        console.log(`   - Total MPPT: ${pythonParams.multi_inverter_data.total_mppt_channels}`);
        console.log(`   - Modelos diferentes: ${pythonParams.multi_inverter_data.inverter_models_count}`);
        
        console.log('📋 Breakdown detalhado por inversor:');
        pythonParams.multi_inverter_data.inverter_breakdown.forEach((inv: any, i: number) => {
          console.log(`   ${i + 1}. ${inv.fabricante} ${inv.modelo}`);
          console.log(`      - Quantidade: ${inv.quantidade}x`);
          console.log(`      - Potência unitária: ${(inv.potencia_unitaria_w / 1000).toFixed(1)}kW`);
          console.log(`      - Potência total: ${(inv.potencia_total_w / 1000).toFixed(1)}kW`);
          console.log(`      - Participação: ${inv.percentual_potencia_sistema}%`);
          console.log(`      - MPPTs: ${inv.numero_mppt}x${inv.strings_por_mppt} (${inv.numero_mppt * inv.quantidade} canais)`);
          console.log(`      - Tensão CC máx: ${inv.tensao_cc_max_v}V`);
          
          // Log dos parâmetros Sandia se disponíveis
          if (inv.vdco || inv.pso || inv.c0) {
            console.log(`      - Params Sandia: vdco=${inv.vdco || 'N/A'}, pso=${inv.pso || 'N/A'}, c0=${inv.c0 || 'N/A'}`);
          }
        });
      } else {
        console.log('🔌 Inversor único:', pythonParams.inversor.fabricante, pythonParams.inversor.modelo);
        console.log(`   - Potência: ${(pythonParams.inversor.potencia_saida_ca_w / 1000).toFixed(1)}kW`);
        console.log(`   - MPPTs: ${pythonParams.inversor.numero_mppt || 'N/A'}x${pythonParams.inversor.strings_por_mppt || 'N/A'}`);
      }
      
      console.log('🎯 Consumo anual alvo:', pythonParams.consumo_anual_kwh, 'kWh');
      console.log('📊 Payload completo:', JSON.stringify(pythonParams, null, 2));
      
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

      console.log('✅ Resposta da API Python (módulos):');
      console.log('📊 Resultado do dimensionamento:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Módulos calculados: ${response.data.num_modulos}`);
      console.log(`   - Potência total: ${response.data.potencia_total_kw}kW`);
      console.log(`   - Energia anual: ${response.data.energia_total_anual}kWh`);
      console.log(`   - Performance Ratio: ${response.data.pr_medio}%`);
      console.log(`   - Yield específico: ${response.data.yield_especifico} kWh/kWp`);
      
      if (isMultiInverterSystem) {
        console.log('🔄 Sistema multi-inversor processado com sucesso!');
        console.log(`   - Capacidade total inversores: ${totalInverterCapacity / 1000}kW`);
        console.log(`   - Canais MPPT disponíveis: ${totalMpptChannels}`);
        console.log(`   - Razão DC/AC: ${(response.data.potencia_total_kw * 1000 / totalInverterCapacity).toFixed(2)}`);
        console.log(`   - Oversizing: ${((response.data.potencia_total_kw * 1000 / totalInverterCapacity - 1) * 100).toFixed(1)}%`);
        
        // Log das configurações de strings se disponível
        if (response.data.compatibilidade_sistema) {
          console.log(`   - Strings recomendadas: ${response.data.compatibilidade_sistema.strings_recomendadas}`);
          console.log(`   - Módulos por string: ${response.data.compatibilidade_sistema.modulos_por_string}`);
          console.log(`   - Utilização do inversor: ${response.data.compatibilidade_sistema.utilizacao_inversor}%`);
        }
      }

      // Padronizar resposta: converter W para kW e organizar formato
      const pythonData = response.data;
      
      // ===== DEBUG: PERDAS_DETALHADAS =====
      console.log('==========================================');
      console.log('🔍 [DEBUG] pythonData keys:', Object.keys(pythonData));
      console.log('🔍 [DEBUG] pythonData.perdas_detalhadas existe?', 'perdas_detalhadas' in pythonData);
      console.log('🔍 [DEBUG] pythonData.perdas_detalhadas valor:', pythonData.perdas_detalhadas);
      console.log('🔍 [DEBUG] pythonData.perdas_detalhadas tipo:', typeof pythonData.perdas_detalhadas);
      if (pythonData.perdas_detalhadas) {
        console.log('🔍 [DEBUG] perdas_detalhadas.total:', pythonData.perdas_detalhadas.total);
      }
      console.log('==========================================');
      
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
        // Breakdown detalhado de perdas (usar dados do Python se disponíveis, senão usar calculados pelo Node.js)
        perdas_detalhadas: pythonData.perdas_detalhadas || detailedLosses,
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
        periodo_dados: pythonData.periodo_dados,
        
        // NOVO: Informações do sistema de inversores para o frontend
        sistema_inversores: isMultiInverterSystem ? {
          tipo_sistema: 'multi_inverter',
          total_unidades: params.selectedInverters.reduce((sum: number, inv: any) => sum + inv.quantity, 0),
          total_potencia_ca_kw: totalInverterCapacity / 1000,
          total_canais_mppt: totalMpptChannels,
          modelos_diferentes: params.selectedInverters.length,
          configuracao_detalhada: params.selectedInverters.map((inv: any, index: number) => ({
            id: index + 1,
            fabricante: inv.fabricante,
            modelo: inv.modelo,
            quantidade: inv.quantity,
            potencia_unitaria_kw: inv.potenciaSaidaCA / 1000,
            potencia_total_kw: (inv.potenciaSaidaCA * inv.quantity) / 1000,
            mppt_unitario: inv.numeroMppt,
            mppt_total: inv.numeroMppt * inv.quantity,
            percentual_sistema: ((inv.potenciaSaidaCA * inv.quantity) / totalInverterCapacity * 100).toFixed(1) + '%'
          })),
          razao_modulo_inversor: (pythonData.potencia_total_kw * 1000 / totalInverterCapacity).toFixed(2),
          compatibilidade_ok: (pythonData.potencia_total_kw * 1000) <= (totalInverterCapacity * 1.3), // Tolerância 30%
          // Dados para futura implementação de distribuição por MPPT
          distribuicao_mppt_ready: true,
          aguas_telhado_assigned: false
        } : {
          tipo_sistema: 'single_inverter',
          total_unidades: 1,
          total_potencia_ca_kw: (params.inversor?.potenciaSaidaCA || 0) / 1000,
          total_canais_mppt: params.inversor?.numeroMppt || 2,
          modelos_diferentes: 1,
          configuracao_detalhada: [{
            id: 1,
            fabricante: params.inversor?.fabricante || 'N/A',
            modelo: params.inversor?.modelo || 'N/A',
            quantidade: 1,
            potencia_unitaria_kw: (params.inversor?.potenciaSaidaCA || 0) / 1000,
            potencia_total_kw: (params.inversor?.potenciaSaidaCA || 0) / 1000,
            mppt_unitario: params.inversor?.numeroMppt || 2,
            mppt_total: params.inversor?.numeroMppt || 2,
            percentual_sistema: '100%'
          }],
          razao_modulo_inversor: params.inversor?.potenciaSaidaCA ? 
            (pythonData.potencia_total_kw * 1000 / params.inversor.potenciaSaidaCA).toFixed(2) : '0',
          compatibilidade_ok: true
        }
      };

      // Limpar campos undefined
      const cleanData = JSON.parse(JSON.stringify(standardizedData));
      
      // Log final do sistema processado
      if (isMultiInverterSystem) {
        console.log('🎉 SUCESSO: Sistema multi-inversor processado e respondido ao frontend');
        console.log(`   - Total de ${cleanData.sistema_inversores.total_unidades} inversores configurados`);
        console.log(`   - Potência total: ${cleanData.sistema_inversores.total_potencia_ca_kw}kW`);
        console.log(`   - Compatibilidade: ${cleanData.sistema_inversores.compatibilidade_ok ? 'OK' : 'ATENÇÃO'}`);
        console.log(`   - Dados prontos para distribuição MPPT: ${cleanData.sistema_inversores.distribuicao_mppt_ready}`);
      } else {
        console.log('✅ Sistema inversor único processado com sucesso');
      }

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

  async calculateMPPTLimits(req: Request, res: Response): Promise<Response> {
    try {
      const params = req.body;
      
      console.log('🔄 Recebendo requisição de cálculo MPPT:', JSON.stringify(params, null, 2));

      // Validação dos parâmetros obrigatórios
      if (!params.fabricante || !params.modelo || !params.potencia_modulo_w || !params.voc_stc || !params.temp_coef_voc || !params.latitude || !params.longitude) {
        return this.badRequest(res, 'Parâmetros obrigatórios ausentes: fabricante, modelo, potencia_modulo_w, voc_stc, temp_coef_voc, latitude, longitude');
      }

      // URL do serviço PVLIB (Python)
      const pythonServiceUrl = process.env.PVLIB_SERVICE_URL || 'http://localhost:8110';

      console.log('🚀 Enviando para API Python (MPPT):', JSON.stringify(params, null, 2));
      
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
}