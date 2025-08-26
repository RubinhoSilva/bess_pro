# 📊 Integração de Logs de Cálculo Frontend + Backend

Este documento demonstra como integrar os logs detalhados de cálculo entre o frontend e backend.

## ✅ Implementação Atual

### 🚀 **Backend - Logs Implementados**
- ✅ `CalculationLogger` - Classe para capturar logs de cálculo
- ✅ `SolarCalculationService` - Métodos com logging detalhado
- ✅ `CalculateSolarSystemUseCase` - Use case com logs integrados
- ✅ API Response incluindo `calculationLogs` e `_rawLogs`

### 🎨 **Frontend - Sistema de Display**
- ✅ `CalculationLogDisplayer` - Classe para exibir logs no console
- ✅ `BackendCalculationService` - Integração com API do backend
- ✅ Logs detalhados nos cálculos locais (PVDesignForm e SolarSizingWizard)
- ✅ Preparação para integração com backend

## 🔧 Como Usar Atualmente

### **Logs do Frontend (Já Funcionando)**
Todos os cálculos do frontend agora exibem logs detalhados:

```javascript
// Exemplo de saída no console:
🚀 === INICIANDO CÁLCULO DE DIMENSIONAMENTO ===
📊 Dados de entrada: { cliente: "Teste", potenciaModulo: 550, ... }
🔍 Executando validações básicas...
☀️ Irradiação média anual calculada: { valores: [...], soma: 54, media: 4.5, operacao: 'soma / 12' }
⚡ Calculando consumo total mensal...
📋 Processando conta "Conta Principal": [500, 500, ...]
⚡ Consumo total mensal calculado: { valores: [...], total_anual: 6000, operacao: 'soma de todas as contas por mês' }
🔧 Calculando potência e número de módulos...
🧮 Calculando automaticamente baseado no consumo
⚙️ Cálculo automático: { consumoMedioDiario: 16.43, operacao_potencia: "16.43 ÷ (4.5 × 0.85)", potenciaPico_calculada: 4.29, numeroModulos_final: 8 }
✅ === CÁLCULO FINALIZADO COM SUCESSO ===
```

## 🌐 Integração Completa (Para Implementar)

### **Passo 1: Ativar Backend**
Adicionar no `.env` do frontend:
```env
VITE_USE_BACKEND_CALCULATIONS=true
```

### **Passo 2: Modificar Cálculo Existente**
Substituir no `PVDesignForm.tsx` ou `SolarSizingWizard.tsx`:

```typescript
// ANTES (atual):
const results = {
  formData: currentDimensioning,
  potenciaPico,
  numeroModulos,
  // ... outros resultados
};

onCalculationComplete(results);

// DEPOIS (com backend):
import { BackendCalculationService } from '@/lib/backendCalculations';

const results = {
  formData: currentDimensioning,
  potenciaPico,
  numeroModulos,
  // ... outros resultados
};

// Tentar enriquecer com backend
if (currentProject?.id && shouldUseBackendCalculations()) {
  const backendParams = {
    systemParams: {
      potenciaNominal: potenciaPico,
      eficiencia: currentDimensioning.eficienciaSistema || 85,
      perdas: 5,
      inclinacao: 23,
      orientacao: 180
    },
    irradiationData: {
      monthly: currentDimensioning.irradiacaoMensal,
      annual: currentDimensioning.irradiacaoMensal.reduce((a, b) => a + b, 0)
    },
    coordinates: {
      latitude: currentDimensioning.latitude,
      longitude: currentDimensioning.longitude
    },
    financialParams: {
      totalInvestment,
      geracaoEstimadaMensal,
      consumoMensal: totalConsumoMensal,
      tarifaEnergiaB: currentDimensioning.tarifaEnergiaB || 0.8,
      custoFioB: currentDimensioning.custoFioB || 0.3,
      vidaUtil: currentDimensioning.vidaUtil || 25,
      inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
      taxaDesconto: currentDimensioning.taxaDesconto || 8.0
    }
  };

  const enhancedResults = await BackendCalculationService.enhanceWithBackendCalculations(
    currentProject.id,
    results,
    backendParams
  );
  
  onCalculationComplete(enhancedResults);
} else {
  onCalculationComplete(results);
}
```

## 📋 Resultado Esperado Com Backend

Quando integrado, o console exibirá:

```javascript
// Logs do Frontend (como antes)
🚀 === INICIANDO CÁLCULO DE DIMENSIONAMENTO ===
// ... todos os logs detalhados do frontend ...

// Logs do Backend (novos)
🌐 === CHAMADA DE API ===
📍 Endpoint: /api/calculations/projects/123/solar-system
📤 Parâmetros enviados: { systemParams: { ... }, irradiationData: { ... } }

🚀 === LOGS DE CÁLCULO DO BACKEND ===
ℹ️ [2025-08-26T14:05:28.858Z] Sistema: Iniciando cálculo do sistema solar | Dados: {"projectId":"123","userId":"456"}
☀️ [2025-08-26T14:05:28.859Z] Solar: Iniciando cálculo de geração mensal | Dados: {"potenciaNominal":4.29,"eficiencia":85,"perdas":5}
🧮 [2025-08-26T14:05:28.860Z] Solar: Fator de correção por latitude calculado | Operação: getLatitudeFactor(-23.5505) | Dados: {"latitudeFactor":0.95}
🧮 [2025-08-26T14:05:28.861Z] Solar: Eficiência do sistema calculada | Operação: (85 / 100) × (1 - 5 / 100) | Dados: {"systemEfficiency":0.8075}
🧮 [2025-08-26T14:05:28.862Z] Solar: Geração do mês 1 | Operação: 4.29 × 4.5 × 0.8075 × 0.95 × 30 | Dados: {"mes":1,"irradiation":4.5,"generation":448.2}
// ... logs de cada mês ...
✅ [2025-08-26T14:05:28.870Z] Solar: Geração mensal calculada | Dados: {"monthlyGeneration":[448.2,445.1,...],"totalAnual":5234.5}
🧮 [2025-08-26T14:05:28.871Z] Solar: Geração anual total calculada | Operação: soma(448.2 + 445.1 + ...) | Dados: {"annualGeneration":5234.5}
✅ [2025-08-26T14:05:28.872Z] Sistema: Cálculos finalizados com sucesso | Dados: {"monthlyGeneration":[...],"annualGeneration":5234.5}
✅ === FIM DOS LOGS DO BACKEND ===

📥 Resposta da API: { monthlyGeneration: [...], calculationLogs: ["..."], _rawLogs: [...] }
🌐 === FIM CHAMADA DE API ===

✅ Mesclando resultados do frontend com backend
✅ === CÁLCULO FINALIZADO COM SUCESSO ===
```

## 🎯 Benefícios

1. **📊 Transparência Total**: Todos os cálculos visíveis no console
2. **🔍 Debugging Avançado**: Rastreamento completo de operações
3. **🌐 Híbrido**: Frontend + Backend trabalhando juntos
4. **⚡ Performance**: Backend para cálculos pesados, frontend para interface
5. **🔄 Fallback**: Se backend falhar, usa cálculos locais

## 🚀 Status Atual

- ✅ **Backend**: Pronto para receber chamadas e retornar logs
- ✅ **Frontend**: Logs locais funcionando + preparação para backend
- ⏳ **Integração**: Aguardando ativação (uma linha de código)
- ⏳ **Teste**: Aguardando ambiente com backend rodando

Para ativar a integração completa, basta definir `VITE_USE_BACKEND_CALCULATIONS=true` no environment e garantir que o backend esteja executando.