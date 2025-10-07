"""
Modelos de resposta para cálculos de sistemas HÍBRIDOS (Solar + BESS)
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List


class HybridDimensioningResponse(BaseModel):
    """
    Resposta da análise de sistema híbrido Solar + BESS

    Contém três partes principais:
    1. Resultados do sistema solar (geração, performance)
    2. Resultados do sistema BESS (armazenamento, ciclos, economia)
    3. Análise integrada (métricas combinadas, comparação de cenários)
    """

    # ========================================================================
    # PARTE 1: RESULTADOS DO SISTEMA SOLAR
    # ========================================================================
    # Resultado completo do cálculo PVLIB (mesma estrutura do endpoint /solar/calculate)

    sistema_solar: Dict[str, Any] = Field(
        ...,
        description="Resultado completo do cálculo solar PVLIB"
    )
    # Estrutura esperada:
    # {
    #   "potencia_total_kwp": float,  # Potência instalada
    #   "energia_anual_kwh": float,  # Geração anual
    #   "geracao_mensal_kwh": {  # Geração por mês
    #     "Jan": 987.3,
    #     "Fev": 921.4,
    #     ...
    #   },
    #   "yield_especifico": float,  # kWh/kWp
    #   "fator_capacidade": float,  # %
    #   "pr_total": float,  # Performance Ratio %
    #   "inversores": [...],
    #   "anos_analisados": int,
    #   ...
    # }

    # ========================================================================
    # PARTE 2: RESULTADOS DO SISTEMA BESS
    # ========================================================================
    # Resultado da simulação de operação do BESS (8760 horas)

    sistema_bess: Dict[str, Any] = Field(
        ...,
        description="Resultado da simulação BESS"
    )
    # Estrutura esperada:
    # {
    #   # Parâmetros de entrada (eco)
    #   "capacidade_kwh": float,
    #   "potencia_kw": float,
    #   "tipo_bateria": str,
    #   "eficiencia_roundtrip": float,
    #
    #   # Energia processada
    #   "energia_armazenada_anual_kwh": float,  # Total carregado
    #   "energia_descarregada_anual_kwh": float,  # Total descarregado
    #   "energia_perdida_kwh": float,  # Perdas por eficiência
    #   "eficiencia_real": float,  # Eficiência observada
    #
    #   # Estado de carga (SOC)
    #   "soc_medio_percentual": float,  # SOC médio
    #   "soc_minimo_percentual": float,  # SOC mínimo observado
    #   "soc_maximo_percentual": float,  # SOC máximo observado
    #
    #   # Ciclos e degradação
    #   "ciclos_equivalentes_ano": float,  # Ciclos/ano
    #   "profundidade_descarga_media": float,  # DoD médio
    #   "degradacao_estimada_percentual": float,  # Degradação/ano
    #
    #   # Economia
    #   "economia_arbitragem_reais": float,  # Economia por arbitragem
    #   "economia_peak_shaving_reais": float,  # Economia por peak shaving
    #   "economia_total_anual_reais": float,  # Total economizado
    #
    #   # Utilização
    #   "horas_carga": int,  # Horas carregando
    #   "horas_descarga": int,  # Horas descarregando
    #   "horas_idle": int,  # Horas parado
    #   "utilizacao_percentual": float,  # Taxa de utilização
    # }

    # ========================================================================
    # PARTE 3: ANÁLISE INTEGRADA DO SISTEMA HÍBRIDO
    # ========================================================================
    # Métricas que só fazem sentido quando Solar + BESS trabalham juntos

    analise_hibrida: Dict[str, Any] = Field(
        ...,
        description="Métricas do sistema híbrido integrado"
    )
    # Estrutura esperada:
    # {
    #   # ===== FLUXOS DE ENERGIA ANUAL =====
    #   "fluxos_energia": {
    #     "energia_solar_gerada_kwh": float,  # Total gerado pelo PV
    #     "energia_consumida_total_kwh": float,  # Total consumido
    #
    #     # Destinos da energia solar
    #     "energia_solar_para_consumo_kwh": float,  # Solar → Consumo direto
    #     "energia_solar_para_bess_kwh": float,  # Solar → BESS
    #     "energia_solar_para_rede_kwh": float,  # Solar → Rede (injeção)
    #
    #     # Origens da energia consumida
    #     "energia_consumo_de_solar_kwh": float,  # Solar → Consumo
    #     "energia_consumo_de_bess_kwh": float,  # BESS → Consumo
    #     "energia_consumo_de_rede_kwh": float,  # Rede → Consumo
    #   },
    #
    #   # ===== MÉTRICAS DE AUTOSSUFICIÊNCIA =====
    #   "autossuficiencia": {
    #     # Percentual do consumo atendido por Solar + BESS
    #     # Fórmula: (Solar direto + BESS) / Consumo total
    #     "autossuficiencia_percentual": float,
    #
    #     # Percentual da geração solar realmente usada (não vendida)
    #     # Fórmula: (Solar direto + Solar→BESS) / Solar gerado
    #     "taxa_autoconsumo_solar": float,
    #
    #     # Energia que veio da rede
    #     "dependencia_rede_percentual": float,
    #   },
    #
    #   # ===== CUSTOS E ECONOMIA =====
    #   "analise_economica": {
    #     # Cenário SEM sistema (baseline)
    #     "custo_energia_sem_sistema_reais": float,
    #
    #     # Cenário COM híbrido
    #     "custo_energia_com_hibrido_reais": float,
    #
    #     # Economia total anual
    #     "economia_anual_total_reais": float,
    #
    #     # Detalhamento da economia
    #     "economia_solar_reais": float,  # Geração própria
    #     "economia_bess_reais": float,  # Arbitragem + peak shaving
    #     "receita_injecao_reais": float,  # Venda de excedente (se houver)
    #   },
    #
    #   # ===== INVESTIMENTO =====
    #   "investimento": {
    #     "investimento_solar_reais": float,  # Custo do sistema PV
    #     "investimento_bess_reais": float,  # Custo do BESS
    #     "investimento_total_reais": float,  # Solar + BESS
    #
    #     # Detalhamento BESS
    #     "custo_bateria_reais": float,  # Capacidade × custo/kWh
    #     "custo_inversor_bess_reais": float,  # Potência × custo/kW
    #     "custo_instalacao_bess_reais": float,  # Fixo
    #   },
    #
    #   # ===== RETORNO FINANCEIRO =====
    #   "retorno_financeiro": {
    #     # Payback simples (sem considerar valor do dinheiro no tempo)
    #     # Fórmula: Investimento total / Economia anual
    #     "payback_simples_anos": float,
    #
    #     # Payback descontado (considerando taxa de desconto)
    #     "payback_descontado_anos": float,
    #
    #     # Valor Presente Líquido (VPL)
    #     # Fórmula: Σ [Economia_ano / (1 + taxa)^ano] - Investimento
    #     "npv_reais": float,
    #
    #     # Taxa Interna de Retorno (TIR)
    #     "tir_percentual": float,
    #
    #     # Custo Nivelado de Energia (LCOE) do sistema híbrido
    #     # Fórmula: VPL custos / VPL energia gerada
    #     "lcoe_hibrido_reais_kwh": float,
    #   },
    #
    #   # ===== COMPARAÇÃO DE CENÁRIOS =====
    #   # Compara 4 cenários: sem sistema, só solar, só BESS, híbrido
    #   "comparacao_cenarios": {
    #     "sem_sistema": {
    #       "investimento": 0,
    #       "economia_anual": 0,
    #       "custo_25_anos": float,  # Custo total em 25 anos
    #       "npv": 0,
    #     },
    #
    #     "somente_solar": {
    #       "investimento": float,
    #       "economia_anual": float,
    #       "payback_anos": float,
    #       "npv": float,
    #       "autossuficiencia": float,
    #     },
    #
    #     "somente_bess": {
    #       "investimento": float,
    #       "economia_anual": float,
    #       "payback_anos": float,
    #       "npv": float,
    #       "economia_arbitragem": float,
    #     },
    #
    #     "hibrido": {
    #       "investimento": float,
    #       "economia_anual": float,
    #       "payback_anos": float,
    #       "npv": float,
    #       "autossuficiencia": float,
    #
    #       # Quanto o híbrido é melhor que cada cenário individual
    #       "vantagem_vs_solar_npv": float,  # NPV híbrido - NPV solar
    #       "vantagem_vs_bess_npv": float,  # NPV híbrido - NPV BESS
    #       "vantagem_vs_solar_percentual": float,  # (NPV híbrido / NPV solar - 1) × 100
    #       "vantagem_vs_bess_percentual": float,
    #     }
    #   },
    #
    #   # ===== RECOMENDAÇÕES =====
    #   "recomendacoes": [
    #     "Sistema híbrido oferece melhor retorno que sistemas isolados",
    #     "Autossuficiência de 85% reduz dependência da rede",
    #     "Considerar expansão de 20% na capacidade do BESS"
    #   ],
    #
    #   "alertas": [
    #     "Taxa de desconto alta (12%) pode afetar viabilidade",
    #     "Degradação da bateria estimada em 2.5% ao ano"
    #   ]
    # }

    # ========================================================================
    # PARTE 4: SÉRIES TEMPORAIS (OPCIONAL)
    # ========================================================================
    # Dados horários de operação do sistema (8760 pontos)
    # Útil para gráficos detalhados no frontend

    series_temporais: Optional[Dict[str, List[float]]] = Field(
        None,
        description="Séries horárias de operação (8760 pontos) - opcional"
    )
    # Estrutura esperada (se fornecida):
    # {
    #   "geracao_solar_w": [val1, val2, ..., val8760],  # Geração PV (W)
    #   "consumo_w": [val1, val2, ..., val8760],  # Consumo (W)
    #   "soc_percentual": [val1, val2, ..., val8760],  # SOC do BESS (0-100)
    #   "potencia_bess_w": [val1, val2, ..., val8760],  # + carga, - descarga
    #   "potencia_rede_w": [val1, val2, ..., val8760],  # + compra, - venda
    #   "tarifa_kwh": [val1, val2, ..., val8760],  # Tarifa vigente (R$/kWh)
    # }

    class Config:
        json_schema_extra = {
            "example": {
                "sistema_solar": {
                    "potencia_total_kwp": 6.48,
                    "energia_anual_kwh": 9847.5,
                    "geracao_mensal_kwh": {
                        "Jan": 987.3,
                        "Fev": 921.4,
                        "Mar": 895.2,
                        "Abr": 765.8,
                        "Mai": 698.5,
                        "Jun": 654.2,
                        "Jul": 701.3,
                        "Ago": 789.4,
                        "Set": 823.6,
                        "Out": 891.7,
                        "Nov": 912.4,
                        "Dez": 1006.7
                    },
                    "yield_especifico": 1519.4,
                    "pr_total": 81.3
                },
                "sistema_bess": {
                    "capacidade_kwh": 100.0,
                    "potencia_kw": 50.0,
                    "energia_armazenada_anual_kwh": 25000.0,
                    "energia_descarregada_anual_kwh": 22500.0,
                    "ciclos_equivalentes_ano": 250,
                    "economia_total_anual_reais": 15000.0
                },
                "analise_hibrida": {
                    "fluxos_energia": {
                        "energia_solar_gerada_kwh": 9847.5,
                        "energia_consumida_total_kwh": 6000.0,
                        "energia_solar_para_consumo_kwh": 4500.0,
                        "energia_solar_para_bess_kwh": 3500.0,
                        "energia_consumo_de_bess_kwh": 1500.0
                    },
                    "autossuficiencia": {
                        "autossuficiencia_percentual": 85.5,
                        "taxa_autoconsumo_solar": 78.2
                    },
                    "analise_economica": {
                        "custo_energia_sem_sistema_reais": 72000.0,
                        "custo_energia_com_hibrido_reais": 12000.0,
                        "economia_anual_total_reais": 60000.0
                    },
                    "investimento": {
                        "investimento_solar_reais": 35000.0,
                        "investimento_bess_reais": 355000.0,
                        "investimento_total_reais": 390000.0
                    },
                    "retorno_financeiro": {
                        "payback_simples_anos": 6.5,
                        "npv_reais": 280000.0,
                        "tir_percentual": 15.3
                    },
                    "comparacao_cenarios": {
                        "somente_solar": {
                            "npv": 180000.0,
                            "payback_anos": 7.8
                        },
                        "hibrido": {
                            "npv": 280000.0,
                            "payback_anos": 6.5,
                            "vantagem_vs_solar_npv": 100000.0,
                            "vantagem_vs_solar_percentual": 55.6
                        }
                    }
                }
            }
        }
