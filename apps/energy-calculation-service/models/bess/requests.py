"""
Modelos de requisição para cálculos de BESS (Battery Energy Storage System)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from datetime import time


class TarifaEnergia(BaseModel):
    """Estrutura de tarifa de energia"""

    tipo: Literal["branca", "convencional", "verde", "azul"] = Field(
        ...,
        description="Tipo de tarifa (branca, convencional, verde, azul)"
    )

    # Tarifa Branca / Convencional
    tarifa_ponta_kwh: Optional[float] = Field(
        None,
        ge=0,
        description="Tarifa ponta em R$/kWh"
    )
    tarifa_fora_ponta_kwh: Optional[float] = Field(
        None,
        ge=0,
        description="Tarifa fora ponta em R$/kWh"
    )
    tarifa_intermediaria_kwh: Optional[float] = Field(
        None,
        ge=0,
        description="Tarifa intermediária em R$/kWh (tarifa branca)"
    )

    # Tarifa de demanda
    tarifa_demanda_ponta: Optional[float] = Field(
        None,
        ge=0,
        description="Tarifa de demanda ponta em R$/kW"
    )
    tarifa_demanda_fora_ponta: Optional[float] = Field(
        None,
        ge=0,
        description="Tarifa de demanda fora ponta em R$/kW"
    )

    # Horários (tarifa branca)
    horario_ponta_inicio: Optional[time] = Field(
        None,
        description="Horário de início da ponta (ex: 18:00)"
    )
    horario_ponta_fim: Optional[time] = Field(
        None,
        description="Horário de fim da ponta (ex: 21:00)"
    )
    horario_intermediario_manha_inicio: Optional[time] = Field(
        None,
        description="Horário início intermediário manhã"
    )
    horario_intermediario_manha_fim: Optional[time] = Field(
        None,
        description="Horário fim intermediário manhã"
    )
    horario_intermediario_noite_inicio: Optional[time] = Field(
        None,
        description="Horário início intermediário noite"
    )
    horario_intermediario_noite_fim: Optional[time] = Field(
        None,
        description="Horário fim intermediário noite"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "tipo": "branca",
                "tarifa_ponta_kwh": 1.20,
                "tarifa_intermediaria_kwh": 0.80,
                "tarifa_fora_ponta_kwh": 0.50,
                "horario_ponta_inicio": "18:00:00",
                "horario_ponta_fim": "21:00:00"
            }
        }


class PerfilConsumo(BaseModel):
    """Perfil de consumo (opcional - se não fornecido, usa padrão)"""

    tipo: Literal["residencial", "comercial", "industrial", "custom"] = Field(
        default="comercial",
        description="Tipo de perfil de consumo"
    )

    curva_horaria: Optional[List[float]] = Field(
        None,
        min_length=24,
        max_length=24,
        description="Curva de consumo horária típica (24 valores em % do consumo diário)"
    )

    @validator('curva_horaria')
    def validate_curva(cls, v):
        if v is not None:
            soma = sum(v)
            if not (99 <= soma <= 101):  # Tolerância de 1%
                raise ValueError('Soma da curva horária deve ser aproximadamente 100%')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "tipo": "comercial",
                "curva_horaria": [2.0, 1.5, 1.0, 1.0, 1.5, 2.5, 4.0, 5.5, 6.0, 5.5, 5.0, 5.0,
                                  5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 2.5]
            }
        }


class BessDimensioningRequest(BaseModel):
    """Requisição para dimensionamento de BESS"""

    # Dados de consumo
    consumo_mensal_kwh: List[float] = Field(
        ...,
        min_length=12,
        max_length=12,
        description="Consumo mensal de energia em kWh (Jan a Dez)"
    )

    demanda_contratada_kw: Optional[float] = Field(
        None,
        ge=0,
        description="Demanda contratada em kW (opcional, para grupo A)"
    )

    demanda_pico_kw: Optional[float] = Field(
        None,
        ge=0,
        description="Demanda de pico medida em kW (opcional)"
    )

    # Localização
    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Latitude para análise de temperatura"
    )
    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Longitude para análise de temperatura"
    )

    # Tarifa
    tarifa: TarifaEnergia = Field(
        ...,
        description="Estrutura tarifária"
    )

    # Perfil de consumo
    perfil_consumo: Optional[PerfilConsumo] = Field(
        None,
        description="Perfil de consumo (opcional, usa padrão se não fornecido)"
    )

    # Objetivos
    objetivo_principal: Literal["arbitragem", "peak_shaving", "backup", "hibrido"] = Field(
        default="hibrido",
        description="Objetivo principal do BESS"
    )

    # Parâmetros de bateria
    tipo_bateria: Literal["litio", "chumbo_acido", "flow"] = Field(
        default="litio",
        description="Tipo de tecnologia de bateria"
    )

    profundidade_descarga_max: float = Field(
        default=0.9,
        ge=0.5,
        le=1.0,
        description="Profundidade máxima de descarga (DoD)"
    )

    eficiencia_bateria: float = Field(
        default=0.95,
        ge=0.80,
        le=0.99,
        description="Eficiência round-trip da bateria"
    )

    # Parâmetros econômicos
    custo_kwh_bateria: float = Field(
        default=3000.0,
        ge=1000,
        le=10000,
        description="Custo por kWh de capacidade instalada (R$/kWh)"
    )

    custo_kw_inversor: float = Field(
        default=1500.0,
        ge=500,
        le=5000,
        description="Custo por kW de potência do inversor (R$/kW)"
    )

    taxa_desconto: float = Field(
        default=0.08,
        ge=0.01,
        le=0.30,
        description="Taxa de desconto para análise financeira (decimal)"
    )

    vida_util_anos: int = Field(
        default=10,
        ge=5,
        le=25,
        description="Vida útil estimada do sistema em anos"
    )

    @validator('consumo_mensal_kwh')
    def validate_consumo(cls, v):
        if any(c < 0 for c in v):
            raise ValueError('Consumo mensal não pode ser negativo')
        if all(c == 0 for c in v):
            raise ValueError('Pelo menos um mês deve ter consumo > 0')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "consumo_mensal_kwh": [15000, 14500, 15200, 14800, 15500, 15100,
                                       14900, 15300, 15600, 15400, 14700, 15000],
                "demanda_contratada_kw": 50,
                "demanda_pico_kw": 65,
                "latitude": -23.5505,
                "longitude": -46.6333,
                "tarifa": {
                    "tipo": "branca",
                    "tarifa_ponta_kwh": 1.20,
                    "tarifa_intermediaria_kwh": 0.80,
                    "tarifa_fora_ponta_kwh": 0.50,
                    "horario_ponta_inicio": "18:00:00",
                    "horario_ponta_fim": "21:00:00"
                },
                "objetivo_principal": "hibrido",
                "tipo_bateria": "litio",
                "custo_kwh_bateria": 3000,
                "custo_kw_inversor": 1500
            }
        }


class BessSimulationRequest(BaseModel):
    """Requisição para simulação de BESS (8760 horas)"""

    # Capacidade do sistema
    capacidade_kwh: float = Field(
        ...,
        ge=1,
        le=10000,
        description="Capacidade nominal da bateria em kWh"
    )

    potencia_kw: float = Field(
        ...,
        ge=1,
        le=5000,
        description="Potência nominal do inversor em kW"
    )

    # Curva de consumo
    curva_consumo_horaria: List[float] = Field(
        ...,
        min_length=8760,
        max_length=8760,
        description="Curva de consumo horária para o ano (8760 valores em kWh)"
    )

    # Curva de geração solar (opcional)
    curva_geracao_solar: Optional[List[float]] = Field(
        None,
        min_length=8760,
        max_length=8760,
        description="Curva de geração solar horária (opcional, para sistemas híbridos)"
    )

    # Tarifa
    tarifa: TarifaEnergia = Field(
        ...,
        description="Estrutura tarifária"
    )

    # Parâmetros de bateria
    soc_inicial: float = Field(
        default=0.5,
        ge=0,
        le=1,
        description="Estado de carga inicial (0-1)"
    )

    soc_minimo: float = Field(
        default=0.1,
        ge=0,
        le=0.5,
        description="Estado de carga mínimo permitido"
    )

    soc_maximo: float = Field(
        default=1.0,
        ge=0.5,
        le=1.0,
        description="Estado de carga máximo permitido"
    )

    eficiencia_carga: float = Field(
        default=0.95,
        ge=0.80,
        le=0.99,
        description="Eficiência de carga"
    )

    eficiencia_descarga: float = Field(
        default=0.95,
        ge=0.80,
        le=0.99,
        description="Eficiência de descarga"
    )

    # Estratégia de operação
    estrategia: Literal["arbitragem", "peak_shaving", "auto_consumo", "custom"] = Field(
        default="arbitragem",
        description="Estratégia de operação do BESS"
    )

    # Peak shaving
    limite_demanda_kw: Optional[float] = Field(
        None,
        ge=0,
        description="Limite de demanda para peak shaving (kW)"
    )

    @validator('curva_consumo_horaria')
    def validate_curva_consumo(cls, v):
        if any(c < 0 for c in v):
            raise ValueError('Consumo horário não pode ser negativo')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "capacidade_kwh": 100,
                "potencia_kw": 50,
                "curva_consumo_horaria": [20.5, 18.3, ...],  # 8760 valores
                "tarifa": {
                    "tipo": "branca",
                    "tarifa_ponta_kwh": 1.20,
                    "tarifa_fora_ponta_kwh": 0.50
                },
                "estrategia": "arbitragem",
                "soc_inicial": 0.5
            }
        }


class BessDegradationRequest(BaseModel):
    """Requisição para análise de degradação de BESS"""

    # Capacidade inicial
    capacidade_inicial_kwh: float = Field(
        ...,
        ge=1,
        le=10000,
        description="Capacidade nominal inicial em kWh"
    )

    # Parâmetros de uso
    ciclos_por_ano: float = Field(
        ...,
        ge=1,
        le=1000,
        description="Número de ciclos equivalentes por ano"
    )

    profundidade_descarga_media: float = Field(
        ...,
        ge=0.1,
        le=1.0,
        description="Profundidade média de descarga (DoD média)"
    )

    # Parâmetros de temperatura
    temperatura_operacao_media: float = Field(
        default=25.0,
        ge=-20,
        le=60,
        description="Temperatura média de operação em °C"
    )

    # Tipo de bateria
    tipo_bateria: Literal["litio_nmc", "litio_lfp", "chumbo_acido", "flow"] = Field(
        default="litio_lfp",
        description="Tecnologia da bateria"
    )

    # Período de análise
    anos_operacao: int = Field(
        ...,
        ge=1,
        le=30,
        description="Número de anos para projetar degradação"
    )

    # Parâmetros de degradação (opcionais - usa defaults do tipo)
    taxa_degradacao_calendario: Optional[float] = Field(
        None,
        ge=0,
        le=10,
        description="Taxa de degradação calendário anual em % (opcional)"
    )

    taxa_degradacao_ciclica: Optional[float] = Field(
        None,
        ge=0,
        le=10,
        description="Taxa de degradação por ciclo em % (opcional)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "capacidade_inicial_kwh": 100,
                "ciclos_por_ano": 250,
                "profundidade_descarga_media": 0.8,
                "temperatura_operacao_media": 25,
                "tipo_bateria": "litio_lfp",
                "anos_operacao": 10
            }
        }
