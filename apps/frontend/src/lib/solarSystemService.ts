import { api } from './api';

export interface SolarSystemCalculationParams {
  consumoAnual?: number;
  latitude?: number;
  longitude?: number;
  orientacao?: number;
  inclinacao?: number;
  eficienciaSistema?: number;
  potenciaModulo?: number;
  numeroModulos?: number;
  // MÚLTIPLAS ÁGUAS DE TELHADO
  aguasTelhado?: Array<{
    id: string;
    nome: string;
    orientacao: number;
    inclinacao: number;
    numeroModulos: number;
    sombreamentoParcial: number;
    areaDisponivel?: number;
    inversorId?: string;
    mpptNumero?: number;
  }>;
}

export interface SolarSystemCalculationResult {
  potenciaPico: number; // kWp
  geracaoAnual: number; // kWh/ano
  areaNecessaria: number; // m²
  message?: string;
}

export interface ModuleCalculationParams {
  lat: number;
  lon: number;
  origem_dados?: string; // "PVGIS" or "NASA"
  startyear?: number;
  endyear?: number;
  tilt?: number;
  azimuth?: number;
  modelo_decomposicao?: string;
  modelo_transposicao?: string;
  consumo_anual_kwh: number;
  modulo: {
    fabricante: string;
    modelo: string;
    potencia_nominal_w: number;
    largura_mm?: number;
    altura_mm?: number;
    vmpp?: number;
    impp?: number;
    eficiencia?: number;
    temp_coef_pmax?: number;
    peso_kg?: number;
    // Parâmetros para modelo espectral
    material?: string;     // Material da célula (c-Si, a-Si, CdTe, etc.)
    technology?: string;   // Tecnologia (mono-Si, mc-Si, a-Si, CdTe, etc.)
    
    // Parâmetros do modelo de diodo único
    a_ref?: number;        // Fator de idealidade modificado [V]
    i_l_ref?: number;      // Fotocorrente STC [A]
    i_o_ref?: number;      // Corrente saturação reversa STC [A]
    r_s?: number;          // Resistência série [Ω]
    r_sh_ref?: number;     // Resistência paralelo STC [Ω]
    
    // Coeficientes de temperatura
    alpha_sc?: number;     // Coef. temperatura corrente [A/°C]
    beta_oc?: number;      // Coef. temperatura tensão [V/°C]
    gamma_r?: number;      // Coef. temperatura potência [1/°C]
    
    // Parâmetros SAPM térmicos
    a0?: number; a1?: number; a2?: number; a3?: number; a4?: number;
    b0?: number; b1?: number; b2?: number; b3?: number; b4?: number; b5?: number;
    dtc?: number;
  };
  inversor: {
    fabricante: string;
    modelo: string;
    potencia_saida_ca_w: number;
    tipo_rede: string;
    potencia_fv_max_w?: number;
    tensao_cc_max_v?: number;
    numero_mppt?: number;
    strings_por_mppt?: number;
    eficiencia_max?: number;
    // Parâmetros Sandia específicos
    vdco?: number;  // Tensão DC nominal de operação
    pso?: number;   // Potência de standby (W)
    c0?: number;    // Coeficiente curva eficiência
    c1?: number;    // Coeficiente curva eficiência  
    c2?: number;    // Coeficiente curva eficiência
    c3?: number;    // Coeficiente curva eficiência
    pnt?: number;   // Potência threshold normalizada
  };
  perdas_sistema?: number;
  fator_seguranca?: number;
  num_modules?: number; // Número específico de módulos (se fornecido, usa este valor ao invés de calcular automaticamente)
  // MÚLTIPLAS ÁGUAS DE TELHADO
  aguasTelhado?: Array<{
    id: string;
    nome: string;
    orientacao: number;
    inclinacao: number;
    numeroModulos: number;
    sombreamentoParcial: number;
    areaDisponivel?: number;
    inversorId?: string;
    mpptNumero?: number;
  }>;
}

// ✅ NOVA: Interface específica para sistema multi-inversor
export interface MultiInverterCalculationParams {
  lat: number;
  lon: number;
  origem_dados?: string; // "PVGIS" or "NASA"
  startyear?: number;
  endyear?: number;
  tilt?: number;
  azimuth?: number;
  modelo_decomposicao?: string;
  modelo_transposicao?: string;
  consumo_anual_kwh: number;
  modulo: {
    fabricante: string;
    modelo: string;
    potencia_nominal_w: number;
    largura_mm?: number;
    altura_mm?: number;
    vmpp?: number;
    impp?: number;
    eficiencia?: number;
    temp_coef_pmax?: number;
    peso_kg?: number;
    // Parâmetros para modelo espectral
    material?: string;     // Material da célula (c-Si, a-Si, CdTe, etc.)
    technology?: string;   // Tecnologia (mono-Si, mc-Si, a-Si, CdTe, etc.)
    
    // Parâmetros do modelo de diodo único
    a_ref?: number;        // Fator de idealidade modificado [V]
    i_l_ref?: number;      // Fotocorrente STC [A]
    i_o_ref?: number;      // Corrente saturação reversa STC [A]
    r_s?: number;          // Resistência série [Ω]
    r_sh_ref?: number;     // Resistência paralelo STC [Ω]
    
    // Coeficientes de temperatura
    alpha_sc?: number;     // Coef. temperatura corrente [A/°C]
    beta_oc?: number;      // Coef. temperatura tensão [V/°C]
    gamma_r?: number;      // Coef. temperatura potência [1/°C]
    
    // Parâmetros SAPM térmicos
    a0?: number; a1?: number; a2?: number; a3?: number; a4?: number;
    b0?: number; b1?: number; b2?: number; b3?: number; b4?: number; b5?: number;
    dtc?: number;
  };
  perdas?: {
    sujeira: number;
    sombreamento: number;
    incompatibilidade: number;
    fiacao: number;
    outras: number;
  };
  perdas_sistema?: number;
  fator_seguranca?: number;
  num_modules?: number; // Número específico de módulos (se fornecido, usa este valor ao invés de calcular automaticamente)

