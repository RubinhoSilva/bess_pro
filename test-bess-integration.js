const bessAnalysisService = require('./apps/frontend/src/lib/bessAnalysisService.ts');

// Test request data
const testRequest = {
  sistema_solar: {
    lat: -23.5505,
    lon: -46.6333,
    origem_dados: 'PVGIS',
    startyear: 2020,
    endyear: 2020,
    modelo_decomposicao: 'erbs',
    modelo_transposicao: 'perez',
    mount_type: 'open_rack_glass_glass',
    consumo_mensal_kwh: [3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000],
    perdas: { sujeira: 2, sombreamento: 3, incompatibilidade: 2, fiacao: 1.5, outras: 1 },
    modulo: {
      fabricante: 'Canadian Solar',
      modelo: 'CS3W-540MS',
      potencia_nominal_w: 550,
      largura_mm: 2261,
      altura_mm: 1134,
      peso_kg: 27.5,
      vmpp: 41.4,
      impp: 13.05,
      voc_stc: 51.16,
      isc_stc: 14.55,
      eficiencia: 20.9,
      temp_coef_pmax: -0.37,
      alpha_sc: 0.00041,
      beta_oc: -0.0025,
      gamma_r: -0.0029,
      cells_in_series: 144,
      a_ref: 1.8,
      il_ref: 14.86,
      io_ref: 2.5e-12,
      rs: 0.25,
      rsh_ref: 450.0
    },
    inversores: [{
      inversor: {
        fabricante: 'Generic',
        modelo: 'Standard Inverter',
        potencia_saida_ca_w: 100000,
        potencia_fv_max_w: 120000,
        numero_mppt: 2,
        eficiencia_max: 98.0,
        efficiency_dc_ac: 0.98,
        tensao_cc_max_v: 1000,
        strings_por_mppt: 2,
        tipo_rede: 'Trifásico 380V'
      },
      orientacoes: [{
        nome: 'Telhado Principal',
        orientacao: 0,
        inclinacao: 23.5505,
        modulos_por_string: 14,
        numero_strings: 2
      }]
    }]
  },
  capacidade_kwh: 200,
  potencia_kw: 50,
  tipo_bateria: 'litio',
  eficiencia_roundtrip: 0.9,
  profundidade_descarga_max: 0.9,
  soc_inicial: 0.5,
  soc_minimo: 0.1,
  soc_maximo: 1,
  tarifa: {
    tipo: 'convencional',
    tarifa_fora_ponta_kwh: 0.85,
    tarifa_ponta_kwh: 1.275,
    tarifa_demanda_ponta: 0,
    tarifa_demanda_fora_ponta: 0
  },
  perfil_consumo: {
    tipo: 'comercial'
  },
  estrategia: 'arbitragem',
  custo_kwh_bateria: 3000,
  custo_kw_inversor_bess: 1500,
  custo_instalacao_bess: 50000,
  taxa_desconto: 0.08,
  vida_util_anos: 20
};

console.log('Testing BESS validation...');
const errors = bessAnalysisService.validateHybridRequest(testRequest);
console.log('Validation errors:', errors);
console.log('Test completed!');