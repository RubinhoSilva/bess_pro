# Validação de Produção - PVGIS Configuration Fix

## Problema Identificado
```
TypeError: Cannot read properties of undefined (reading 'baseUrl')
```

## Causa
A variável de ambiente `PVGIS_BASE_URL` não estava definida no arquivo `.env.production`

## Soluções Implementadas

### 1. Proteção no Código (ContainerSetup.ts)
- Adicionado fallback para URL padrão do PVGIS
- Adicionado log de debug para validar configuração
- Configuração agora sempre funciona mesmo sem variável de ambiente

### 2. Arquivo de Exemplo Atualizado
- Corrigido `.env.production.example` com a variável `PVGIS_BASE_URL`
- Valor padrão: `https://re.jrc.ec.europa.eu/api/v5_2`

## Como Validar em Produção

### Opção 1: Adicionar Variável de Ambiente
1. No arquivo `.env.production` do servidor, adicione:
   ```
   PVGIS_BASE_URL=https://re.jrc.ec.europa.eu/api/v5_2
   ```

2. Reinicie o container:
   ```bash
   docker-compose -f docker-compose.prod.yml restart backend
   ```

### Opção 2: Apenas Redeploy (Recomendado)
Como agora o código tem fallback, basta fazer redeploy:

1. Build e push da nova versão:
   ```bash
   # Fazer build
   npm run build:backend
   
   # Rebuild dos containers 
   docker-compose -f docker-compose.prod.yml build backend
   docker-compose -f docker-compose.prod.yml up -d backend
   ```

### Verificar se Funciona
1. Após restart, verifique os logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend | grep "PvgisApiService"
   ```
   
   Deve aparecer: `🔧 PvgisApiService config: { baseUrl: 'https://re.jrc.ec.europa.eu/api/v5_2' }`

2. Teste a funcionalidade PVGIS no frontend:
   - Acesse o dimensionamento PV
   - Selecione "PVGIS - Dados Precisos" 
   - Teste importação de dados de irradiação

## Arquivos Alterados
- `apps/backend/src/infrastructure/di/ContainerSetup.ts` - Adicionado fallback e log
- `.env.production.example` - Corrigida variável de ambiente

## Status
✅ **Correção aplicada e testada localmente**
⏳ **Aguardando validação em produção**