  // ✅ MÚLTIPLAS ÁGUAS DE TELHADO COM INVERSORES EMBUTIDOS
  aguasTelhado: Array<{
    id: string;
    nome: string;
    orientacao: number;
    inclinacao: number;
    numeroModulos: number;
    sombreamentoParcial: number;
    areaDisponivel?: number;
    inversorId?: string;
    mpptNumero?: number;
    // ✅ NOVO: Inversor embutido em cada água
    inversor?: {
      fabricante: string;
      modelo: string;
      potencia_saida_ca_w: number;
      tipo_rede: string;
      potencia_fv_max_w?: number;
      tensao_cc_max_v?: number;
      numero_mppt?: number;
      strings_por_mppt?: number;
      eficiencia_max?: number;
      // Parâmetros Sandia específicos
      vdco?: number;  // Tensão DC nominal de operação
      pso?: number;   // Potência de standby (W)
      c0?: number;    // Coeficiente curva eficiência
      c1?: number;    // Coeficiente curva eficiência  
      c2?: number;    // Coeficiente curva eficiência
      c3?: number;    // Coeficiente curva eficiência
      pnt?: number;   // Potência threshold normalizada
    };
  }>;
}

export interface AdvancedModuleCalculationResult {
  num_modulos: number;
  potencia_total_kw: number;
  energia_total_anual_kwh: number;  // Atualizado para corresponder ao backend
  energia_por_modulo_kwh: number;   // Atualizado para corresponder ao backend
  cobertura_percentual: number;
  fator_capacidade: number;
  hsp_equivalente_dia: number;
  hsp_equivalente_anual: number;
  energia_anual_std: number;
  variabilidade_percentual: number;
  energia_por_ano: Record<string, number>;
  // Novos campos de performance
  pr_medio?: number;
  yield_especifico?: number;
  geracao_mensal?: number[];
  // Perdas detalhadas
  perdas_detalhadas?: {
    temperatura: number[];
    sombreamento: number[];
    mismatch: number[];
    cabeamento: number[];
    sujeira: number[];
    inversor: number[];
    outras?: number[];
    total: number[];
  };
  compatibilidade_sistema: {
    compatibilidade_tensao: boolean;
    strings_recomendadas: number;
    modulos_por_string: number;
    utilizacao_inversor: number;
    margem_seguranca: number;
  };
  area_necessaria_m2: number;
  peso_total_kg: number;
  economia_anual_co2: number;
  parametros_completos: any;
  dados_processados: number;
  anos_analisados: number;
  periodo_dados: {
    inicio: string;
    fim: string;
    anos_completos: number;
  };
}

export interface IrradiationCorrectionResult {
  irradiacaoCorrigida: number[]; // kWh/m²/mês corrigida por inclinação
  message?: string;
}

export interface ModuleCountResult {
  numeroModulos: number; // Número de módulos necessários
  message?: string;
}

// MPPT Calculation Types
export interface MPPTCalculationRequest {
  fabricante: string;
  modelo: string;
  potencia_modulo_w: number;
  voc_stc: number;
  temp_coef_voc: number;
  latitude: number;
  longitude: number;
  potencia_saida_ca_w: number;
  tensao_cc_max_v?: number;
  numero_mppt?: number;
  strings_por_mppt?: number;
  corrente_entrada_max_a?: number;
  faixa_mppt_min_v?: number;
  faixa_mppt_max_v?: number;
  tipo_rede?: string;
}

export interface MPPTCalculationResponse {
  modulos_por_mppt: number;
  modulos_total_sistema: number;
  limitacao_principal: string;
  analise_detalhada: {
    limite_tensao: string;
    limite_corrente: string;
    limite_potencia: string;
    limite_strings: string;
    configuracao_otima: string;
  };
  configuracao_recomendada: {
    strings_por_mppt: number;
    modulos_por_string: number;
    total_mppt_utilizados: number;
    total_strings_sistema: number;
    distribuicao: string;
  };
  parametros_entrada: {
    fabricante: string;
    modelo: string;
    potencia_modulo_w: number;
    voc_stc: number;
    temp_coef_voc: number;
    potencia_saida_ca_w: number;
    numero_mppt: number;
    strings_por_mppt: number;
    tensao_cc_max_v: number;
    temperatura_minima: number;
    voc_cold_calculado: number;
    limitacao_potencia: number;
    limitacao_tensao: number;
  };
}

