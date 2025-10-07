"""
Modelos de resposta para cálculos de BESS (Battery Energy Storage System)
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class BessDimensioningResponse(BaseModel):
    """Resposta do dimensionamento de BESS"""

    # Capacidade e potência recomendadas
    capacidade_recomendada_kwh: float = Field(
        ...,
        ge=0,
        description="Capacidade recomendada da bateria em kWh"
    )

    potencia_recomendada_kw: float = Field(
        ...,
        ge=0,
        description="Potência recomendada do inversor em kW"
    )

    # Configuração do sistema
    numero_modulos_bateria: int = Field(
        ...,
        ge=1,
        description="Número de módulos de bateria necessários"
    )

    configuracao_sistema: Dict[str, Any] = Field(
        ...,
        description="Detalhes da configuração do sistema (série/paralelo, tensão, etc.)"
    )

    # Análise econômica
    custo_total_sistema: float = Field(
        ...,
        ge=0,
        description="Custo total do sistema em R$ (bateria + inversor + instalação)"
    )

    economia_anual_reais: float = Field(
        ...,
        ge=0,
        description="Economia anual estimada em R$"
    )

    payback_simples_anos: float = Field(
        ...,
        ge=0,
        description="Payback simples em anos"
    )

    payback_descontado_anos: Optional[float] = Field(
        None,
        ge=0,
        description="Payback descontado (considerando valor do dinheiro no tempo)"
    )

    npv: float = Field(
        ...,
        description="Valor Presente Líquido (NPV) em R$"
    )

    irr: Optional[float] = Field(
        None,
        ge=-1,
        le=5,
        description="Taxa Interna de Retorno (IRR) em decimal"
    )

    lcoe: float = Field(
        ...,
        ge=0,
        description="Custo Nivelado de Energia (LCOE) em R$/kWh"
    )

    # Análise operacional
    ciclos_equivalentes_ano: float = Field(
        ...,
        ge=0,
        description="Ciclos equivalentes anuais estimados"
    )

    energia_armazenada_anual_kwh: float = Field(
        ...,
        ge=0,
        description="Energia armazenada anual estimada em kWh"
    )

    energia_descarregada_anual_kwh: float = Field(
        ...,
        ge=0,
        description="Energia descarregada anual estimada em kWh"
    )

    # Análise de degradação
    capacidade_fim_vida_util_kwh: float = Field(
        ...,
        ge=0,
        description="Capacidade estimada ao fim da vida útil em kWh"
    )

    degradacao_total_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Degradação total estimada em %"
    )

    # Detalhes e recomendações
    analise_detalhada: Dict[str, Any] = Field(
        ...,
        description="Análise detalhada com gráficos, tabelas e métricas adicionais"
    )

    recomendacoes: List[str] = Field(
        default_factory=list,
        description="Recomendações técnicas e operacionais"
    )

    alertas: List[str] = Field(
        default_factory=list,
        description="Alertas sobre limitações ou considerações importantes"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "capacidade_recomendada_kwh": 100.0,
                "potencia_recomendada_kw": 50.0,
                "numero_modulos_bateria": 20,
                "configuracao_sistema": {
                    "tensao_nominal_v": 200,
                    "configuracao": "10S2P",
                    "capacidade_modulo_kwh": 5.0
                },
                "custo_total_sistema": 350000.0,
                "economia_anual_reais": 45000.0,
                "payback_simples_anos": 7.8,
                "payback_descontado_anos": 9.2,
                "npv": 125000.0,
                "irr": 0.13,
                "lcoe": 0.65,
                "ciclos_equivalentes_ano": 250,
                "energia_armazenada_anual_kwh": 25000,
                "energia_descarregada_anual_kwh": 23750,
                "capacidade_fim_vida_util_kwh": 80.0,
                "degradacao_total_percentual": 20.0,
                "analise_detalhada": {
                    "fluxo_caixa": [...],
                    "curva_degradacao": [...]
                },
                "recomendacoes": [
                    "Sistema dimensionado para arbitragem de energia",
                    "Considerar expansão futura para 150kWh"
                ],
                "alertas": []
            }
        }


class BessSimulationResponse(BaseModel):
    """Resposta da simulação horária de BESS (8760 horas)"""

    # Resumo operacional
    energia_armazenada_anual_kwh: float = Field(
        ...,
        ge=0,
        description="Total de energia armazenada no ano em kWh"
    )

    energia_descarregada_anual_kwh: float = Field(
        ...,
        ge=0,
        description="Total de energia descarregada no ano em kWh"
    )

    energia_perdida_kwh: float = Field(
        ...,
        ge=0,
        description="Perdas totais por eficiência em kWh"
    )

    eficiencia_roundtrip_real: float = Field(
        ...,
        ge=0,
        le=1,
        description="Eficiência round-trip real observada na simulação"
    )

    # Análise econômica
    economia_arbitragem_reais: float = Field(
        default=0.0,
        ge=0,
        description="Economia com arbitragem de energia em R$"
    )

    economia_peak_shaving_reais: float = Field(
        default=0.0,
        ge=0,
        description="Economia com redução de demanda (peak shaving) em R$"
    )

    economia_total_anual_reais: float = Field(
        ...,
        ge=0,
        description="Economia total anual em R$"
    )

    custo_energia_sem_bess_reais: float = Field(
        ...,
        ge=0,
        description="Custo de energia sem BESS (baseline) em R$"
    )

    custo_energia_com_bess_reais: float = Field(
        ...,
        ge=0,
        description="Custo de energia com BESS em R$"
    )

    # Estado de carga (SOC)
    soc_medio_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Estado de carga médio em %"
    )

    soc_minimo_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Estado de carga mínimo observado em %"
    )

    soc_maximo_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Estado de carga máximo observado em %"
    )

    # Ciclos e degradação
    ciclos_equivalentes: float = Field(
        ...,
        ge=0,
        description="Número de ciclos equivalentes no período"
    )

    profundidade_descarga_media: float = Field(
        ...,
        ge=0,
        le=1,
        description="Profundidade média de descarga (DoD média)"
    )

    degradacao_estimada_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Degradação estimada no período em %"
    )

    # Demanda
    demanda_maxima_kw: float = Field(
        ...,
        ge=0,
        description="Demanda máxima observada em kW"
    )

    demanda_maxima_sem_bess_kw: float = Field(
        ...,
        ge=0,
        description="Demanda máxima que teria sem BESS em kW"
    )

    reducao_demanda_kw: float = Field(
        default=0.0,
        ge=0,
        description="Redução de demanda alcançada em kW"
    )

    # Séries temporais (8760 valores)
    serie_soc: Optional[List[float]] = Field(
        None,
        min_length=8760,
        max_length=8760,
        description="Série temporal do estado de carga (0-1) para cada hora"
    )

    serie_potencia_carga: Optional[List[float]] = Field(
        None,
        min_length=8760,
        max_length=8760,
        description="Série temporal da potência de carga em kW (valores positivos)"
    )

    serie_potencia_descarga: Optional[List[float]] = Field(
        None,
        min_length=8760,
        max_length=8760,
        description="Série temporal da potência de descarga em kW (valores positivos)"
    )

    serie_demanda_rede: Optional[List[float]] = Field(
        None,
        min_length=8760,
        max_length=8760,
        description="Série temporal da demanda líquida da rede em kW"
    )

    serie_custo_energia: Optional[List[float]] = Field(
        None,
        min_length=8760,
        max_length=8760,
        description="Série temporal do custo de energia por hora em R$"
    )

    # Estatísticas adicionais
    horas_carga: int = Field(
        ...,
        ge=0,
        le=8760,
        description="Número de horas em modo de carga"
    )

    horas_descarga: int = Field(
        ...,
        ge=0,
        le=8760,
        description="Número de horas em modo de descarga"
    )

    horas_idle: int = Field(
        ...,
        ge=0,
        le=8760,
        description="Número de horas em modo idle"
    )

    utilizacao_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Taxa de utilização do sistema em %"
    )

    # Análise mensal
    resumo_mensal: List[Dict[str, Any]] = Field(
        ...,
        min_length=12,
        max_length=12,
        description="Resumo operacional e econômico por mês"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "energia_armazenada_anual_kwh": 25000.0,
                "energia_descarregada_anual_kwh": 23750.0,
                "energia_perdida_kwh": 1250.0,
                "eficiencia_roundtrip_real": 0.95,
                "economia_arbitragem_reais": 35000.0,
                "economia_peak_shaving_reais": 10000.0,
                "economia_total_anual_reais": 45000.0,
                "custo_energia_sem_bess_reais": 180000.0,
                "custo_energia_com_bess_reais": 135000.0,
                "soc_medio_percentual": 55.0,
                "soc_minimo_percentual": 10.0,
                "soc_maximo_percentual": 100.0,
                "ciclos_equivalentes": 250.0,
                "profundidade_descarga_media": 0.8,
                "degradacao_estimada_percentual": 2.5,
                "demanda_maxima_kw": 45.0,
                "demanda_maxima_sem_bess_kw": 65.0,
                "reducao_demanda_kw": 20.0,
                "horas_carga": 2500,
                "horas_descarga": 2200,
                "horas_idle": 4060,
                "utilizacao_percentual": 53.7,
                "resumo_mensal": [
                    {
                        "mes": 1,
                        "energia_armazenada": 2100,
                        "energia_descarregada": 1995,
                        "economia": 3750
                    }
                ]
            }
        }


class BessDegradationResponse(BaseModel):
    """Resposta da análise de degradação de BESS"""

    # Capacidade ao longo do tempo
    capacidade_inicial_kwh: float = Field(
        ...,
        ge=0,
        description="Capacidade inicial da bateria em kWh"
    )

    capacidade_final_kwh: float = Field(
        ...,
        ge=0,
        description="Capacidade final estimada em kWh"
    )

    capacidade_por_ano: List[float] = Field(
        ...,
        description="Capacidade remanescente por ano em kWh"
    )

    # Degradação total e componentes
    degradacao_total_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Degradação total em % da capacidade inicial"
    )

    degradacao_calendario_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Degradação por envelhecimento calendário em %"
    )

    degradacao_ciclica_percentual: float = Field(
        ...,
        ge=0,
        le=100,
        description="Degradação por ciclagem em %"
    )

    # Vida útil
    vida_util_anos: float = Field(
        ...,
        ge=0,
        description="Vida útil estimada até atingir 80% da capacidade (anos)"
    )

    vida_util_ciclos: float = Field(
        ...,
        ge=0,
        description="Vida útil estimada em número de ciclos equivalentes"
    )

    anos_para_eol: float = Field(
        ...,
        ge=0,
        description="Anos até atingir End of Life (EOL) - tipicamente 80% da capacidade"
    )

    # Fatores de degradação
    taxa_degradacao_calendario_anual: float = Field(
        ...,
        ge=0,
        le=10,
        description="Taxa de degradação calendário anual em %/ano"
    )

    taxa_degradacao_ciclica_por_ciclo: float = Field(
        ...,
        ge=0,
        le=1,
        description="Taxa de degradação por ciclo em %/ciclo"
    )

    fator_temperatura: float = Field(
        ...,
        ge=0.5,
        le=2.0,
        description="Fator de aceleração da degradação pela temperatura (1.0 = nominal)"
    )

    fator_profundidade_descarga: float = Field(
        ...,
        ge=0.5,
        le=2.0,
        description="Fator de aceleração pela profundidade de descarga (1.0 = nominal)"
    )

    # Análise econômica
    custo_reposicao_kwh: Optional[float] = Field(
        None,
        ge=0,
        description="Custo de reposição de capacidade em R$/kWh"
    )

    custo_reposicao_total: Optional[float] = Field(
        None,
        ge=0,
        description="Custo total de reposição ao fim da vida útil em R$"
    )

    # Projeções e recomendações
    projecao_capacidade: List[Dict[str, float]] = Field(
        ...,
        description="Projeção detalhada de capacidade por ano com intervalos de confiança"
    )

    recomendacoes: List[str] = Field(
        default_factory=list,
        description="Recomendações para maximizar vida útil"
    )

    alertas: List[str] = Field(
        default_factory=list,
        description="Alertas sobre condições que aceleram degradação"
    )

    # Métricas adicionais
    ciclos_totais_equivalentes: float = Field(
        ...,
        ge=0,
        description="Total de ciclos equivalentes no período analisado"
    )

    energia_total_processada_mwh: float = Field(
        ...,
        ge=0,
        description="Total de energia processada (throughput) em MWh"
    )

    custo_energia_degradacao: Optional[float] = Field(
        None,
        ge=0,
        description="Custo equivalente da degradação em R$/kWh (amortização)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "capacidade_inicial_kwh": 100.0,
                "capacidade_final_kwh": 80.0,
                "capacidade_por_ano": [100, 98, 96, 94, 92, 90, 88, 86, 84, 82, 80],
                "degradacao_total_percentual": 20.0,
                "degradacao_calendario_percentual": 8.0,
                "degradacao_ciclica_percentual": 12.0,
                "vida_util_anos": 10.0,
                "vida_util_ciclos": 2500,
                "anos_para_eol": 10.0,
                "taxa_degradacao_calendario_anual": 0.8,
                "taxa_degradacao_ciclica_por_ciclo": 0.048,
                "fator_temperatura": 1.1,
                "fator_profundidade_descarga": 1.2,
                "custo_reposicao_kwh": 2500.0,
                "custo_reposicao_total": 250000.0,
                "projecao_capacidade": [
                    {"ano": 1, "capacidade": 98.0, "min": 97.0, "max": 99.0},
                    {"ano": 2, "capacidade": 96.0, "min": 94.5, "max": 97.5}
                ],
                "recomendacoes": [
                    "Manter temperatura de operação abaixo de 30°C",
                    "Evitar descargas profundas quando possível"
                ],
                "alertas": [
                    "Temperatura média está 5°C acima do ideal"
                ],
                "ciclos_totais_equivalentes": 2500,
                "energia_total_processada_mwh": 200.0,
                "custo_energia_degradacao": 0.125
            }
        }
