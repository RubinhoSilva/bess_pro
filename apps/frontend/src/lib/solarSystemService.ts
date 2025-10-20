import { api } from './api';
import { CalculationConstants } from '@/constants/CalculationConstants';
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';

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
  potencia_fv_max_w?: number;
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

      
      const response = await api.post('/solar-analysis/calculate-system', params);
      
      if (response.data && response.data.data) {

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

      
      const response = await api.post('/solar-analysis/calculate-irradiation-correction', params);
      
      if (response.data && response.data.data) {

        const data = response.data.data;
        return {
          irradiacaoCorrigida: data.irradiacaoCorrigida || Array(12).fill(10),
          message: data.message
        };
      }
      
      throw new Error('Resposta inválida do serviço');
    } catch (error: any) {

      
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

      
      const response = await api.post('/solar-analysis/calculate-module-count', params);
      
      if (response.data && response.data.data) {

        const data = response.data.data;
        return {
          numeroModulos: data.numeroModulos || 25,
          message: data.message
        };
      }
      
      throw new Error('Resposta inválida do serviço');
    } catch (error: any) {

      
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

      throw new Error('Erro ao buscar dados de irradiação mensal');
    }
  }

  /**
   * Cálculo avançado de módulos com dados completos do módulo e inversor
   */
  static async calculateAdvancedModules(params: MultiInverterCalculationParams, inversorGlobal?: any): Promise<AdvancedModuleCalculationResult> {
    try {

      
      // ✅ PROCESSAR MÚLTIPLAS ÁGUAS DE TELHADO
      const processedParams = this._processRoofWatersForCalculation(params, inversorGlobal);

      // Fazer chamada através do backend Node.js
      console.log('🔍 Enviando para API /solar-analysis/calculate-advanced-modules:', processedParams);
      const response = await api.post('/solar-analysis/calculate-advanced-modules', processedParams);
      console.log('🔍 Resposta completa da API:', response.data);
      console.log('🔍 Response data:', response.data?.data);
      console.log('🔍 Potência na resposta da API:', response.data?.data?.potencia_total_kw);
      console.log('🔍 Energia na resposta da API (energia_total_anual_kwh):', response.data?.data?.energia_total_anual_kwh);
      console.log('🔍 Energia na resposta da API (energiaAnualKwh):', response.data?.data?.energiaAnualKwh);
       
      
      // A resposta agora vem no formato { success: true, data: {...}, timestamp: "..." }
      if (response.data && response.data.success && response.data.data) {
        console.log('✅ Retornando response.data.data:', response.data.data);
        return response.data.data;
      }
      
      // Fallback para compatibilidade
      return response.data;
    } catch (error: any) {

      
      if (error.message.includes('fetch')) {
        throw new Error('Erro de conexão com o serviço Python');
      }
      
      throw new Error(error.message || 'Erro interno no cálculo avançado de módulos');
    }
  }

  /**
   * Calcula sistema avançado a partir dos dados do dimensionamento
   * Função otimizada - sem dados defaults, passa os dados diretamente para a API
   */
  static async calculateAdvancedFromDimensioning(dimensioningData: any): Promise<AdvancedModuleCalculationResult> {
    
    // Extrair dados diretamente sem defaults
    const moduloSelecionado = dimensioningData.selectedModules?.[0];
    const inversorSelecionado = dimensioningData.inverters?.[0];
    
    // CORREÇÃO: Usar a store para calcular consumo baseado no grupo tarifário
    const store = usePVDimensioningStore.getState();
    let consumoMensal: number[] = [];
    
    // Verificar se há dados de consumo e calcular baseado no grupo tarifário
    if (dimensioningData.energyBills && dimensioningData.energyBills.length > 0) {
      // Grupo B: usar consumoMensal diretamente
      consumoMensal = Array(12).fill(0);
      dimensioningData.energyBills.forEach((bill: any) => {
        if (bill.consumoMensal && Array.isArray(bill.consumoMensal)) {
          for (let i = 0; i < 12; i++) {
            consumoMensal[i] += bill.consumoMensal[i] || 0;
          }
        }
      });
    } else if (dimensioningData.energyBillsA && dimensioningData.energyBillsA.length > 0) {
      // Grupo A: somar ponta + fora ponta para cada mês
      consumoMensal = Array(12).fill(0);
      dimensioningData.energyBillsA.forEach((bill: any) => {
        if (bill.consumoMensalPonta && Array.isArray(bill.consumoMensalPonta) &&
            bill.consumoMensalForaPonta && Array.isArray(bill.consumoMensalForaPonta)) {
          for (let i = 0; i < 12; i++) {
            consumoMensal[i] += (bill.consumoMensalPonta[i] || 0) + (bill.consumoMensalForaPonta[i] || 0);
          }
        }
      });
    }
    
    // Calcular consumo anual a partir dos dados mensais
    const consumoAnual = consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
    
    console.log('[SolarSystemService] calculateAdvancedFromDimensioning - consumo calculado:', {
      grupoTarifario: store.customer?.grupoTarifario,
      consumoMensal,
      consumoAnual
    });

    // Montar parâmetros diretamente com os dados recebidos
    const params: MultiInverterCalculationParams = {
      lat: dimensioningData.latitude,
      lon: dimensioningData.longitude,
      origem_dados: dimensioningData.fonteDados?.toUpperCase() || 'PVGIS',
      startyear: 2015,
      endyear: 2020,
      modelo_decomposicao: dimensioningData.modelo_decomposicao || 'louche',
      modelo_transposicao: dimensioningData.modelo_transposicao || 'perez',
      consumo_anual_kwh: consumoAnual,
      modulo: moduloSelecionado,
      perdas: {
        sujeira: dimensioningData.perdaSujeira ?? 0,
        sombreamento: dimensioningData.perdaSombreamento ?? 0,
        incompatibilidade: dimensioningData.perdaMismatch ?? 0,
        fiacao: dimensioningData.perdaCabeamento ?? 0,
        outras: dimensioningData.perdaOutras ?? 0
      },
      num_modules: dimensioningData.num_modules,
      aguasTelhado: dimensioningData.aguasTelhado
    };

    return this.calculateAdvancedModules(params, inversorSelecionado);
  }