// Complete System Calculation Interfaces
export interface CompleteSystemCalculationParams {
  lat: number;
  lon: number;
  origem_dados?: string; // "NASA" or "PVGIS"
  startyear?: number;
  endyear?: number;
  modelo_decomposicao?: string; // "louche", "erbs", etc.
  modelo_transposicao?: string; // "perez", "hay", "isotropic", etc.
  mount_type?: string; // "close_mount_glass_glass", "open_rack_glass_glass", etc.
  consumo_mensal_kwh: number[]; // 12 valores mensais
  perdas: {
    sujeira: number;
    sombreamento: number;
    incompatibilidade: number;
    fiacao: number;
    outras: number;
  };
  modulo: {
    fabricante: string;
    modelo: string;
    potencia_nominal_w: number;
    largura_mm: number;
    altura_mm: number;
    peso_kg: number;
    vmpp: number;
    impp: number;
    voc_stc: number;
    isc_stc: number;
    eficiencia: number;
    temp_coef_pmax: number;
    alpha_sc: number;
    beta_oc: number;
    gamma_r: number;
    cells_in_series: number;
    a_ref: number;
    il_ref: number;
    io_ref: number;
    rs: number;
    rsh_ref: number;
  };
  inversores: Array<{
    inversor: {
      fabricante: string;
      modelo: string;
      potencia_saida_ca_w: number;
      tipo_rede: string;
      potencia_fv_max_w: number;
      tensao_cc_max_v: number;
      numero_mppt: number;
      strings_por_mppt: number;
      eficiencia_max: number;
      efficiency_dc_ac: number;
    };
    orientacoes: Array<{
      nome: string;
      orientacao: number; // azimuth in degrees
      inclinacao: number; // tilt in degrees
      modulos_por_string: number;
      numero_strings: number;
    }>;
  }>;
}

export interface CompleteSystemCalculationResult {
  success: boolean;
  data?: any; // The actual calculation results
  message?: string;
  timestamp?: string;
}

export class SolarSystemService {
  /**
   * Calcula parâmetros do sistema solar via serviço Python
   */
  static async calculateSystem(params: SolarSystemCalculationParams): Promise<SolarSystemCalculationResult> {
    try {
      console.log('🔄 Chamando serviço de cálculo solar com parâmetros:', params);
      
      const response = await api.post('/solar-analysis/calculate-system', params);
      
      if (response.data && response.data.data) {
        console.log('✅ Resultado do cálculo solar:', response.data);
        const data = response.data.data;
        return {
          potenciaPico: data.potenciaPico || 0,
          geracaoAnual: data.geracaoAnual || 0,
          areaNecessaria: data.areaNecessaria || 0,
          message: data.message
        };
      }
      
      throw new Error('Resposta inválida do serviço');
    } catch (error: any) {
      console.error('❌ Erro ao calcular sistema solar:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      if (error.code === 'NETWORK_ERROR') {
        throw new Error('Erro de conexão com o servidor');
      }
      
      throw new Error('Erro interno no cálculo do sistema solar');
    }
  }

  /**
   * Calcula sistema a partir dos dados do dimensionamento
   */
  static async calculateFromDimensioning(dimensioningData: any): Promise<SolarSystemCalculationResult> {
    const params: SolarSystemCalculationParams = {
      consumoAnual: dimensioningData.energyBills?.reduce((total: number, bill: any) => {
        return total + bill.consumoMensal?.reduce((sum: number, consumo: number) => sum + consumo, 0) || 0;
      }, 0),
      latitude: dimensioningData.latitude,
      longitude: dimensioningData.longitude,
      orientacao: dimensioningData.orientacao,
      inclinacao: dimensioningData.inclinacao,
      eficienciaSistema: dimensioningData.eficienciaSistema,
      potenciaModulo: dimensioningData.potenciaModulo,
      numeroModulos: dimensioningData.numeroModulos
      // ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
      // aguasTelhado: dimensioningData.aguasTelhado
    };

    return this.calculateSystem(params);
  }

  /**
   * Calcula irradiação corrigida por inclinação via serviço Python
   */
  static async calculateIrradiationCorrection(params: any): Promise<IrradiationCorrectionResult> {
    try {
      console.log('🔄 Chamando cálculo de irradiação corrigida com parâmetros:', params);
      
      const response = await api.post('/solar-analysis/calculate-irradiation-correction', params);
      
      if (response.data && response.data.data) {
        console.log('✅ Resultado da irradiação corrigida:', response.data);
        const data = response.data.data;
        return {
          irradiacaoCorrigida: data.irradiacaoCorrigida || Array(12).fill(10),
          message: data.message
        };
      }
      
      throw new Error('Resposta inválida do serviço');
    } catch (error: any) {
      console.error('❌ Erro ao calcular irradiação corrigida:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      if (error.code === 'NETWORK_ERROR') {
        throw new Error('Erro de conexão com o servidor');
      }
      
      throw new Error('Erro interno no cálculo de irradiação corrigida');
    }
  }

