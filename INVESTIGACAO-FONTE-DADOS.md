# 🔍 INVESTIGAÇÃO COMPLETA - PROBLEMA FONTE DE DADOS NASA/PVGIS

## 📋 Problema Original
Usuário seleciona "NASA" no frontend, mas o curl sempre mostra `"origem_dados":"PVGIS"`.

## 🎯 Causa Raiz Identificada

### Problema 1: Fallbacks Hardcoded no Backend
**Arquivo**: `apps/backend/src/presentation/controllers/SolarAnalysisController.ts`

**Linha 323** (método `calculateAdvancedModules`):
```typescript
origem_dados: params.origem_dados || 'PVGIS',  // ❌ FORÇA PVGIS se não vier
```

**Linha similar** (método `analyzeMonthlyIrradiation`):
```typescript
data_source: params.data_source || 'pvgis'  // ❌ FORÇA pvgis se não vier
```

### Problema 2: Fluxo de Dados Complexo
O dado passa por múltiplas camadas:
1. `PVGISIntegration.tsx` (estado local `dataSource`)
2. `LocationForm.tsx` (prop `onFormChange`)
3. `SolarSizingWizard.tsx` (contexto `currentDimensioning.fonteDados`)
4. Backend (rota `analyze-monthly-irradiation` ou `calculate-advanced-modules`)

## 🔧 Correções Implementadas

### 1. Logs de Debug Adicionados

#### Frontend
- **PVGISIntegration.tsx**: Log quando usuário seleciona fonte de dados
- **PVGISIntegration.tsx**: Log quando sincroniza com formData
- **LocationForm.tsx**: Log quando recebe e atualiza fonteDados
- **SolarSizingWizard.tsx**: Log quando atualiza contexto
- **SolarSizingWizard.tsx**: Log quando prepara requisição final

#### Backend
- **analyzeMonthlyIrradiation**: Verifica `params.data_source`
- **calculateAdvancedModules**: Verifica `params.origem_dados`

### 2. Remoção Temporária de Fallbacks

#### analyzeMonthlyIrradiation
```typescript
// ANTES (com fallback)
data_source: params.data_source || 'pvgis'

// AGORA (obrigatório)
if (!params.data_source) {
  return this.badRequest(res, 'data_source é obrigatório (pvgis ou nasa)');
}
data_source: params.data_source
```

#### calculateAdvancedModules
```typescript
// ANTES (com fallback)
origem_dados: params.origem_dados || 'PVGIS'

// AGORA (obrigatório)
if (!params.origem_dados) {
  return this.badRequest(res, 'origem_dados é obrigatório (PVGIS ou NASA)');
}
origem_dados: params.origem_dados
```

## 🧪 Como Testar

1. **Iniciar o frontend e backend**
2. **Abrir console do navegador (F12)**
3. **Navegar para o wizard de dimensionamento**
4. **Selecionar "NASA" na fonte de dados**
5. **Buscar dados de irradiação**
6. **Verificar os logs sequenciais**:

### Logs Esperados no Frontend
```
🔍 [DEBUG] PVGISIntegration - Usuário selecionou fonte de dados: nasa
🔍 [DEBUG] PVGISIntegration - Chamando onFormChange para atualizar fonteDados: nasa
🔍 [DEBUG] LocationForm - Atualizando fonteDados no contexto: nasa
🔍 [DEBUG] SolarSizingWizard - ATUALIZANDO FONTE DE DADOS NO CONTEXTO: nasa
🔍 [DEBUG] SolarSizingWizard - PREPARANDO REQUISIÇÃO: fonteDadosFinal: NASA
```

### Logs Esperados no Backend
```
🔍 [DEBUG BACKEND] analyzeMonthlyIrradiation - data_source usado: nasa
```

## 📊 Fluxo Completo do Dado

```
Usuário seleciona "NASA"
    ↓
PVGISIntegration (estado local: dataSource = 'nasa')
    ↓
useEffect → onFormChange('fonteDados', 'nasa')
    ↓
LocationForm.handlePVGISData → onFormChange('fonteDados', 'nasa')
    ↓
SolarSizingWizard.handleFormChange → updateDimensioning({fonteDados: 'nasa'})
    ↓
DimensioningContext (currentDimensioning.fonteDados = 'nasa')
    ↓
Requisição → { data_source: 'nasa' } ou { origem_dados: 'NASA' }
    ↓
Backend processa com fonte de dados correta
```

## 🎯 Próximos Passos

1. **Testar com as correções atuais**
2. **Se funcionar**, restaurar fallbacks com validação adequada
3. **Se não funcionar**, investigar se há outro ponto no fluxo corrompendo os dados
4. **Remover logs de debug** após confirmação

## 💡 Solução Definitiva (Após Testes)

```typescript
// Com validação adequada
const dataSource = params.data_source?.toLowerCase();
if (!['pvgis', 'nasa'].includes(dataSource)) {
  return this.badRequest(res, 'data_source deve ser "pvgis" ou "nasa"');
}
data_source: dataSource.toUpperCase()
```

## 🔍 Possíveis Outros Pontos de Verificação

Se o problema persistir:
1. Verificar se há **cache** no frontend/banco de dados
2. Verificar se há **middleware** alterando os dados
3. Verificar se há **outras rotas** sendo chamadas
4. Verificar se há **localStorage/sessionStorage** interferindo