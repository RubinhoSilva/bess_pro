# Teste de Integração - Cálculos Financeiros

## Stack Completa Implementada ✅

### 1. **Python Service (FastAPI)** - apps/pvlib-service
- ✅ Endpoint: POST `/api/v1/financial/calculate-advanced`
- ✅ Serviço corrigido com distribuição simultânea de créditos
- ✅ Validações completas de entrada
- ✅ Retorna: VPL, TIR, Payback, Cash Flow, Sensibilidade, Cenários

### 2. **Node.js Backend** - apps/backend
- ✅ **PvlibServiceClient**: Cliente HTTP para Python
  - Arquivo: `src/infrastructure/external-apis/PvlibServiceClient.ts`
  - Registrado no DI Container com token `PVLIB_SERVICE_CLIENT`

- ✅ **CalculateProjectFinancialsUseCase**: Lógica de negócio
  - Arquivo: `src/application/use-cases/calculation/CalculateProjectFinancialsUseCase.ts`
  - Registrado no DI Container
  - Valida permissões e dados antes de enviar para Python
  - Salva resultados no projeto (opcional via query param `?save=false`)

- ✅ **FinancialCalculationController**: API REST
  - Arquivo: `src/presentation/controllers/FinancialCalculationController.ts`
  - Registrado no DI Container
  - Métodos:
    - `calculateProjectFinancials()` - POST cálculo
    - `getLastFinancialResults()` - GET resultados salvos

- ✅ **Routes**: Endpoints REST
  - Arquivo: `src/presentation/routes/CalculationRoutes.ts`
  - POST `/api/v1/calculations/projects/:projectId/calculations/financial`
  - GET `/api/v1/calculations/projects/:projectId/calculations/financial`

### 3. **React Frontend** - apps/frontend
- ✅ **Types**: Interfaces TypeScript
  - Arquivo: `src/types/financial.ts`
  - Tipos completos para input/output
  - Compatível com backend (snake_case)

- ✅ **API Client**: Métodos HTTP
  - Arquivo: `src/lib/api.ts`
  - `api.calculations.calculateProjectFinancials(projectId, data, saveToProject)`
  - `api.calculations.getLastFinancialResults(projectId)`

- ✅ **Hooks**: React Query + Mutations
  - Arquivo: `src/hooks/financial-calculation-hooks.ts`
  - `useCalculateFinancials()` - Mutation para cálculo
  - `useFinancialResults()` - Query para resultados salvos
  - `useProjectFinancials()` - Hook combinado
  - `useValidateFinancialInput()` - Validação frontend

## Como Testar

### Pré-requisitos
1. Python service rodando: `cd apps/pvlib-service && uvicorn main:app --reload --port 8000`
2. Node.js backend rodando: `npm run dev:backend` (porta 8010)
3. React frontend rodando: `npm run dev:frontend` (porta 3003)

### Teste 1: Backend -> Python (direto via curl)

```bash
# 1. Login para obter token
curl -X POST http://localhost:8010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "senha"}'

# Copie o token retornado

# 2. Criar cálculo financeiro
curl -X POST http://localhost:8010/api/v1/calculations/projects/SEU_PROJECT_ID/calculations/financial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "investimento_inicial": 50000,
    "geracao_mensal": [1200, 1150, 1100, 1050, 1000, 950, 950, 1000, 1050, 1100, 1150, 1200],
    "consumo_mensal": [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
    "tarifa_energia": 0.85,
    "custo_fio_b": 0.45,
    "vida_util": 25,
    "taxa_desconto": 10.5,
    "inflacao_energia": 8.0,
    "fator_simultaneidade": 0.8,
    "autoconsumo_remoto_b": true,
    "consumo_mensal_remoto_b": [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500],
    "perc_creditos_b": 1.0
  }'

# 3. Recuperar últimos resultados
curl -X GET http://localhost:8010/api/v1/calculations/projects/SEU_PROJECT_ID/calculations/financial \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Teste 2: Frontend React (exemplo de uso)

```typescript
import { useProjectFinancials } from '@/hooks/financial-calculation-hooks';
import { FinancialCalculationInput } from '@/types/financial';