  /**
   * Calcula número de módulos necessários via serviço Python
   */
  static async calculateModuleCount(params: any): Promise<ModuleCountResult> {
    try {
      console.log('🔄 Chamando cálculo de número de módulos com parâmetros:', params);
      
      const response = await api.post('/solar-analysis/calculate-module-count', params);
      
      if (response.data && response.data.data) {
        console.log('✅ Resultado do número de módulos:', response.data);
        const data = response.data.data;
        return {
          numeroModulos: data.numeroModulos || 25,
          message: data.message
        };
      }
      
      throw new Error('Resposta inválida do serviço');
    } catch (error: any) {
      console.error('❌ Erro ao calcular número de módulos:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      if (error.code === 'NETWORK_ERROR') {
        throw new Error('Erro de conexão com o servidor');
      }
      
      throw new Error('Erro interno no cálculo do número de módulos');
    }
  }

  /**
   * Busca dados de irradiação mensal para análise avançada
   */
  static async getEnhancedAnalysisData(params: {
    lat: number;
    lon: number;
    tilt?: number;
    azimuth?: number;
  }): Promise<{
    irradiacaoMensal: number[];
    mediaAnual: number;
    configuracao: any;
    coordenadas: { lat: number; lon: number };
  }> {
    try {
      console.log('🔄 Buscando dados de análise avançada:', params);
      
      const response = await api.get('/solar-analysis/enhanced-analysis-data', {
        params: {
          lat: params.lat,
          lon: params.lon,
          tilt: params.tilt || 0,
          azimuth: params.azimuth || 0
        }
      });
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar dados de análise avançada:', error);
      throw new Error('Erro ao buscar dados de irradiação mensal');
    }
  }

  /**
   * Cálculo avançado de módulos com dados completos do módulo e inversor
   */
  static async calculateAdvancedModules(params: MultiInverterCalculationParams, inversorGlobal?: any): Promise<AdvancedModuleCalculationResult> {
    try {
      console.log('🔄 Chamando cálculo avançado de módulos com parâmetros:', params);
      
      // ✅ PROCESSAR MÚLTIPLAS ÁGUAS DE TELHADO
      const processedParams = this._processRoofWatersForCalculation(params, inversorGlobal);

      console.log('📡 [SOLAR_SERVICE] PAYLOAD COMPLETO ANTES DE ENVIAR:');
      console.log(JSON.stringify(processedParams, null, 2));
      console.log('📡 [SOLAR_SERVICE] Verificação de campos críticos:', {
        origem_dados: processedParams.origem_dados,
        startyear: processedParams.startyear,
        endyear: processedParams.endyear
      });

      // Fazer chamada através do backend Node.js
      const response = await api.post('/solar-analysis/calculate-advanced-modules', processedParams);
      
      console.log('✅ Resultado bruto da API:', response.data);
      
      // A resposta agora vem no formato { success: true, data: {...}, timestamp: "..." }
      if (response.data && response.data.success && response.data.data) {
        console.log('✅ Dados processados do cálculo avançado:', response.data.data);
        return response.data.data;
      }
      
      // Fallback para compatibilidade
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no cálculo avançado de módulos:', error);
      
      if (error.message.includes('fetch')) {
        throw new Error('Erro de conexão com o serviço Python');
      }
      
      throw new Error(error.message || 'Erro interno no cálculo avançado de módulos');
    }
  }