/**
    * ✅ Processa múltiplas águas de telhado para cálculo
    */
  private static _processRoofWatersForCalculation(params: MultiInverterCalculationParams, inversorGlobal?: any): any {

    // Se há águas de telhado, transformar para o formato que o Python espera
    if (params.aguasTelhado && params.aguasTelhado.length > 0) {
      
      // Agrupar águas por inversor para criar a estrutura esperada pelo Python
      const inversoresMap = new Map();
      
      params.aguasTelhado.forEach(agua => {
        const inversorId = agua.inversorId || 'default';
        
        if (!inversoresMap.has(inversorId)) {
          // Usar inversor da água ou o inversor global/padrão
          const inversorData = agua.inversor || inversorGlobal || {
            fabricante: "WEG",
            modelo: "SIW500H-M",
            potencia_saida_ca_w: 7500,
            tipo_rede: "Monofásico 220V",
            potencia_fv_max_w: 7500,
            tensao_cc_max_v: 600,
            numero_mppt: 2,
            strings_por_mppt: 2,
            eficiencia_max: 97.6,
            efficiency_dc_ac: 0.976,
            corrente_entrada_max_a: 20,
            potencia_aparente_max_va: 7500
          };
          
          inversoresMap.set(inversorId, {
            inversor: inversorData,
            orientacoes: []
          });
        }
        
        // Adicionar orientação para este inversor
        inversoresMap.get(inversorId).orientacoes.push({
          nome: agua.nome,
          orientacao: agua.orientacao,
          inclinacao: agua.inclinacao,
          modulos_por_string: agua.numeroModulos, // Simplificado: assume 1 string
          numero_strings: 1 // Simplificado: assume 1 string
        });
      });
      
      const inversores = Array.from(inversoresMap.values());
      
      // CORREÇÃO: Converter consumo_anual_kwh para consumo_mensal_kwh usando dados reais
      // Primeiro, tentar obter os dados mensais reais da store
      const store = usePVDimensioningStore.getState();
      let consumoMensalKwh: number[] = [];
      
      // Tentar obter dados mensais da store
      if (store.energy?.energyBills?.length || store.energy?.energyBillsA?.length) {
        consumoMensalKwh = store.calcularConsumoMensal();
      } else {
        // Fallback: distribuir igualmente (mantendo compatibilidade)
        consumoMensalKwh = Array(12).fill(Math.round((params.consumo_anual_kwh || 0) / 12));
      }
      
      console.log('[SolarSystemService] _processRoofWatersForCalculation - consumo mensal:', {
        grupoTarifario: store.customer?.grupoTarifario,
        consumoMensalKwh
      });
      
      const processedParams = {
        // ✅ Campos obrigatórios no formato Python
        lat: params.lat,
        lon: params.lon,
        origem_dados: params.origem_dados || 'PVGIS',
        startyear: params.startyear || 2015,
        endyear: params.endyear || 2020,
        modelo_decomposicao: params.modelo_decomposicao || 'louche',
        modelo_transposicao: params.modelo_transposicao || 'perez',
        mount_type: 'close_mount_glass_glass', // Campo obrigatório que faltava
        
        // ✅ Consumo mensal (não anual)
        consumo_mensal_kwh: consumoMensalKwh,
        
        // ✅ Módulo e perdas
        modulo: params.modulo,
        perdas: params.perdas || {
          sujeira: 0,
          sombreamento: 0,
          incompatibilidade: 0,
          fiacao: 0,
          outras: 0
        },
        
        // ✅ Estrutura de inversores com orientações (formato Python)
        inversores: inversores
      };

      // Remover campos que não existem no formato Python
      delete (processedParams as any).consumo_anual_kwh;
      delete (processedParams as any).perdas_sistema;
      delete (processedParams as any).fator_seguranca;
      delete (processedParams as any).aguasTelhado;

      return processedParams;
    }

    // CORREÇÃO: Fallback para sistema único - usar dados reais quando possível
    const store = usePVDimensioningStore.getState();
    let consumoMensalKwh: number[] = [];
    
    // Tentar obter dados mensais da store
    if (store.energy?.energyBills?.length || store.energy?.energyBillsA?.length) {
      consumoMensalKwh = store.calcularConsumoMensal();
    } else {
      // Fallback: distribuir igualmente (mantendo compatibilidade)
      consumoMensalKwh = Array(12).fill(Math.round((params.consumo_anual_kwh || 0) / 12));
    }
    
    console.log('[SolarSystemService] fallback - consumo mensal:', {
      grupoTarifario: store.customer?.grupoTarifario,
      consumoMensalKwh
    });
    
    return {
      lat: params.lat,
      lon: params.lon,
      origem_dados: params.origem_dados || 'PVGIS',
      startyear: params.startyear || 2015,
      endyear: params.endyear || 2020,
      modelo_decomposicao: params.modelo_decomposicao || 'louche',
      modelo_transposicao: params.modelo_transposicao || 'perez',
      mount_type: 'close_mount_glass_glass',
      consumo_mensal_kwh: consumoMensalKwh,
      modulo: params.modulo,
      perdas: params.perdas || {
        sujeira: 0,
        sombreamento: 0,
        incompatibilidade: 0,
        fiacao: 0,
        outras: 0
      },
      inversores: [{
        inversor: inversorGlobal || {
          fabricante: "WEG",
          modelo: "SIW500H-M",
          potencia_saida_ca_w: 7500,
          tipo_rede: "Monofásico 220V",
          potencia_fv_max_w: 7500,
          tensao_cc_max_v: 600,
          numero_mppt: 2,
          strings_por_mppt: 2,
          eficiencia_max: 97.6,
          efficiency_dc_ac: 0.976,
          corrente_entrada_max_a: 20,
          potencia_aparente_max_va: 7500
        },
        orientacoes: [{
          nome: "Orientação Única",
          orientacao: (params as any).orientacao || 180,
          inclinacao: (params as any).inclinacao || 20,
          modulos_por_string: params.num_modules || 10,
          numero_strings: 1
        }]
      }]
    };
  }

  /**
   * Calcula limites de MPPT para inversores
   */
  static async calculateMPPTLimits(params: MPPTCalculationRequest): Promise<MPPTCalculationResponse> {
    try {


      const response = await api.post('/solar-analysis/pvlib/mppt/calculate-modules-per-mppt', params);

      // Aceitar tanto formato com wrapper quanto formato direto
      if (response.data) {
        if (response.data.success && response.data.data) {
          // Formato com wrapper: { success: true, data: {...} }

          return response.data.data;
        } else if (response.data.modulos_por_mppt !== undefined) {
          // Formato direto: { modulos_por_mppt: 18, ... }

          return response.data;
        }
      }


      throw new Error('Resposta inválida do serviço MPPT');
    } catch (error: any) {


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


      const response = await api.post('/solar-analysis/calculate-complete-system', params);

      if (response.data) {

        return response.data;
      }

      throw new Error('Resposta inválida do serviço');
    } catch (error: any) {


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
    }, Array(12).fill(CalculationConstants.CONSUMPTION_DEFAULTS.DEFAULT_MONTHLY_CONSUMPTION_KWH)) || Array(12).fill(CalculationConstants.CONSUMPTION_DEFAULTS.DEFAULT_MONTHLY_CONSUMPTION_KWH);

    // Ensure we have exactly 12 values
    const consumoMensalKwh = consumoMensal.length === 12
      ? consumoMensal
      : Array(12).fill(CalculationConstants.CONSUMPTION_DEFAULTS.DEFAULT_MONTHLY_CONSUMPTION_KWH);

    // Get module data
    const moduloSelecionado = dimensioningData.selectedModules?.[0];
    const modulo = {
      fabricante: moduloSelecionado?.fabricante,
      modelo: moduloSelecionado?.modelo,
      potencia_nominal_w: moduloSelecionado?.potenciaNominal,
      largura_mm: moduloSelecionado?.larguraMm,
      altura_mm: moduloSelecionado?.alturaMm,
      peso_kg: moduloSelecionado?.pesoKg,
      vmpp: moduloSelecionado?.vmpp,
      impp: moduloSelecionado?.impp,
      voc_stc: moduloSelecionado?.vocStc,
      isc_stc: moduloSelecionado?.iscStc,
      eficiencia: moduloSelecionado?.eficiencia,
      temp_coef_pmax: moduloSelecionado?.tempCoefPmax,
      alpha_sc: moduloSelecionado?.alphaSc || moduloSelecionado?.tempCoefPmax,
      beta_oc: moduloSelecionado?.betaOc || moduloSelecionado?.tempCoefVoc,
      gamma_r: moduloSelecionado?.gammaR || moduloSelecionado?.tempCoefIsc,
      cells_in_series: moduloSelecionado?.cellsInSeries,
      a_ref: moduloSelecionado?.aRef,
      il_ref: moduloSelecionado?.iLRef,
      io_ref: moduloSelecionado?.iORef,
      rs: moduloSelecionado?.rS,
      rsh_ref: moduloSelecionado?.rShRef
    };

    // Build inversores array from aguasTelhado or inverters
    const inversores: CompleteSystemCalculationParams['inversores'] = [];

    if (dimensioningData.aguasTelhado && dimensioningData.aguasTelhado.length > 0) {
      // Multi-inverter configuration with multiple roof areas
      const inversorSelecionado = dimensioningData.inverters?.[0];

      const inversorData = {
        fabricante: inversorSelecionado?.fabricante,
        modelo: inversorSelecionado?.modelo,
        potencia_saida_ca_w: inversorSelecionado?.potenciaSaidaCA || inversorSelecionado?.potencia_saida_ca_w,
        tipo_rede: inversorSelecionado?.tipoRede || inversorSelecionado?.tipo_rede,
        potencia_fv_max_w: inversorSelecionado?.potenciaFvMax,
        tensao_cc_max_v: inversorSelecionado?.tensaoCcMax,
        numero_mppt: inversorSelecionado?.numeroMpp,
        strings_por_mppt: inversorSelecionado?.stringsPorMppt,
        eficiencia_max: inversorSelecionado?.eficienciaMax,
        efficiency_dc_ac: inversorSelecionado?.efficiency_dc_ac
      };

      inversores.push({
        inversor: inversorData,
        orientacoes: dimensioningData.aguasTelhado.map((agua: any, index: number) => ({
          nome: agua.nome || `MPPT-${index + 1}`,
          orientacao: agua.orientacao,
          inclinacao: agua.inclinacao,
          modulos_por_string: agua.numeroModulos,
          numero_strings: inversorData.strings_por_mppt
        }))
      });
    } else {
      // Single inverter configuration
      const inversorSelecionado = dimensioningData.inverters?.[0];

      inversores.push({
        inversor: {
          fabricante: inversorSelecionado?.fabricante ,
          modelo: inversorSelecionado?.modelo,
        potencia_saida_ca_w: inversorSelecionado?.potenciaFvMax || inversorSelecionado?.potenciaSaidaCA || inversorSelecionado?.potencia_saida_ca_w,
          tipo_rede: inversorSelecionado?.tipoRede || inversorSelecionado?.tipo_rede,
          potencia_fv_max_w: inversorSelecionado?.potenciaFvMax,
          tensao_cc_max_v: inversorSelecionado?.tensaoCcMax,
          numero_mppt: inversorSelecionado?.numeroMppt,
          strings_por_mppt: inversorSelecionado?.stringsPorMppt,
          eficiencia_max: inversorSelecionado?.eficienciaMax,
          efficiency_dc_ac: inversorSelecionado?.efficiency_dc_ac
        },
        orientacoes: [{
          nome: "MPPT-1A",
          orientacao: dimensioningData.orientacao,
          inclinacao: dimensioningData.inclinacao,
          modulos_por_string: dimensioningData.modulosPorString,
          numero_strings: 1
        }]
      });
    }

    return {
      lat: dimensioningData.latitude,
      lon: dimensioningData.longitude,
      origem_dados: "NASA",
      startyear: 2015,
      endyear: 2020,
      modelo_decomposicao: "louche",
      modelo_transposicao: "perez",
      mount_type: "close_mount_glass_glass",
      consumo_mensal_kwh: consumoMensalKwh,
      perdas: {
        sujeira: dimensioningData.perdaSujeira,
        sombreamento: dimensioningData.perdaSombreamento,
        incompatibilidade: dimensioningData.perdaMismatch,
        fiacao: dimensioningData.perdaCabeamento,
        outras: dimensioningData.perdaOutras
      },
      modulo,
      inversores
    };
  }
}

export default SolarSystemService;