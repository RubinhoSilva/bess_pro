# Guia de Integração: Cálculos Financeiros
## Frontend (React) → Backend (Node.js) → Python Service

---

## ✅ CONCLUÍDO

### 1. Python FastAPI Endpoint
- **Status**: ✅ Pronto
- **Endpoint**: `POST /api/v1/financial/calculate-advanced`
- **Localização**: `apps/pvlib-service/api/financial_router.py`

### 2. Node.js Service Client
- **Status**: ✅ Implementado
- **Arquivo**: `apps/backend/src/infrastructure/external-apis/PvlibServiceClient.ts`
- **Registro DI**: ✅ Concluído
- **Config**: ✅ `PVLIB_SERVICE_URL` em AppConfig

---

## 📋 PRÓXIMAS IMPLEMENTAÇÕES

### 3. Node.js Use Case

**Arquivo**: `apps/backend/src/application/use-cases/calculation/CalculateProjectFinancialsUseCase.ts`

```typescript
import { IPvlibServiceClient, FinancialCalculationInput } from '@/infrastructure/external-apis/PvlibServiceClient';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { ILogger } from '@/domain/interfaces/ILogger';

export class CalculateProjectFinancialsUseCase {
  constructor(
    private pvlibClient: IPvlibServiceClient,
    private projectRepository: IProjectRepository,
    private logger: ILogger
  ) {}

  async execute(projectId: string, input: FinancialCalculationInput) {
    try {
      this.logger.info(`Calculating financials for project ${projectId}`);

      // 1. Buscar projeto
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // 2. Chamar serviço Python
      const results = await this.pvlibClient.calculateAdvancedFinancials(input);

      // 3. Salvar resultados no projeto (opcional)
      project.calculations = {
        ...project.calculations,
        financial: {
          ...results,
          calculatedAt: new Date(),
          inputs: input
        }
      };

      await this.projectRepository.update(project);

      this.logger.info(`Financial calculation completed for project ${projectId}`);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      this.logger.error('Error calculating financials:', error);
      throw error;
    }
  }
}
```

**Registrar no DI Container** (`ContainerSetup.ts`):

```typescript
// Adicionar token em ServiceTokens.ts
CALCULATE_PROJECT_FINANCIALS_USE_CASE: 'CalculateProjectFinancialsUseCase',

// Registrar factory em ContainerSetup.ts
container.registerFactory(ServiceTokens.CALCULATE_PROJECT_FINANCIALS_USE_CASE, () => {
  return new CalculateProjectFinancialsUseCase(
    container.resolve(ServiceTokens.PVLIB_SERVICE_CLIENT),
    container.resolve(ServiceTokens.ProjectRepository),
    container.resolve('Logger')
  );
});
```

---

### 4. Node.js Controller & Routes

**Arquivo**: `apps/backend/src/presentation/controllers/FinancialCalculationController.ts`

```typescript
import { Request, Response } from 'express';
import { CalculateProjectFinancialsUseCase } from '@/application/use-cases/calculation/CalculateProjectFinancialsUseCase';
import { BaseController } from './BaseController';

export class FinancialCalculationController extends BaseController {
  constructor(
    private calculateFinancialsUseCase: CalculateProjectFinancialsUseCase
  ) {
    super();
  }

  async calculateProjectFinancials(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const financialInput = req.body;

      const result = await this.calculateFinancialsUseCase.execute(
        projectId,
        financialInput
      );

      return this.ok(res, result);
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}
```

**Routes** (`apps/backend/src/presentation/routes/v1/calculation.routes.ts`):

```typescript
import { Router } from 'express';
import { container } from '@/infrastructure/di/Container';
import { ServiceTokens } from '@/infrastructure/di/ServiceTokens';
import { FinancialCalculationController } from '@/presentation/controllers/FinancialCalculationController';
import { authMiddleware } from '@/presentation/middleware/AuthMiddleware';

const router = Router();

// Resolver controller do DI
const financialController = container.resolve<FinancialCalculationController>(
  ServiceTokens.FINANCIAL_CALCULATION_CONTROLLER
);

/**
 * @route POST /api/v1/projects/:projectId/calculations/financial
 * @desc Calculate financial analysis for project
 * @access Private
 */
router.post(
  '/projects/:projectId/calculations/financial',
  authMiddleware,
  (req, res) => financialController.calculateProjectFinancials(req, res)
);

export { router as calculationRoutes };
```