  /**
   * Calcula sistema avançado a partir dos dados do dimensionamento
   */
  static async calculateAdvancedFromDimensioning(dimensioningData: any): Promise<AdvancedModuleCalculationResult> {
    // ===== DEBUG: DADOS RECEBIDOS NO SOLARSYSTEMSERVICE =====
    console.log('📥 [SolarSystemService] Dados recebidos para cálculo:', dimensioningData);
    console.log('🔧 [SolarSystemService] Perdas recebidas:', {
      perdaSombreamento: dimensioningData.perdaSombreamento,
      perdaMismatch: dimensioningData.perdaMismatch,
      perdaCabeamento: dimensioningData.perdaCabeamento,
      perdaSujeira: dimensioningData.perdaSujeira,
      perdaInversor: dimensioningData.perdaInversor,
      perdaOutras: dimensioningData.perdaOutras
    });
    
    // Calcular consumo anual
    const consumoAnual = dimensioningData.energyBills?.reduce((total: number, bill: any) => {
      return total + bill.consumoMensal?.reduce((sum: number, consumo: number) => sum + consumo, 0) || 0;
    }, 0) || 0;

    // Preparar dados do módulo
    const moduloSelecionado = dimensioningData.selectedModules?.[0];
    const inversorSelecionado = dimensioningData.inverters?.[0];

    // Se não há módulo ou inversor selecionado, usar dados padrão
    const modulo = moduloSelecionado ? {
      fabricante: moduloSelecionado.fabricante || "Canadian Solar",
      modelo: moduloSelecionado.modelo || "CS3W-540MS", 
      potencia_nominal_w: moduloSelecionado.potenciaNominal || 540,
      largura_mm: moduloSelecionado.larguraMm || 2261, // Garantir dimensões padrão
      altura_mm: moduloSelecionado.alturaMm || 1134,   // Garantir dimensões padrão
      vmpp: moduloSelecionado.vmpp,
      impp: moduloSelecionado.impp,
      eficiencia: moduloSelecionado.eficiencia,
      temp_coef_pmax: moduloSelecionado.tempCoefPmax,
      peso_kg: moduloSelecionado.pesoKg,
      // Parâmetros para modelo espectral
      material: moduloSelecionado.material,
      technology: moduloSelecionado.technology,
      // Parâmetros do modelo de diodo único
      a_ref: moduloSelecionado.aRef,
      i_l_ref: moduloSelecionado.iLRef,
      i_o_ref: moduloSelecionado.iORef,
      r_s: moduloSelecionado.rS,
      r_sh_ref: moduloSelecionado.rShRef,
      // Coeficientes de temperatura
      alpha_sc: moduloSelecionado.alphaSc,
      beta_oc: moduloSelecionado.betaOc,
      gamma_r: moduloSelecionado.gammaR,
      // Parâmetros SAPM térmicos
      a0: moduloSelecionado.a0, a1: moduloSelecionado.a1, a2: moduloSelecionado.a2,
      a3: moduloSelecionado.a3, a4: moduloSelecionado.a4,
      b0: moduloSelecionado.b0, b1: moduloSelecionado.b1, b2: moduloSelecionado.b2,
      b3: moduloSelecionado.b3, b4: moduloSelecionado.b4, b5: moduloSelecionado.b5,
      dtc: moduloSelecionado.dtc
    } : {
      fabricante: "Canadian Solar",
      modelo: "CS3W-540MS",
      potencia_nominal_w: 540,
      largura_mm: 2261, // Dimensões padronizadas
      altura_mm: 1134,  // Dimensões padronizadas
      vmpp: 41.4,
      impp: 13.05,
      eficiencia: 20.9,
      temp_coef_pmax: -0.37,
      peso_kg: 27.5,
      // Parâmetros padrão para modelo espectral
      material: "c-Si",
      technology: "mono-Si",
      // Parâmetros padrão do modelo de diodo único
      a_ref: 1.8,
      i_l_ref: 13.91,
      i_o_ref: 3.712e-12,
      r_s: 0.348,
      r_sh_ref: 381.68,
      // Coeficientes de temperatura padrão
      alpha_sc: 0.0004,
      beta_oc: -0.0028,
      gamma_r: -0.0004,
      // Parâmetros SAPM térmicos padrão
      a0: -3.56, a1: -0.075, a2: 0.0, a3: 0.0, a4: 0.0,
      b0: 0.0, b1: 0.0, b2: 0.0, b3: 0.0, b4: 0.0, b5: 0.0,
      dtc: 3.0
    };

    const inversor = inversorSelecionado ? {
      fabricante: inversorSelecionado.fabricante || "WEG",
      modelo: inversorSelecionado.modelo || "SIW500H-M",
      potencia_saida_ca_w: inversorSelecionado.potencia_saida_ca_w || inversorSelecionado.potenciaSaidaCA || 5000,
      tipo_rede: inversorSelecionado.tipo_rede || inversorSelecionado.tipoRede || "Monofásico 220V",
      potencia_fv_max_w: inversorSelecionado.potenciaFvMax,
      tensao_cc_max_v: inversorSelecionado.tensaoCcMax,
      numero_mppt: inversorSelecionado.numeroMppt,
      strings_por_mppt: inversorSelecionado.stringsPorMppt,
      eficiencia_max: inversorSelecionado.eficienciaMax,
      // Parâmetros Sandia (usar valores do inversor se disponíveis)
      vdco: inversorSelecionado.vdco,
      pso: inversorSelecionado.pso,
      c0: inversorSelecionado.c0,
      c1: inversorSelecionado.c1,
      c2: inversorSelecionado.c2,
      c3: inversorSelecionado.c3,
      pnt: inversorSelecionado.pnt
    } : {
      fabricante: "WEG",
      modelo: "SIW500H-M",
      potencia_saida_ca_w: 5000,
      tipo_rede: "Monofásico 220V",
      potencia_fv_max_w: 7500,
      tensao_cc_max_v: 600,
      numero_mppt: 2,
      strings_por_mppt: 2,
      eficiencia_max: 97.6,
      // Parâmetros Sandia padrão para fallback
      vdco: 480,
      pso: 25,
      c0: -0.000008,
      c1: -0.000120,
      c2: 0.001400,
      c3: -0.020000,
      pnt: 0.02
    };

    // ✅ PROCESSAR MÚLTIPLAS ÁGUAS DE TELHADO
    console.log('🏠 [SolarSystemService] Verificando águas de telhado:', {
      hasAguasTelhado: !!dimensioningData.aguasTelhado,
      numAguas: dimensioningData.aguasTelhado?.length || 0,
      aguas: dimensioningData.aguasTelhado
    });

    // Validar e clampar tilt e azimuth apenas se não houver múltiplas águas
    let tiltValue, azimuthValue;
    if (dimensioningData.aguasTelhado && dimensioningData.aguasTelhado.length > 1) {
      console.log('🏠 Múltiplas águas detectadas, usando tilt/azimuth padrão para fallback');
      tiltValue = 20;
      azimuthValue = 180;
    } else {
      tiltValue = dimensioningData.inclinacao || 20;
      azimuthValue = dimensioningData.orientacao || 180;
    }

    // IMPORTANTE: tilt deve estar entre 0 e 90, azimuth entre 0 e 360
    const validatedTilt = Math.max(0, Math.min(90, tiltValue));
    const validatedAzimuth = Math.max(0, Math.min(360, azimuthValue));

    if (validatedTilt !== tiltValue) {
      console.warn(`⚠️ Tilt corrigido de ${tiltValue}° para ${validatedTilt}° (limite: 0-90°)`);
    }
    if (validatedAzimuth !== azimuthValue) {
      console.warn(`⚠️ Azimuth corrigido de ${azimuthValue}° para ${validatedAzimuth}° (limite: 0-360°)`);
    }

    const params: MultiInverterCalculationParams = {
      lat: dimensioningData.latitude || -15.7942,
      lon: dimensioningData.longitude || -47.8822,
      origem_dados: (dimensioningData.fonteDados || 'pvgis').toUpperCase(),
      startyear: 2015,
      endyear: 2020,
      modelo_decomposicao: 'louche',
      modelo_transposicao: 'perez',
      consumo_anual_kwh: consumoAnual,
      modulo,
      perdas: {
        sujeira: dimensioningData.perdaSujeira || 5,
        sombreamento: dimensioningData.perdaSombreamento || 3,
        incompatibilidade: dimensioningData.perdaMismatch || 2,
        fiacao: dimensioningData.perdaCabeamento || 2,
        outras: (dimensioningData.perdaInversor || 3) + (dimensioningData.perdaOutras || 0)
      },
      fator_seguranca: 1.1,
      num_modules: dimensioningData.num_modules, // Incluir num_modules se fornecido
      // ✅ Incluir águas de telhado se existirem
      aguasTelhado: dimensioningData.aguasTelhado
    };

    // ===== DEBUG: PERDAS CALCULADAS E ENVIADAS PARA PVLIB =====
    const perdasTotal = (dimensioningData.perdaSombreamento || 3) + 
                       (dimensioningData.perdaMismatch || 2) + 
                       (dimensioningData.perdaCabeamento || 2) + 
                       (dimensioningData.perdaSujeira || 5) + 
                       (dimensioningData.perdaInversor || 3) + 
                       (dimensioningData.perdaOutras || 0);
    console.log('🎯 [SolarSystemService] Perdas TOTAIS sendo enviadas para PVLIB:', perdasTotal + '%');
    console.log('🔧 [SolarSystemService] Breakdown das perdas:', {
      sombreamento: dimensioningData.perdaSombreamento || 3,
      mismatch: dimensioningData.perdaMismatch || 2,
      cabeamento: dimensioningData.perdaCabeamento || 2,
      sujeira: dimensioningData.perdaSujeira || 5,
      inversor: dimensioningData.perdaInversor || 3,
      outras: dimensioningData.perdaOutras || 0,
      TOTAL: perdasTotal
    });

    console.log('🔧 Parâmetros completos sendo enviados:', {
      modulo: modulo.fabricante + ' ' + modulo.modelo,
      inversor: inversor.fabricante + ' ' + inversor.modelo,
      parametros_espectrais: {
        material: modulo.material,
        technology: modulo.technology
      },
      parametros_sandia: {
        vdco: inversor.vdco,
        pso: inversor.pso,
        c0: inversor.c0,
        c1: inversor.c1,
        c2: inversor.c2,
        c3: inversor.c3,
        pnt: inversor.pnt
      }
    });

    return this.calculateAdvancedModules(params, inversor);
  }

/**
    * ✅ Processa múltiplas águas de telhado para cálculo
    */
  private static _processRoofWatersForCalculation(params: MultiInverterCalculationParams, inversorGlobal?: any): any {
    console.log('🏠 Processando águas de telhado para cálculo:', {
      hasAguasTelhado: !!params.aguasTelhado,
      numAguas: params.aguasTelhado?.length || 0
    });

    // Se há águas de telhado, enviar estrutura completa com inversor embutido
    if (params.aguasTelhado && params.aguasTelhado.length > 0) {
      console.log(`🏠 Enviando ${params.aguasTelhado.length} águas de telhado para cálculo avançado`);
      
      // ✅ Usar inversor global ou criar padrão WEG para embutir
      const inversorPadrao = inversorGlobal || {
        fabricante: "WEG",
        modelo: "SIW500H-M",
        potencia_saida_ca_w: 5000,
        tipo_rede: "Monofásico 220V",
        potencia_fv_max_w: 7500,
        tensao_cc_max_v: 600,
        numero_mppt: 2,
        strings_por_mppt: 2,
        eficiencia_max: 97.6,
        vdco: 480,
        pso: 25,
        c0: -0.000008,
        c1: -0.00012,
        c2: 0.0014,
        c3: -0.02,
        pnt: 0.02
      };
      
      const processedParams = {
        // ✅ Campos obrigatórios
        lat: params.lat,
        lon: params.lon,
        origem_dados: params.origem_dados || 'PVGIS',
        startyear: params.startyear || 2015,
        endyear: params.endyear || 2020,
        modelo_decomposicao: params.modelo_decomposicao,
        modelo_transposicao: params.modelo_transposicao,
        consumo_anual_kwh: params.consumo_anual_kwh,
        modulo: params.modulo,
        perdas: params.perdas,
        perdas_sistema: params.perdas_sistema,
        fator_seguranca: params.fator_seguranca,

        // ✅ Enviar águas com inversor embutido
        aguasTelhado: params.aguasTelhado.map(agua => ({
          id: agua.id,
          nome: agua.nome,
          orientacao: agua.orientacao,
          inclinacao: agua.inclinacao,
          numeroModulos: agua.numeroModulos,
          sombreamentoParcial: agua.sombreamentoParcial || 0,
          inversorId: agua.inversorId,
          mpptNumero: agua.mpptNumero,
          // ✅ Incluir inversor embutido padrão
          inversor: inversorPadrao
        }))
      };

      console.log('📋 Estrutura enviada:', {
        numAguas: processedParams.aguasTelhado.length,
        aguas: processedParams.aguasTelhado.map(a => ({
          nome: a.nome,
          modulos: a.numeroModulos,
          orientacao: a.orientacao,
          inclinacao: a.inclinacao,
          temInversor: !!a.inversor,
          inversorModelo: a.inversor?.modelo
        }))
      });

      return processedParams;
    }

    // Fallback para sistema único - manter estrutura original
    console.log('🏠 Sistema único detectado, mantendo estrutura original');
    return params;
  }

