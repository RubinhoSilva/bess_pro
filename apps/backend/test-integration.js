const axios = require('axios');

async function testNodePythonIntegration() {
  console.log('🚀 Testando integração Node.js → Python diretamente...');
  
  const client = axios.create({
    baseURL: 'http://host.docker.internal:8110',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const testData = {
    investimento_inicial: 10000,
    geracao_mensal: [500, 450, 600, 700, 800, 900, 950, 900, 750, 600, 500, 450],
    consumo_mensal: [400, 380, 420, 450, 500, 550, 580, 560, 480, 420, 400, 380],
    tarifa_energia: 0.75,
    custo_fio_b: 0.05,
    vida_util: 25,
    taxa_desconto: 8.0,
    inflacao_energia: 5.0
  };

  try {
    console.log('📤 Enviando requisição para Python:', {
      investimento: testData.investimento_inicial,
      geracao_anual: testData.geracao_mensal.reduce((a, b) => a + b, 0),
      consumo_anual: testData.consumo_mensal.reduce((a, b) => a + b, 0),
    });

    const response = await client.post('/api/v1/financial/calculate-advanced', testData);
    
    if (response.data.success) {
      console.log('✅ SUCESSO! Integração Node.js → Python funcionando!');
      console.log('📊 Resultados:', {
        vpl: response.data.data.vpl,
        tir: response.data.data.tir,
        payback: response.data.data.payback_simples,
        economia_total: response.data.data.economia_total_25_anos
      });
      console.log('💰 Fluxo de caixa:', response.data.data.cash_flow.length, 'anos');
      return true;
    } else {
      console.log('❌ Erro na resposta:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na integração:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('🔍 Verifique se o pvlib-service está rodando na porta 8110');
    }
    return false;
  }
}

testNodePythonIntegration().then(success => {
  console.log(success ? '\n🎉 TESTE CONCLUÍDO COM SUCESSO!' : '\n💥 TESTE FALHOU!');
  process.exit(success ? 0 : 1);
});