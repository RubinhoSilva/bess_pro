# INVESTIGAÇÃO COMPLETA - FLUXO DE FONTE DE DADOS

## Problema Identificado

O usuário seleciona "NASA" no frontend, mas o curl sempre mostra `"origem_dados":"PVGIS"`.

## Hipóteses

1. **Problema no contexto/estado**: `currentDimensioning.fonteDados` não está sendo atualizado
2. **Problema no sync**: `dataSource` do PVGISIntegration não está sincronizado com o contexto
3. **Fallback no backend**: Backend está forçando 'PVGIS' como fallback
4. **Múltiplas fontes de verdade**: Dados vindo de diferentes lugares

## Pontos de Verificação

### 1. Frontend - PVGISIntegration.tsx
- ✅ RadioGroup atualiza `dataSource` local
- ✅ useEffect sync `dataSource` → `formData.fonteDados` via `onFormChange`
- ✅ Requisição envia `data_source: dataSource`

### 2. Frontend - LocationForm.tsx
- ✅ Recebe `fonteDados` do PVGISIntegration
- ✅ Chama `onFormChange('fonteDados', data.fonteDados)`

### 3. Frontend - SolarSizingWizard.tsx
- ✅ `handleFormChange` atualiza contexto via `updateDimensioning`
- ✅ Requisição final usa `currentDimensioning.fonteDados`

### 4. Backend - SolarAnalysisController.ts
- ⚠️ **PROBLEMA 1**: `analyzeMonthlyIrradiation` usa fallback `data_source || 'pvgis'`
- ⚠️ **PROBLEMA 2**: `calculateAdvancedModules` usa fallback `origem_dados || 'PVGIS'`

## Logs Adicionados

### Frontend
1. **PVGISIntegration**: Quando usuário seleciona fonte de dados
2. **PVGISIntegration**: Quando sincroniza com formData
3. **LocationForm**: Quando recebe e atualiza fonteDados
4. **SolarSizingWizard**: Quando atualiza contexto
5. **SolarSizingWizard**: Quando prepara requisição final

### Backend
1. **analyzeMonthlyIrradiation**: Verifica `params.data_source`
2. **calculateAdvancedModules**: Verifica `params.origem_dados`

## Teste Manual

1. Abrir console do navegador
2. Selecionar "NASA" no frontend
3. Buscar dados de irradiação
4. Verificar logs sequenciais:
   - `🔍 [DEBUG] PVGISIntegration - Usuário selecionou fonte de dados: nasa`
   - `🔍 [DEBUG] PVGISIntegration - Chamando onFormChange para atualizar fonteDados: nasa`
   - `🔍 [DEBUG] LocationForm - Atualizando fonteDados no contexto: nasa`
   - `🔍 [DEBUG] SolarSizingWizard - ATUALIZANDO FONTE DE DADOS NO CONTEXTO: nasa`
   - `🔍 [DEBUG] SolarSizingWizard - PREPARANDO REQUISIÇÃO: fonteDadosFinal: NASA`

## Possíveis Soluções

1. **Remover fallbacks hardcoded** no backend
2. **Verificar se dados estão chegando** corretamente no backend
3. **Adicionar validação** para garantir que NASA/NASA sejam maiúsculas/minúsculas consistentes
4. **Verificar se há cache** interferindo nos dados

## Próximos Passos

1. Testar com os novos logs
2. Identificar exatamente onde o fluxo quebra
3. Corrigir o problema específico
4. Remover logs de debug após correção