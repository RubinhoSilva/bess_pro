# Problemas de Produção - Integração Financeira

Este documento lista os problemas identificados na integração do sistema de cálculos financeiros que devem ser resolvidos antes da release final.

## 🔴 Crítico

### 1. Infraestrutura de Logging Ausente
**Impacto**: Alto
**Descrição**: Mais de 50 instâncias de `console.log()` espalhadas pelo código. Sem sistema de logging estruturado, dificultando troubleshooting em produção.

**Arquivos afetados**:
- `apps/backend/src/infrastructure/external-apis/PvlibServiceClient.ts`
- `apps/backend/src/application/use-cases/calculation/CalculateProjectFinancialsUseCase.ts`
- `apps/backend/src/presentation/controllers/FinancialCalculationController.ts`
- `apps/frontend/src/components/pv-design/wizard/SolarSizingWizard.tsx`
- `apps/frontend/src/lib/solarSystemService.ts`

**Solução proposta**:
- Implementar `ILogger` interface
- Integrar biblioteca de logging (winston, pino)
- Adicionar níveis de log (debug, info, warn, error)
- Configurar log rotation e storage

### 2. Zero Cobertura de Testes
**Impacto**: Alto
**Descrição**: Nenhum teste automatizado para a integração financeira crítica.

**Cobertura necessária**:
- Unit tests para `PvlibServiceClient`
- Unit tests para `CalculateProjectFinancialsUseCase`
- Integration tests para fluxo completo React → Node → Python
- Testes de transformação snake_case ↔ camelCase
- Testes de validação (tilt 0-90°, azimuth 0-360°)

### 3. Falhas Silenciosas ao Salvar
**Impacto**: Alto
**Descrição**: Se `project.setProjectData()` falhar, não há rollback ou notificação ao usuário.

**Localização**: `CalculateProjectFinancialsUseCase.ts:76-78`

**Solução proposta**:
- Adicionar transaction support
- Implementar rollback em caso de falha
- Retornar erro específico ao usuário

### 4. Configuração Hardcoded
**Impacto**: Médio
**Descrição**: Valores hardcoded espalhados pelo código sem centralização.

**Exemplos**:
- Timeout: 30000ms em `PvlibServiceClient`
- Valores padrão de validação (90°, 360°)
- URLs de API

**Solução proposta**:
- Centralizar em arquivos de configuração
- Usar variáveis de ambiente
- Criar constants file

## 🟡 Médio

### 5. Transformações Manuais de Campos
**Impacto**: Médio
**Descrição**: Transformação manual snake_case ↔ camelCase em múltiplos lugares aumenta risco de bugs.

**Localização**:
- `SolarSizingWizard.tsx` - função `callPythonFinancialAPI()`
- Chart components com fallbacks triplos

**Solução proposta**:
- Criar utility function centralizada para transformação
- Implementar schema validation (zod, yup)
- Gerar tipos TypeScript automaticamente do schema Python

### 6. Ausência de Rate Limiting
**Impacto**: Médio
**Descrição**: Nenhum rate limiting nas chamadas ao serviço Python.

**Risco**: Sobrecarga do serviço Python em caso de múltiplas requisições simultâneas.

**Solução proposta**:
- Implementar rate limiting no backend Node.js
- Adicionar queue system (Bull, BullMQ)
- Implementar retry logic com backoff exponencial

### 7. Error Handling Inconsistente
**Impacto**: Médio
**Descrição**: Tratamento de erros varia entre componentes.

**Problemas**:
- Alguns lugares usam `error: any`, outros `error: unknown`
- Mensagens de erro genéricas
- Stack traces vazando para o cliente

**Solução proposta**:
- Padronizar error handling
- Criar error codes específicos
- Sanitizar mensagens de erro no cliente

### 8. Validação Espalhada em 3 Camadas
**Impacto**: Médio
**Descrição**: Validação de tilt/azimuth em 3 lugares diferentes pode causar inconsistências.

**Localizações**:
1. `WaterSelectionForm.tsx` - UI layer
2. Calculation layer
3. `solarSystemService.ts` - API layer

**Solução proposta**:
- Centralizar validação em uma camada
- Usar schema validation library
- Remover validações redundantes

## 🟢 Baixo

### 9. Falta de Monitoramento
**Impacto**: Baixo (mas importante para produção)
**Descrição**: Sem métricas, alertas ou dashboards.

**Necessário**:
- Tempo de resposta das chamadas ao Python
- Taxa de sucesso/falha
- Alertas para timeouts
- Dashboard de performance

### 10. Documentação de API Ausente
**Impacto**: Baixo
**Descrição**: Endpoints não documentados no Swagger/OpenAPI.

**Solução proposta**:
- Adicionar decorators Swagger
- Gerar documentação automática
- Incluir exemplos de request/response

### 11. Timeout Fixo sem Configuração
**Impacto**: Baixo
**Descrição**: Timeout de 30s hardcoded pode ser insuficiente para cálculos complexos.

**Localização**: `PvlibServiceClient.ts:17`

**Solução proposta**:
- Tornar timeout configurável
- Implementar timeouts diferentes por operação
- Adicionar retry logic

### 12. Dependências Não Verificadas
**Impacto**: Baixo
**Descrição**: Serviço Python pode estar down sem detecção prévia.

**Solução proposta**:
- Implementar health check endpoint
- Verificar disponibilidade antes de chamadas críticas
- Circuit breaker pattern

## 📋 Próximos Passos

### Sprint 1 - Estabilização
1. Implementar sistema de logging estruturado
2. Adicionar cobertura de testes básica (>70%)
3. Implementar error handling consistente
4. Adicionar transaction support para saves

### Sprint 2 - Otimização
1. Centralizar transformações de dados
2. Implementar rate limiting e queue
3. Adicionar health checks
4. Configurar monitoramento básico

### Sprint 3 - Refinamento
1. Gerar documentação OpenAPI
2. Implementar circuit breaker
3. Adicionar alertas de produção
4. Otimizar performance

## 📝 Notas

- **Data**: 2025-09-30
- **Contexto**: Integração React → Node.js → Python para cálculos financeiros fotovoltaicos
- **Status**: Em beta - funcional mas requer melhorias para produção
- **Prioridade**: Resolver críticos antes da release final
