"""
Modelos de requisição para cálculos de sistemas HÍBRIDOS (Solar + BESS)
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from models.solar.requests import SolarSystemCalculationRequest
from models.bess.requests import TarifaEnergia, PerfilConsumo


class HybridDimensioningRequest(BaseModel):
    """
    Requisição para análise de sistema híbrido Solar + BESS

    Este modelo combina:
    1. Parâmetros do sistema solar (para calcular geração via PVLIB)
    2. Parâmetros do BESS (capacidade e potência já definidos pelo usuário)
    3. Tarifas e perfil de consumo
    4. Parâmetros econômicos

    O endpoint irá:
    - Calcular geração solar usando código existente (SolarCalculationService)
    - Simular operação do BESS com capacidade/potência fornecidas
    - Retornar análise econômica integrada comparando cenários
    """

    # ========================================================================
    # PARTE 1: SISTEMA SOLAR
    # ========================================================================
    # Reutiliza o modelo completo de cálculo solar existente
    # Inclui: localização, módulos, inversores, águas de telhado, perdas, etc.
    sistema_solar: SolarSystemCalculationRequest = Field(
        ...,
        description="Parâmetros completos do sistema solar para cálculo PVLIB"
    )

    # ========================================================================
    # PARTE 2: SISTEMA BESS (PRÉ-DIMENSIONADO PELO USUÁRIO)
    # ========================================================================
    # O usuário já definiu o tamanho do BESS antes de chamar a API
    # O sistema NÃO calcula tamanho ótimo, apenas simula com os valores dados

    capacidade_kwh: float = Field(
        ...,
        ge=1,
        le=10000,
        description="Capacidade nominal da bateria em kWh (definido pelo usuário)"
    )

    potencia_kw: float = Field(
        ...,
        ge=1,
        le=5000,
        description="Potência nominal do inversor BESS em kW (definido pelo usuário)"
    )

    # Tipo de tecnologia da bateria (afeta eficiência e degradação)
    tipo_bateria: Literal["litio", "chumbo_acido", "flow"] = Field(
        default="litio",
        description="Tecnologia da bateria: litio (padrão), chumbo-ácido ou flow"
    )

    # Eficiência round-trip: (energia saída / energia entrada)
    # Típico: Lítio = 90-95%, Chumbo = 80-85%
    eficiencia_roundtrip: float = Field(
        default=0.90,
        ge=0.80,
        le=0.99,
        description="Eficiência round-trip (carga + descarga)"
    )

    # Profundidade máxima de descarga (DoD)
    # Lítio moderno: até 90%, Chumbo-ácido: 50-80%
    profundidade_descarga_max: float = Field(
        default=0.90,
        ge=0.5,
        le=1.0,
        description="Profundidade máxima de descarga permitida (0-1)"
    )

    # Estado de carga inicial da simulação
    soc_inicial: float = Field(
        default=0.5,
        ge=0,
        le=1,
        description="Estado de carga inicial (0-1, padrão 50%)"
    )

    # Limites operacionais de SOC
    soc_minimo: float = Field(
        default=0.1,
        ge=0,
        le=0.5,
        description="SOC mínimo permitido (0-0.5, típico 10%)"
    )

    soc_maximo: float = Field(
        default=1.0,
        ge=0.5,
        le=1.0,
        description="SOC máximo permitido (0.5-1, típico 100%)"
    )

    # ========================================================================
    # PARTE 3: TARIFAS E CONSUMO
    # ========================================================================

    tarifa: TarifaEnergia = Field(
        ...,
        description="Estrutura tarifária (branca, convencional, verde ou azul)"
    )

    # Perfil de consumo (opcional - usa padrão comercial se não fornecido)
    perfil_consumo: Optional[PerfilConsumo] = Field(
        None,
        description="Perfil de consumo horário (opcional, usa padrão se não fornecido)"
    )

    # ========================================================================
    # PARTE 4: ESTRATÉGIA DE OPERAÇÃO DO BESS
    # ========================================================================

    estrategia: Literal["arbitragem", "peak_shaving", "auto_consumo", "custom"] = Field(
        default="arbitragem",
        description="""Estratégia de operação do BESS:
        - arbitragem: compra na ponta, vende fora ponta (diferença de tarifa)
        - peak_shaving: reduz picos de demanda
        - auto_consumo: maximiza uso da geração solar própria
        - custom: estratégia personalizada
        """
    )

    # Limite de demanda para peak shaving (kW)
    # Se estrategia = "peak_shaving", o BESS descarga quando demanda > limite
    limite_demanda_kw: Optional[float] = Field(
        None,
        ge=0,
        description="Limite de demanda para estratégia peak_shaving (kW)"
    )

    # ========================================================================
    # PARTE 5: PARÂMETROS ECONÔMICOS
    # ========================================================================

    # Custo por kWh de capacidade instalada
    # Mercado 2025: R$ 2.000-4.000/kWh (média R$ 3.000)
    custo_kwh_bateria: float = Field(
        default=3000.0,
        ge=1000,
        le=10000,
        description="Custo por kWh de capacidade da bateria (R$/kWh)"
    )

    # Custo por kW de potência do inversor BESS
    # Mercado 2025: R$ 1.000-2.500/kW (média R$ 1.500)
    custo_kw_inversor_bess: float = Field(
        default=1500.0,
        ge=500,
        le=5000,
        description="Custo por kW de potência do inversor BESS (R$/kW)"
    )

    # Custo fixo de instalação (BMS, proteções, estrutura, mão de obra)
    custo_instalacao_bess: float = Field(
        default=5000.0,
        ge=0,
        description="Custo fixo de instalação do BESS (R$)"
    )

    # Taxa de desconto para cálculo de VPL (decimal)
    # Típico: 8-12% ao ano
    taxa_desconto: float = Field(
        default=0.08,
        ge=0.01,
        le=0.30,
        description="Taxa de desconto anual para análise financeira (0.08 = 8%)"
    )

    # Vida útil estimada do sistema BESS
    # Lítio: 10-15 anos, Chumbo-ácido: 5-8 anos
    vida_util_anos: int = Field(
        default=10,
        ge=5,
        le=25,
        description="Vida útil estimada do BESS em anos"
    )

    class Config:
        json_schema_extra = {
            "example": {
                # Sistema Solar (mesma estrutura do endpoint /solar/calculate)
                "sistema_solar": {
                    "lat": -15.7942,
                    "lon": -47.8822,
                    "origem_dados": "PVGIS",
                    "startyear": 2015,
                    "endyear": 2020,
                    "modelo_decomposicao": "louche",
                    "modelo_transposicao": "perez",
                    "mount_type": "open_rack_glass_glass",
                    "consumo_mensal_kwh": [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500],
                    "perdas": {
                        "sujeira": 2.0,
                        "sombreamento": 3.0,
                        "incompatibilidade": 1.0,
                        "fiacao": 0.5,
                        "outras": 0.5
                    },
                    "modulo": {
                        "fabricante": "Canadian Solar",
                        "modelo": "CS3W-540MS",
                        "potencia_nominal_w": 540,
                        "vmpp": 41.4,
                        "impp": 13.05,
                        "voc_stc": 51.16,
                        "isc_stc": 14.55
                    },
                    "aguasTelhado": [
                        {
                            "id": "agua_001",
                            "nome": "Água Sul",
                            "orientacao": 180,
                            "inclinacao": 20,
                            "numeroModulos": 12,
                            "inversor": {
                                "fabricante": "WEG",
                                "modelo": "SIW500H-M",
                                "potencia_saida_ca_w": 5000,
                                "numero_mppt": 2
                            }
                        }
                    ]
                },

                # Sistema BESS (pré-dimensionado)
                "capacidade_kwh": 100.0,
                "potencia_kw": 50.0,
                "tipo_bateria": "litio",
                "eficiencia_roundtrip": 0.90,
                "profundidade_descarga_max": 0.90,

                # Tarifa
                "tarifa": {
                    "tipo": "branca",
                    "tarifa_ponta_kwh": 1.20,
                    "tarifa_intermediaria_kwh": 0.80,
                    "tarifa_fora_ponta_kwh": 0.50,
                    "horario_ponta_inicio": "18:00:00",
                    "horario_ponta_fim": "21:00:00"
                },

                # Estratégia
                "estrategia": "arbitragem",

                # Custos
                "custo_kwh_bateria": 3000.0,
                "custo_kw_inversor_bess": 1500.0,
                "custo_instalacao_bess": 5000.0,
                "taxa_desconto": 0.08,
                "vida_util_anos": 10
            }
        }