  /**
   * Calcula limites de MPPT para inversores
   */
  static async calculateMPPTLimits(params: MPPTCalculationRequest): Promise<MPPTCalculationResponse> {
    try {
      console.log('🔄 Chamando cálculo de limites MPPT com parâmetros:', params);

      const response = await api.post('/solar-analysis/pvlib/mppt/calculate-modules-per-mppt', params);

      // Aceitar tanto formato com wrapper quanto formato direto
      if (response.data) {
        if (response.data.success && response.data.data) {
          // Formato com wrapper: { success: true, data: {...} }
          console.log('✅ Resultado do cálculo MPPT (com wrapper):', response.data.data);
          return response.data.data;
        } else if (response.data.modulos_por_mppt !== undefined) {
          // Formato direto: { modulos_por_mppt: 18, ... }
          console.log('✅ Resultado do cálculo MPPT (formato direto):', response.data);
          return response.data;
        }
      }

      console.error('❌ Resposta inválida do serviço MPPT:', response.data);
      throw new Error('Resposta inválida do serviço MPPT');
    } catch (error: any) {
      console.error('❌ Erro ao calcular limites MPPT:', error);

      if (error.message?.includes('fetch')) {
        throw new Error('Erro de conexão com o servidor MPPT');
      }

      throw new Error('Erro interno no cálculo de limites MPPT');
    }
  }

