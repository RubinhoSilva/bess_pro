# Armazenamento de Propostas em S3

Este documento descreve como configurar e usar o armazenamento de propostas PDF no AWS S3.

## Visão Geral

O sistema de geração de propostas agora suporta dois modos de armazenamento:

1. **Desenvolvimento**: Armazenamento local em disco (padrão)
2. **Produção**: Armazenamento em AWS S3 com URLs pré-assinadas

## Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no arquivo `.env`:

```bash
# Ativar uso do S3 (False para desenvolvimento, True para produção)
USE_S3_STORAGE=True

# Credenciais AWS
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_REGION=us-east-1

# Configurações do bucket
S3_BUCKET_NAME=nome-do-bucket-propostas
S3_PROPOSALS_PREFIX=proposals/

# Validade da URL pré-assinada (em segundos)
S3_PRESIGNED_URL_EXPIRATION=3600  # 1 hora
```

### 2. Dependências

As dependências necessárias já estão incluídas em `requirements.txt`:
- `boto3==1.34.0`
- `botocore==1.34.0`

### 3. Permissões AWS

O usuário/role AWS precisa ter as seguintes permissões no bucket S3:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::nome-do-bucket-propostas/proposals/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::nome-do-bucket-propostas"
        }
    ]
}
```

## Funcionamento

### Geração de Propostas

1. O PDF é gerado temporariamente no disco
2. Se `USE_S3_STORAGE=True`, o arquivo é enviado para o S3
3. Uma URL pré-assinada é gerada e retornada
4. O arquivo temporário é removido

### Download de Propostas

1. O endpoint `/download/{filename}` verifica primeiro no S3
2. Se encontrado, gera uma nova URL pré-assinada e redireciona
3. Se não encontrado no S3, busca no armazenamento local (fallback)

## URLs

- **Desenvolvimento**: `http://localhost:8000/api/v1/proposal/download/proposta_abc123_20231027.pdf`
- **Produção**: `https://s3.amazonaws.com/bucket/proposals/proposta_abc123_20231027.pdf?X-Amz-Signature=...`

## Segurança

- URLs pré-assinadas têm validade limitada (padrão: 1 hora)
- As credenciais AWS nunca são expostas ao cliente
- Acesso direto ao bucket S3 é controlado por políticas IAM

## Monitoramento

Os logs incluem informações sobre:
- Uploads para S3
- Geração de URLs pré-assinadas
- Falhas e fallbacks para armazenamento local

## Troubleshooting

### Problemas Comuns

1. **Credenciais inválidas**: Verifique `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`
2. **Bucket não encontrado**: Verifique `S3_BUCKET_NAME` e permissões
3. **Região incorreta**: Verifique `AWS_REGION`
4. **Permissões insuficientes**: Verifique políticas IAM

### Logs de Debug

Ative logs detalhados configurando:
```bash
LOG_LEVEL=DEBUG
```

## Migração

Para migrar propostas existentes do disco para o S3:

```python
from services.storage import s3_service
import os

# Script de migração (executar uma vez)
proposals_dir = "./storage/proposals"
for filename in os.listdir(proposals_dir):
    if filename.endswith('.pdf'):
        filepath = os.path.join(proposals_dir, filename)
        s3_service.upload_file(filepath, filename)