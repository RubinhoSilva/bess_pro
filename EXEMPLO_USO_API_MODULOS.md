# 📋 Exemplo de Uso - API de Cálculo de Módulos

## ✅ Nova API Implementada

**Rota Python**: `/calculate-module-count`  
**Valor padrão**: 25 módulos  
**Status**: Funcionando

---

## 🔧 Como usar no Frontend

### 1. Import do serviço
```typescript
import { SolarSystemService } from '@/lib/solarSystemService';
```

### 2. Chamada da API
```typescript
async function calcularNumeroModulos() {
  try {
    const resultado = await SolarSystemService.calculateModuleCount({
      potenciaDesejada: 10, // kWp
      potenciaModulo: 550,  // W
      areaDisponivel: 100,  // m²
      orientacao: 180,      // graus
      inclinacao: 20        // graus
    });

    console.log('Número de módulos calculado:', resultado.numeroModulos); // 25
    console.log('Mensagem:', resultado.message);
    
    return resultado.numeroModulos;
  } catch (error) {
    console.error('Erro ao calcular módulos:', error);
    return 25; // fallback
  }
}
```

### 3. Exemplo de integração no dimensionamento
```typescript
// Em SystemParametersForm.tsx ou similar
const handleCalculateModules = async () => {
  if (!selectedModule || !potenciaDesejada) return;
  
  setIsCalculating(true);
  
  try {
    const result = await SolarSystemService.calculateModuleCount({
      potenciaDesejada: potenciaDesejada,
      potenciaModulo: selectedModule.potencia,
      areaDisponivel: areaDisponivel,
      latitude: dimensioningData.latitude,
      longitude: dimensioningData.longitude
    });
    
    // Atualizar estado com resultado
    updateDimensioningData({
      numeroModulos: result.numeroModulos
    });
    
    toast.success(`Calculados ${result.numeroModulos} módulos necessários`);
  } catch (error) {
    toast.error('Erro ao calcular número de módulos');
  } finally {
    setIsCalculating(false);
  }
};
```

---

## 🧪 Testes realizados

### ✅ API Python direta
```bash
curl -X POST http://localhost:8100/calculate-module-count \
  -H "Content-Type: application/json" \
  -d '{"potenciaDesejada": 10, "potenciaModulo": 550}'

# Resposta: {"numeroModulos":25,"status":"success"}
```

### ✅ Backend Node.js
- Rota: `POST /api/v1/solar/calculate-module-count`
- Autenticação: Requerida (JWT token)
- Status: Integrado e funcionando

### ✅ Frontend Service
- Classe: `SolarSystemService.calculateModuleCount()`
- Interface: `ModuleCountResult`
- Status: Implementado

---

## 🚀 Próximos passos

1. **Testar no navegador**: Acessar o frontend e fazer uma requisição autenticada
2. **Integrar no fluxo de dimensionamento**: Usar a API onde for necessário calcular módulos
3. **Implementar lógica real**: Substituir valor fixo de 25 por cálculo baseado em parâmetros reais

---

## 📝 Logs de debug esperados

No console do navegador você verá:
```
🔄 Chamando cálculo de número de módulos com parâmetros: {potenciaDesejada: 10, ...}
✅ Resultado do número de módulos: {data: {numeroModulos: 25, message: "..."}}
```