**Registrar Controller no DI**:

```typescript
// Em ServiceTokens.ts
FINANCIAL_CALCULATION_CONTROLLER: 'FinancialCalculationController',

// Em ContainerSetup.ts
container.registerFactory(ServiceTokens.FINANCIAL_CALCULATION_CONTROLLER, () => {
  return new FinancialCalculationController(
    container.resolve(ServiceTokens.CALCULATE_PROJECT_FINANCIALS_USE_CASE)
  );
});
```

---

### 5. Frontend React

**Tipos TypeScript** (`apps/frontend/src/types/financial.ts`):

```typescript
export interface FinancialCalculationInput {
  investimento_inicial: number;
  geracao_mensal: number[];
  consumo_mensal: number[];
  tarifa_energia: number;
  custo_fio_b: number;
  vida_util: number;
  taxa_desconto: number;
  inflacao_energia: number;
  degradacao_modulos: number;
  custo_om: number;
  inflacao_om: number;
  fator_simultaneidade: number;
  // ... demais campos
}

export interface FinancialCalculationResult {
  vpl: number;
  tir: number;
  payback_simples: number;
  payback_descontado: number;
  economia_total_25_anos: number;
  economia_anual_media: number;
  lucratividade_index: number;
  cash_flow: CashFlowDetail[];
  indicadores: FinancialIndicators;
  sensibilidade: SensitivityAnalysis;
  cenarios: ScenarioAnalysis;
}
```

**API Client** (`apps/frontend/src/lib/api.ts`):

```typescript
// Adicionar método
export const calculateProjectFinancials = async (
  projectId: string,
  input: FinancialCalculationInput
): Promise<FinancialCalculationResult> => {
  const response = await api.post(
    `/projects/${projectId}/calculations/financial`,
    input
  );
  return response.data.data;
};
```

**React Hook** (`apps/frontend/src/hooks/useFinancialCalculation.ts`):

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateProjectFinancials } from '@/lib/api';
import { toast } from 'sonner';

export const useCalculateFinancials = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FinancialCalculationInput) =>
      calculateProjectFinancials(projectId, input),
    onSuccess: (data) => {
      toast.success('Cálculo financeiro concluído com sucesso!');
      queryClient.invalidateQueries(['project', projectId]);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
        'Erro ao calcular análise financeira'
      );
    },
  });
};
```

**Componente de Formulário** (`apps/frontend/src/components/Financial/FinancialInputForm.tsx`):

```tsx
import { useState } from 'react';
import { useCalculateFinancials } from '@/hooks/useFinancialCalculation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export const FinancialInputForm = ({ projectId }: { projectId: string }) => {
  const { mutate: calculate, isPending } = useCalculateFinancials(projectId);

  const [formData, setFormData] = useState<FinancialCalculationInput>({
    investimento_inicial: 50000,
    geracao_mensal: Array(12).fill(1500),
    consumo_mensal: Array(12).fill(1000),
    tarifa_energia: 0.84,
    custo_fio_b: 0.25,
    vida_util: 25,
    taxa_desconto: 8.0,
    inflacao_energia: 8.5,
    degradacao_modulos: 0.5,
    custo_om: 1500,
    inflacao_om: 8.0,
    fator_simultaneidade: 0.25,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Parâmetros Básicos</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Investimento Inicial (R$)</label>
            <Input
              type="number"
              value={formData.investimento_inicial}
              onChange={(e) => setFormData({
                ...formData,
                investimento_inicial: parseFloat(e.target.value)
              })}
            />
          </div>

          <div>
            <label>Vida Útil (anos)</label>
            <Input
              type="number"
              value={formData.vida_util}
              onChange={(e) => setFormData({
                ...formData,
                vida_util: parseInt(e.target.value)
              })}
            />
          </div>

          {/* ... mais campos ... */}
        </div>
      </Card>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Calculando...' : 'Calcular Viabilidade'}
      </Button>
    </form>
  );
};
```

**Componente de Resultados** (`apps/frontend/src/components/Financial/FinancialResults.tsx`):

```tsx
import { Card } from '@/components/ui/card';
import { FinancialCalculationResult } from '@/types/financial';
import { formatCurrency } from '@/lib/utils';

