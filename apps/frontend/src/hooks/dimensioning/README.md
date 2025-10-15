# Hooks de Dimensionamento com React Query

Este diretório contém hooks dedicados para operações de dimensionamento usando React Query, substituindo o gerenciamento de estado manual por uma solução server-side consistente.

## Hooks Disponíveis

### 1. `useSaveDimensioning`
Hook para salvar/atualizar dimensionamentos. Suporta tanto criação (POST) quanto atualização (PUT).

```typescript
import { useSaveDimensioning } from '@/hooks/dimensioning';

// Para criar novo dimensionamento
const saveMutation = useSaveDimensioning();

// Para atualizar dimensionamento existente
const updateMutation = useSaveDimensioning('dimensioning-id');

// Usar
saveMutation.mutate(dimensioningData);
```

### 2. `useLoadDimensioning`
Hook para carregar um dimensionamento específico.

```typescript
import { useLoadDimensioning } from '@/hooks/dimensioning';

const { data, isLoading, error } = useLoadDimensioning('dimensioning-id');
```

### 3. `useDimensioningList`
Hook para buscar lista de dimensionamentos com filtros.

```typescript
import { useDimensioningList } from '@/hooks/dimensioning';

const { data, isLoading, error } = useDimensioningList({
  search: 'projeto solar',
  projectType: 'pv',
  page: 1,
  pageSize: 10
});
```

### 4. `useDeleteDimensioning`
Hook para deletar dimensionamentos.

```typescript
import { useDeleteDimensioning } from '@/hooks/dimensioning';

const deleteMutation = useDeleteDimensioning();

// Usar
deleteMutation.mutate('dimensioning-id');
```

### 5. `useDimensioningOperations`
Hook composto que combina todas as operações.

```typescript
import { useDimensioningOperations } from '@/hooks/dimensioning';

const {
  data,
  isLoading,
  isSaving,
  isDeleting,
  save,
  saveAsync,
  deleteItem,
  error,
  refetch
} = useDimensioningOperations('dimensioning-id');
```

## Tipos Principais

### `DimensioningData`
Interface principal para dados do dimensionamento:

```typescript
interface DimensioningData {
  dimensioningName: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    estado?: string;
    cidade?: string;
  };
  energyBills?: Array<{
    id: string;
    name: string;
    consumoMensal: number[];
  }>;
  // ... outros campos
}
```

### `DimensioningListFilters`
Filtros para listagem:

```typescript
interface DimensioningListFilters {
  search?: string;
  projectType?: 'pv' | 'bess';
  page?: number;
  pageSize?: number;
}
```

## Características

### ✅ Cache Automático
- 5 minutos para dados individuais
- 2 minutos para listas
- Background refetch automático

### ✅ Tratamento de Erro
- Validação de dados antes do envio
- Parse de erros da API
- Toast notifications para feedback

### ✅ Estados de Carregamento
- Estados separados para cada operação
- Estados consolidados no hook composto
- Loading states granulares

### ✅ Otimizações
- Query invalidation automática
- Cache cleanup após deleção
- Retry strategies configuradas

## Exemplo de Uso Completo

```typescript
import React from 'react';
import { useDimensioningOperations } from '@/hooks/dimensioning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DimensioningForm({ dimensioningId }: { dimensioningId?: string }) {
  const {
    data,
    isLoading,
    isSaving,
    save,
    deleteItem,
    error
  } = useDimensioningOperations(dimensioningId);

  const handleSubmit = (formData: DimensioningData) => {
    save(formData);
  };

  const handleDelete = () => {
    if (dimensioningId && confirm('Tem certeza?')) {
      deleteItem(dimensioningId);
    }
  };

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit({
        dimensioningName: formData.get('name') as string,
        customer: {
          id: formData.get('customerId') as string,
          name: formData.get('customerName') as string,
          email: formData.get('email') as string,
        },
        // ... outros campos
      });
    }}>
      <Input name="name" defaultValue={data?.dimensioningName} />
      <Input name="customerId" defaultValue={data?.customer.id} />
      <Input name="customerName" defaultValue={data?.customer.name} />
      <Input name="email" defaultValue={data?.customer.email} />
      
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Salvando...' : 'Salvar'}
      </Button>
      
      {dimensioningId && (
        <Button type="button" variant="destructive" onClick={handleDelete}>
          Excluir
        </Button>
      )}
    </form>
  );
}
```

## Migração do useState Manual

### Antes (useState Manual):
```typescript
const [dimensioning, setDimensioning] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

const loadDimensioning = async (id) => {
  setIsLoading(true);
  try {
    const response = await api.get(`/projects/${id}`);
    setDimensioning(response.data);
  } catch (err) {
    setError(err);
  } finally {
    setIsLoading(false);
  }
};
```

### Depois (React Query):
```typescript
const { data: dimensioning, isLoading, error } = useLoadDimensioning(id);
```

## Boas Práticas

1. **Usar o hook composto** para componentes que precisam de múltiplas operações
2. **Aproveitar o cache** para evitar requisições desnecessárias
3. **Tratar estados de carregamento** para melhor UX
4. **Usar validação** antes de enviar dados
5. **Invalidar queries** quando dados mudam em outros lugares

## Integração com Docker

Os hooks funcionam perfeitamente com o ambiente Docker configurado no projeto:

- Backend em `http://localhost:8010/api/v1` (desenvolvimento)
- Backend em `https://api.besspro.vizad.com.br/api/v1` (produção)
- Detecção automática do ambiente via `import.meta.env.PROD`

## Testes

Para testar os hooks:

```bash
# Testes unitários
npm run test:frontend

# Testes com watch
npm run test:watch
```

Os mocks devem ser configurados em `src/__mocks__` para simular respostas da API.