const axios = require('axios');

async function testBackendFinancial() {
  try {
    console.log('🧪 Testando endpoint do backend...');
    
    const testData = {
      investimento_inicial: 30000,
      geracao_mensal: [355.9, 355.9, 355.9, 355.9, 355.9, 355.9, 355.9, 355.9, 355.9, 355.9, 355.9, 355.9],
      consumo_mensal: [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300],
      tarifa_energia: 0.8,
      custo_fio_b: 0.3,
      vida_util: 25,
      taxa_desconto: 8.0,
      inflacao_energia: 4.5,
      degradacao_modulos: 0.5,
      custo_om: 300,
      inflacao_om: 4.0,
      modalidade_tarifaria: 'convencional'
    };
    
    console.log('📤 Enviando dados para backend:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:3002/api/solar-analysis/calculate-advanced-financial', testData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Resposta do backend:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testBackendFinancial();