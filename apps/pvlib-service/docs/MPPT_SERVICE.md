# Serviço de Cálculo de Módulos por MPPT

## Visão Geral

Este serviço calcula quantos módulos fotovoltaicos podem ser conectados em cada canal MPPT de um inversor, considerando limitações técnicas de tensão, corrente e potência.

## Endpoint

### POST `/api/v1/mppt/calculate-modules-per-mppt`

Calcula a quantidade ótima de módulos por MPPT baseado nos parâmetros do inversor.

#### Request

```json
{
  "fabricante": "WEG",
  "modelo": "SIW500H-M",
  "potencia_saida_ca_w": 5000,
  "tensao_cc_max_v": 600,
  "numero_mppt": 2,
  "strings_por_mppt": 2,
  "corrente_entrada_max_a": 16,
  "faixa_mppt_min_v": 200,
  "faixa_mppt_max_v": 580,
  "tipo_rede": "Monofásico 220V"
}
```

#### Response

```json
{
  "modulos_por_mppt": 5,
  "modulos_total_sistema": 10,
  "limitacao_principal": "Configuração padrão - cálculo detalhado será implementado",
  "analise_detalhada": {
    "limite_tensao": "A ser calculado",
    "limite_corrente": "A ser calculado", 
    "limite_potencia": "A ser calculado",
    "limite_strings": "A ser calculado",
    "configuracao_otima": "5 módulos por MPPT é configuração padrão"
  },
  "configuracao_recomendada": {
    "strings_por_mppt": 2,
    "modulos_por_string": 2,
    "total_mppt_utilizados": 2,
    "total_strings_sistema": 4,
    "distribuicao": "2 strings × 2 módulos por MPPT"
  },
  "parametros_entrada": {
    "fabricante": "WEG",
    "modelo": "SIW500H-M",
    "potencia_saida_ca_w": 5000.0,
    "numero_mppt": 2,
    "strings_por_mppt": 2,
    "tensao_cc_max_v": 600.0
  }
}
```

## Estado Atual

### ✅ Implementado
- Estrutura básica do serviço
- Modelos de request/response
- Endpoint funcional
- Validações básicas
- Valor padrão: **5 módulos por MPPT**

### 🔄 Próximas implementações
- Regras de negócio específicas
- Cálculos baseados em limitações técnicas:
  - Tensão MPPT (Vmpp × módulos ≤ Vmpp_max)
  - Corrente máxima (Impp × strings ≤ Imax)
  - Potência máxima do inversor
  - Compatibilidade módulo/inversor

## Como usar

1. **Teste básico:**
```bash
curl -X POST "http://localhost:8110/api/v1/mppt/calculate-modules-per-mppt" \
-H "Content-Type: application/json" \
-d '{
  "fabricante": "WEG",
  "modelo": "SIW500H-M", 
  "potencia_saida_ca_w": 5000,
  "numero_mppt": 2
}'
```

2. **Health check:**
```bash
curl -X GET "http://localhost:8110/api/v1/mppt/health"
```

## Estrutura de arquivos

```
apps/pvlib-service/
├── models/mppt_models.py              # Modelos Pydantic
├── services/mppt_service.py           # Lógica de negócio
├── api/v1/endpoints/mppt.py          # Endpoint FastAPI  
└── docs/MPPT_SERVICE.md              # Esta documentação
```

## Próximos passos

Quando você tiver as regras de negócio, substitua a linha:
```python
modulos_por_mppt = 5  # Valor padrão
```

Por cálculos reais baseados nas especificações técnicas dos módulos e inversores.