function FinancialCalculationPage({ projectId }: { projectId: string }) {
  const {
    calculate,
    isCalculating,
    currentResults,
    hasResults,
    savedResults,
  } = useProjectFinancials(projectId, {
    saveToProject: true,
    autoLoadResults: true,
  });

  const handleCalculate = () => {
    const input: FinancialCalculationInput = {
      investimento_inicial: 50000,
      geracao_mensal: [1200, 1150, 1100, 1050, 1000, 950, 950, 1000, 1050, 1100, 1150, 1200],
      consumo_mensal: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
      tarifa_energia: 0.85,
      custo_fio_b: 0.45,
      vida_util: 25,
      taxa_desconto: 10.5,
      inflacao_energia: 8.0,
      fator_simultaneidade: 0.8,
    };

    calculate(input);
  };

  return (
    <div>
      <button onClick={handleCalculate} disabled={isCalculating}>
        {isCalculating ? 'Calculando...' : 'Calcular Viabilidade'}
      </button>

      {hasResults && currentResults && (
        <div>
          <h2>Resultados Financeiros</h2>
          <p>VPL: R$ {currentResults.vpl.toLocaleString('pt-BR')}</p>
          <p>TIR: {currentResults.tir.toFixed(2)}%</p>
          <p>Payback Simples: {currentResults.payback_simples.toFixed(1)} anos</p>
          <p>Payback Descontado: {currentResults.payback_descontado.toFixed(1)} anos</p>
        </div>
      )}
    </div>
  );
}
```

## Checklist de Verificação

- [x] Python service implementado e corrigido
- [x] Node.js client criado (PvlibServiceClient)
- [x] Use case criado (CalculateProjectFinancialsUseCase)
- [x] Controller criado (FinancialCalculationController)
- [x] Routes adicionadas (CalculationRoutes)
- [x] TypeScript types criados (frontend)
- [x] API client atualizado (frontend)
- [x] React hooks criados
- [ ] Componentes React (opcional - conforme necessidade)
- [ ] Teste end-to-end manual
- [ ] Variável ambiente PVLIB_SERVICE_URL configurada

## Próximos Passos

1. **Configurar variável ambiente** (se necessário):
   ```bash
   # .env (backend)
   PVLIB_SERVICE_URL=http://localhost:8000
   ```

2. **Testar via Postman/curl** com os exemplos acima

3. **Criar componentes React** (se necessário):
   - Form para entrada de dados
   - Dashboard para visualização de resultados
   - Charts para cash flow e sensibilidade

4. **Documentar no README** do projeto

## Arquitetura do Fluxo

```
┌─────────────────┐
│  React Frontend │
│  (port 3003)    │
└────────┬────────┘
         │ POST /api/v1/calculations/projects/:id/calculations/financial
         ▼
┌─────────────────┐
│ Node.js Backend │
│  (port 8010)    │
│                 │
│  ├─ Routes      │
│  ├─ Controller  │
│  ├─ Use Case    │
│  └─ Client      │──┐
└─────────────────┘  │
                     │ HTTP POST /api/v1/financial/calculate-advanced
                     ▼
           ┌─────────────────┐
           │ Python FastAPI  │
           │  (port 8000)    │
           │                 │
           │  ├─ Router      │
           │  ├─ Service     │
           │  └─ Models      │
           └─────────────────┘
```

## Benefícios da Implementação

1. **Separação de responsabilidades**: Cada camada tem sua função específica
2. **Type safety**: TypeScript em toda a stack Node.js/React
3. **Reusabilidade**: Hooks podem ser usados em múltiplos componentes
4. **Cache inteligente**: React Query gerencia cache automaticamente
5. **Validação em camadas**: Frontend, Node.js backend e Python service
6. **DI Container**: Fácil teste e manutenção do backend
7. **Persistência opcional**: Pode calcular sem salvar no projeto