export const FinancialResults = ({
  results
}: {
  results: FinancialCalculationResult
}) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <h4 className="text-sm text-gray-500">VPL</h4>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(results.vpl)}
          </p>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm text-gray-500">TIR</h4>
          <p className="text-2xl font-bold">
            {results.tir.toFixed(2)}%
          </p>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm text-gray-500">Payback</h4>
          <p className="text-2xl font-bold">
            {results.payback_simples.toFixed(1)} anos
          </p>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm text-gray-500">Economia 25 anos</h4>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(results.economia_total_25_anos)}
          </p>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
        {/* Adicionar gráfico com Recharts */}
      </Card>

      {/* Detailed Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa Detalhado</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th>Ano</th>
              <th>Geração (kWh)</th>
              <th>Economia (R$)</th>
              <th>Fluxo Acumulado (R$)</th>
            </tr>
          </thead>
          <tbody>
            {results.cash_flow.map((year) => (
              <tr key={year.ano}>
                <td>{year.ano}</td>
                <td>{year.geracao_anual.toFixed(0)}</td>
                <td>{formatCurrency(year.economia_energia)}</td>
                <td>{formatCurrency(year.fluxo_acumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
```

---

## 🔧 Variáveis de Ambiente

**Backend** (`.env`):
```env
# Python Service
PVLIB_SERVICE_URL=http://localhost:8000
```

**Docker Compose** (`docker-compose.yml`):
```yaml
services:
  backend:
    environment:
      - PVLIB_SERVICE_URL=http://pvlib-service:8000
    depends_on:
      - pvlib-service

  pvlib-service:
    build: ./apps/pvlib-service
    ports:
      - "8000:8000"
```

---

## 🧪 Testes

### Teste Manual via curl

```bash
# 1. Testar Python Service diretamente
curl -X POST http://localhost:8000/api/v1/financial/calculate-advanced \
  -H "Content-Type: application/json" \
  -d '{
    "investimento_inicial": 50000,
    "geracao_mensal": [1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500],
    "consumo_mensal": [1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000],
    "tarifa_energia": 0.84,
    "custo_fio_b": 0.25,
    "vida_util": 25,
    "taxa_desconto": 8.0,
    "inflacao_energia": 8.5,
    "degradacao_modulos": 0.5,
    "custo_om": 1500,
    "inflacao_om": 8.0,
    "fator_simultaneidade": 0.25
  }'

# 2. Testar via Node.js Backend
curl -X POST http://localhost:8010/api/v1/projects/{projectId}/calculations/financial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{ ... mesmo payload ... }'
```

---

## 📊 Fluxo Completo

```
┌─────────────┐
│   React     │  1. User fills form
│  Frontend   │  2. Calls POST /api/v1/projects/:id/calculations/financial
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│   Node.js API    │  3. FinancialCalculationController
│     (Port 8010)  │  4. CalculateProjectFinancialsUseCase
└───────┬──────────┘  5. PvlibServiceClient.calculateAdvancedFinancials()
        │
        ↓
┌────────────────────┐
│  Python FastAPI    │  6. POST /api/v1/financial/calculate-advanced
│    (Port 8000)     │  7. FinancialCalculationService.calculate_advanced_financials()
└────────┬───────────┘  8. Returns AdvancedFinancialResults
         │
         ↓
┌──────────────┐
│  MongoDB     │  9. Save results to project.calculations.financial
└──────────────┘

Results flow back: Python → Node.js → React → User sees charts/tables
```

---

## ✅ Checklist de Implementação

- [x] Python FastAPI endpoint
- [x] Node.js PvlibServiceClient
- [x] DI Container registration
- [x] AppConfig update
- [ ] CalculateProjectFinancialsUseCase
- [ ] FinancialCalculationController
- [ ] Routes registration
- [ ] React types
- [ ] React API client methods
- [ ] React hooks (useCalculateFinancials)
- [ ] React components (Form + Results)
- [ ] Integration tests
- [ ] Documentation update

---

## 🚀 Como Continuar

1. **Implementar Use Case**: Criar `CalculateProjectFinancialsUseCase.ts`
2. **Criar Controller**: Implementar `FinancialCalculationController.ts`
3. **Adicionar Rotas**: Registrar em routes e incluir no app
4. **Frontend**: Criar hooks e componentes React
5. **Testar**: Testar fluxo end-to-end
6. **Deploy**: Atualizar docker-compose com variável PVLIB_SERVICE_URL

Todos os arquivos de infraestrutura (client, DI, config) já estão prontos! 🎉