  /**
   * NEW: Calculate complete solar system using the new comprehensive endpoint
   * This method sends a POST request to /api/v1/solar-analysis/calculate-complete-system
   */
  static async calculateCompleteSystem(params: CompleteSystemCalculationParams): Promise<CompleteSystemCalculationResult> {
    try {
      console.log('🔄 Chamando cálculo completo do sistema com parâmetros:', params);

      const response = await api.post('/solar-analysis/calculate-complete-system', params);

      if (response.data) {
        console.log('✅ Resultado do cálculo completo do sistema:', response.data);
        return response.data;
      }

      throw new Error('Resposta inválida do serviço');
    } catch (error: any) {
      console.error('❌ Erro ao calcular sistema completo:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      if (error.message?.includes('fetch')) {
        throw new Error('Erro de conexão com o servidor');
      }

      throw new Error('Erro interno no cálculo completo do sistema');
    }
  }

  /**
   * Convenience method to build CompleteSystemCalculationParams from dimensioning data
   * Maps frontend form data to the required backend structure
   */
  static buildCompleteSystemParams(dimensioningData: any): CompleteSystemCalculationParams {
    // Extract monthly consumption data
    const consumoMensal = dimensioningData.energyBills?.reduce((acc: number[], bill: any) => {
      if (bill.consumoMensal && Array.isArray(bill.consumoMensal)) {
        return bill.consumoMensal;
      }
      return acc;
    }, Array(12).fill(400)) || Array(12).fill(400);

    // Ensure we have exactly 12 values
    const consumoMensalKwh = consumoMensal.length === 12
      ? consumoMensal
      : Array(12).fill(400);

    // Get module data
    const moduloSelecionado = dimensioningData.selectedModules?.[0];
    const modulo = {
      fabricante: moduloSelecionado?.fabricante || "Exemplo",
      modelo: moduloSelecionado?.modelo || "585W",
      potencia_nominal_w: moduloSelecionado?.potenciaNominal || 585,
      largura_mm: moduloSelecionado?.larguraMm || 1100,
      altura_mm: moduloSelecionado?.alturaMm || 2100,
      peso_kg: moduloSelecionado?.pesoKg || 30,
      vmpp: moduloSelecionado?.vmpp || 42.52,
      impp: moduloSelecionado?.impp || 13.76,
      voc_stc: moduloSelecionado?.vocStc || 51.16,
      isc_stc: moduloSelecionado?.iscStc || 14.55,
      eficiencia: moduloSelecionado?.eficiencia || 21.0,
      temp_coef_pmax: moduloSelecionado?.tempCoefPmax || -0.29,
      alpha_sc: moduloSelecionado?.alphaSc || 0.00041,
      beta_oc: moduloSelecionado?.betaOc || -0.0025,
      gamma_r: moduloSelecionado?.gammaR || -0.0029,
      cells_in_series: moduloSelecionado?.cellsInSeries || 144,
      a_ref: moduloSelecionado?.aRef || 1.8,
      il_ref: moduloSelecionado?.iLRef || 14.86,
      io_ref: moduloSelecionado?.iORef || 2.5e-12,
      rs: moduloSelecionado?.rS || 0.25,
      rsh_ref: moduloSelecionado?.rShRef || 450.0
    };

    // Build inversores array from aguasTelhado or inverters
    const inversores: CompleteSystemCalculationParams['inversores'] = [];

    if (dimensioningData.aguasTelhado && dimensioningData.aguasTelhado.length > 0) {
      // Multi-inverter configuration with multiple roof areas
      const inversorSelecionado = dimensioningData.inverters?.[0];
      const inversorData = {
        fabricante: inversorSelecionado?.fabricante || "Exemplo",
        modelo: inversorSelecionado?.modelo || "INV-01 3.0kW",
        potencia_saida_ca_w: inversorSelecionado?.potenciaSaidaCA || inversorSelecionado?.potencia_saida_ca_w || 5000,
        tipo_rede: inversorSelecionado?.tipoRede || inversorSelecionado?.tipo_rede || "monofásico",
        potencia_fv_max_w: inversorSelecionado?.potenciaFvMax || 6000,
        tensao_cc_max_v: inversorSelecionado?.tensaoCcMax || 600,
        numero_mppt: inversorSelecionado?.numeroMppt || 2,
        strings_por_mppt: inversorSelecionado?.stringsPorMppt || 1,
        eficiencia_max: inversorSelecionado?.eficienciaMax || 98.0,
        efficiency_dc_ac: inversorSelecionado?.efficiency_dc_ac || 0.98
      };

      inversores.push({
        inversor: inversorData,
        orientacoes: dimensioningData.aguasTelhado.map((agua: any, index: number) => ({
          nome: agua.nome || `MPPT-${index + 1}`,
          orientacao: agua.orientacao || 330,
          inclinacao: agua.inclinacao || 18,
          modulos_por_string: Math.floor(agua.numeroModulos / (inversorData.strings_por_mppt || 1)),
          numero_strings: inversorData.strings_por_mppt || 1
        }))
      });
    } else {
      // Single inverter configuration
      const inversorSelecionado = dimensioningData.inverters?.[0];
      inversores.push({
        inversor: {
          fabricante: inversorSelecionado?.fabricante || "Exemplo",
          modelo: inversorSelecionado?.modelo || "INV-01 3.0kW",
          potencia_saida_ca_w: inversorSelecionado?.potenciaSaidaCA || inversorSelecionado?.potencia_saida_ca_w || 5000,
          tipo_rede: inversorSelecionado?.tipoRede || inversorSelecionado?.tipo_rede || "monofásico",
          potencia_fv_max_w: inversorSelecionado?.potenciaFvMax || 6000,
          tensao_cc_max_v: inversorSelecionado?.tensaoCcMax || 600,
          numero_mppt: inversorSelecionado?.numeroMppt || 2,
          strings_por_mppt: inversorSelecionado?.stringsPorMppt || 1,
          eficiencia_max: inversorSelecionado?.eficienciaMax || 98.0,
          efficiency_dc_ac: inversorSelecionado?.efficiency_dc_ac || 0.98
        },
        orientacoes: [{
          nome: "MPPT-1A",
          orientacao: dimensioningData.orientacao || 330,
          inclinacao: dimensioningData.inclinacao || 18,
          modulos_por_string: dimensioningData.modulosPorString || 4,
          numero_strings: 1
        }]
      });
    }

    return {
      lat: dimensioningData.latitude || -22.841432,
      lon: dimensioningData.longitude || -51.957627,
      origem_dados: "NASA",
      startyear: 2015,
      endyear: 2020,
      modelo_decomposicao: "louche",
      modelo_transposicao: "perez",
      mount_type: "close_mount_glass_glass",
      consumo_mensal_kwh: consumoMensalKwh,
      perdas: {
        sujeira: dimensioningData.perdaSujeira || 1.0,
        sombreamento: dimensioningData.perdaSombreamento || 2.0,
        incompatibilidade: dimensioningData.perdaMismatch || 1.0,
        fiacao: dimensioningData.perdaCabeamento || 0.5,
        outras: dimensioningData.perdaOutras || 0.5
      },
      modulo,
      inversores
    };
  }
}

export default SolarSystemService;