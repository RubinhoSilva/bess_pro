from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional, Literal, List, Dict
from core.config import settings

class LocationRequest(BaseModel):
    """Requisição básica com coordenadas geográficas"""

    lat: float = Field(
        ...,
        ge=settings.MIN_LATITUDE,
        le=settings.MAX_LATITUDE,
        description="Latitude em graus decimais (-90 a 90)",
        example=-15.7942
    )
    lon: float = Field(
        ...,
        ge=settings.MIN_LONGITUDE,
        le=settings.MAX_LONGITUDE,
        description="Longitude em graus decimais (-180 a 180)",
        example=-47.8822
    )

    @validator('lat', 'lon')
    def round_coordinates(cls, v):
        """Arredonda coordenadas para 4 casas decimais"""
        return round(float(v), 4)

    class Config:
        schema_extra = {
            "example": {
                "lat": -15.7942,
                "lon": -47.8822
            }
        }

class IrradiationAnalysisRequest(LocationRequest):
    """Requisição para análise de irradiação solar mensal"""

    tilt: float = Field(
        default=0,
        ge=settings.MIN_TILT,
        le=settings.MAX_TILT,
        description="Inclinação dos módulos em graus (0° = horizontal, 90° = vertical)",
        example=20
    )
    azimuth: float = Field(
        default=0,
        ge=settings.MIN_AZIMUTH,
        le=settings.MAX_AZIMUTH,
        description="Orientação dos módulos em graus (0° = Norte, 90° = Leste, 180° = Sul, 270° = Oeste)",
        example=180
    )
    startyear: Optional[int] = Field(
        default=settings.PVGIS_START_YEAR,
        ge=2005,
        le=2020,
        description="Ano inicial para dados históricos PVGIS",
        example=2005
    )
    endyear: Optional[int] = Field(
        default=settings.PVGIS_END_YEAR,
        ge=2005,
        le=2020,
        description="Ano final para dados históricos PVGIS",
        example=2020
    )
    data_source: Literal["pvgis", "nasa"] = Field(
        default="pvgis",
        description="Fonte de dados climáticos (pvgis ou nasa)"
    )
    modelo_decomposicao: Optional[Literal["erbs", "disc", "dirint", "dirindex"]] = Field(
        default="erbs",
        description="Modelo de decomposição de irradiância (se necessário)"
    )

    @validator('endyear')
    def validate_year_range(cls, v, values):
        """Valida se endyear é maior ou igual a startyear"""
        if 'startyear' in values and v < values['startyear']:
            raise ValueError('endyear deve ser maior ou igual a startyear')
        return v

    @validator('tilt', 'azimuth')
    def round_angles(cls, v):
        """Arredonda ângulos para 1 casa decimal"""
        return round(float(v), 1)

    class Config:
        schema_extra = {
            "example": {
                "lat": -15.7942,
                "lon": -47.8822,
                "tilt": 20,
                "azimuth": 180,
                "startyear": 2005,
                "endyear": 2020,
                "modelo_decomposicao": "erbs"
            }
        }

class SolarModuleData(BaseModel):
    """Dados do módulo solar"""

    fabricante: str = Field(..., description="Fabricante do módulo")
    modelo: str = Field(..., description="Modelo do módulo")
    potencia_nominal_w: float = Field(
        ...,
        ge=settings.MIN_MODULE_POWER,
        le=settings.MAX_MODULE_POWER,
        description="Potência nominal em Watts (STC)"
    )
    eficiencia: float = Field(..., ge=10, le=30, description="Eficiência do módulo (%)")
    temp_coef_pmax: float = Field(..., ge=-1, le=0, description="Coeficiente de temperatura de Pmax (%/°C)")

    # Dimensões
    comprimento: Optional[float] = Field(None, ge=1000, le=3000, description="Comprimento em mm")
    largura: Optional[float] = Field(None, ge=500, le=1500, description="Largura em mm")
    peso: Optional[float] = Field(None, ge=10, le=50, description="Peso em kg")

    # Dados elétricos adicionais para simulação precisa
    voc: Optional[float] = Field(None, ge=20, le=70, description="Tensão de circuito aberto (V)")
    isc: Optional[float] = Field(None, ge=5, le=20, description="Corrente de curto-circuito (A)")
    vmpp: Optional[float] = Field(None, ge=20, le=60, description="Tensão no ponto de máxima potência (V)")
    impp: Optional[float] = Field(None, ge=5, le=20, description="Corrente no ponto de máxima potência (A)")

    # Coeficientes de temperatura adicionais
    temp_coef_voc: Optional[float] = Field(None, ge=-0.5, le=0, description="Coef. temperatura Voc (%/°C)")
    temp_coef_isc: Optional[float] = Field(None, ge=0, le=0.1, description="Coef. temperatura Isc (%/°C)")

    # Condições de operação nominal (NOCT)
    noct: Optional[float] = Field(None, ge=40, le=50, description="NOCT - Temperatura nominal de operação (°C)")

    # Dados Sandia para simulação precisa
    a_ref: Optional[float] = Field(None, description="Fator de idealidade modificado (ref)")
    il_ref: Optional[float] = Field(None, description="Corrente foto-gerada (ref)")
    io_ref: Optional[float] = Field(None, description="Corrente de saturação (ref)")
    rs: Optional[float] = Field(None, description="Resistência série (ohms)")
    rsh_ref: Optional[float] = Field(None, description="Resistência shunt (ohms, ref)")

    # Parâmetros de temperatura Sandia
    alpha_sc: Optional[float] = Field(None, description="Coef. temp. Isc normalizado (1/°C)")
    beta_oc: Optional[float] = Field(None, description="Coef. temp. Voc normalizado (1/°C)")
    gamma_r: Optional[float] = Field(None, description="Coef. temp. Pmp normalizado (1/°C)")

    # Parâmetros adicionais King
    a0: Optional[float] = Field(None, description="a0 (King model)")
    a1: Optional[float] = Field(None, description="a1 (King model)")
    a2: Optional[float] = Field(None, description="a2 (King model)")
    a3: Optional[float] = Field(None, description="a3 (King model)")
    a4: Optional[float] = Field(None, description="a4 (King model)")
    b0: Optional[float] = Field(None, description="b0 (King model)")
    b1: Optional[float] = Field(None, description="b1 (King model)")
    b2: Optional[float] = Field(None, description="b2 (King model)")
    b3: Optional[float] = Field(None, description="b3 (King model)")
    b4: Optional[float] = Field(None, description="b4 (King model)")
    b5: Optional[float] = Field(None, description="b5 (King model)")
    dtc: Optional[float] = Field(None, description="Delta T @ NOCT (°C)")

    class Config:
        schema_extra = {
            "example": {
                "fabricante": "Canadian Solar",
                "modelo": "CS3W-540MS",
                "potencia_nominal_w": 540,
                "eficiencia": 20.9,
                "temp_coef_pmax": -0.37,
                "comprimento": 2278,
                "largura": 1134,
                "peso": 28.6,
                "voc": 49.6,
                "isc": 13.87,
                "vmpp": 41.7,
                "impp": 12.95,
                "temp_coef_voc": -0.28,
                "temp_coef_isc": 0.05,
                "noct": 45,
                "alpha_sc": 0.00041,
                "beta_oc": -0.0025,
                "gamma_r": -0.0029,
                "a0": 0.0,
                "a1": 0.0,
                "a2": 0.0,
                "a3": 0.0,
                "a4": 0.0,
                "b0": 1.0,
                "b1": 0.0,
                "b2": 0.0,
                "b3": 0.0,
                "b4": 0.0,
                "b5": 0.0,
                "dtc": 3.0
            }
        }


# ============================================================================
# NOVAS CLASSES PARA SISTEMA SOLAR MULTI-INVERSOR
# ============================================================================

class PerdasSistema(BaseModel):
    """Perdas do sistema fotovoltaico"""

    sujeira: float = Field(..., ge=0, le=20, description="Perdas por sujeira (%)")
    sombreamento: float = Field(..., ge=0, le=30, description="Perdas por sombreamento (%)")
    incompatibilidade: float = Field(..., ge=0, le=10, description="Perdas por incompatibilidade/mismatch (%)")
    fiacao: float = Field(..., ge=0, le=10, description="Perdas por fiação (%)")
    outras: float = Field(..., ge=0, le=15, description="Outras perdas (%)")

    class Config:
        schema_extra = {
        "example": {
            "sujeira": 2.0,
            "sombreamento": 3.0,
            "incompatibilidade": 2.0,
            "fiacao": 2.0,
            "outras": 1.0
        }
        }


class ModuloSolar(BaseModel):
    """Dados completos do módulo solar para cálculo pvlib"""

    # Informações básicas
    fabricante: str = Field(..., description="Fabricante do módulo")
    modelo: str = Field(..., description="Modelo do módulo")
    potencia_nominal_w: float = Field(..., ge=100, le=1000, description="Potência nominal STC (W)")

    # Dimensões físicas
    largura_mm: float = Field(..., ge=500, le=2500, description="Largura em mm")
    altura_mm: float = Field(..., ge=1000, le=3000, description="Altura em mm")
    peso_kg: float = Field(..., ge=10, le=50, description="Peso em kg")

    # Parâmetros elétricos STC
    vmpp: float = Field(..., ge=20, le=60, description="Tensão no ponto de máxima potência (V)")
    impp: float = Field(..., ge=5, le=20, description="Corrente no ponto de máxima potência (A)")
    voc_stc: float = Field(..., ge=20, le=70, description="Tensão de circuito aberto STC (V)")
    isc_stc: float = Field(..., ge=5, le=20, description="Corrente de curto-circuito STC (A)")

    # Coeficientes de temperatura
    eficiencia: float = Field(..., ge=10, le=30, description="Eficiência do módulo (%)")
    temp_coef_pmax: float = Field(..., ge=-1, le=0, description="Coeficiente de temperatura Pmax (%/°C)")

    # Parâmetros Sandia (obrigatórios para pvlib)
    alpha_sc: float = Field(..., description="Coef. temp. Isc normalizado (1/°C)")
    beta_oc: float = Field(..., description="Coef. temp. Voc normalizado (1/°C)")
    gamma_r: float = Field(..., description="Coef. temp. Pmp normalizado (1/°C)")
    cells_in_series: int = Field(..., ge=36, le=200, description="Número de células em série")

    # Parâmetros Sandia avançados
    a_ref: float = Field(..., description="Fator de idealidade modificado (ref)")
    il_ref: float = Field(..., description="Corrente foto-gerada (ref)")
    io_ref: float = Field(..., description="Corrente de saturação (ref)")
    rs: float = Field(..., description="Resistência série (ohms)")
    rsh_ref: float = Field(..., description="Resistência shunt (ohms, ref)")

    # Informações adicionais (opcionais)
    material: Optional[str] = Field(None, description="Material (ex: c-Si)")
    technology: Optional[str] = Field(None, description="Tecnologia (ex: mono-Si)")

    class Config:
        schema_extra = {
            "example": {
                "fabricante": "Canadian Solar",
                "modelo": "CS3W-540MS",
                "potencia_nominal_w": 550,
                "largura_mm": 2261,
                "altura_mm": 1134,
                "vmpp": 41.4,
                "impp": 13.05,
                "eficiencia": 20.9,
                "temp_coef_pmax": -0.37,
                "peso_kg": 27.5,
                "material": "c-Si",
                "technology": "mono-Si",
                "voc_stc": 51.16,
                "isc_stc": 14.55,
                "alpha_sc": 0.00041,
                "beta_oc": -0.0025,
                "gamma_r": -0.0029,
                "cells_in_series": 144,
                "a_ref": 1.8,
                "il_ref": 14.86,
                "io_ref": 2.5e-12,
                "rs": 0.25,
                "rsh_ref": 450.0
            }
        }


class InversorData(BaseModel):
    """Dados do inversor fotovoltaico"""

    # Informações básicas
    fabricante: str = Field(..., description="Fabricante do inversor")
    modelo: str = Field(..., description="Modelo do inversor")
    potencia_saida_ca_w: float = Field(..., ge=500, le=100000, description="Potência nominal CA (W)")

    # Características técnicas
    tipo_rede: str = Field(..., description="Tipo de rede (ex: Monofásico 220V)")
    potencia_fv_max_w: float = Field(..., ge=500, le=150000, description="Máxima potência FV (W)")
    tensao_cc_max_v: float = Field(..., ge=100, le=1500, description="Máxima tensão CC (V)")
    numero_mppt: int = Field(..., ge=1, le=12, description="Número de MPPTs")
    strings_por_mppt: int = Field(..., ge=1, le=4, description="Strings por MPPT")

    # Eficiência
    eficiencia_max: float = Field(..., ge=90, le=99.9, description="Eficiência máxima (%)")
    efficiency_dc_ac: float = Field(..., ge=0.9, le=0.999, description="Eficiência nominal DC/AC (decimal)")

    # Parâmetros Sandia do inversor (opcionais)
    vdco: Optional[float] = Field(None, description="Tensão DC nominal de operação (V)")
    pso: Optional[float] = Field(None, description="Potência de standby/consumo próprio (W)")
    c0: Optional[float] = Field(None, description="Coeficiente 0 da curva de eficiência")
    c1: Optional[float] = Field(None, description="Coeficiente 1 da curva de eficiência")
    c2: Optional[float] = Field(None, description="Coeficiente 2 da curva de eficiência")
    c3: Optional[float] = Field(None, description="Coeficiente 3 da curva de eficiência")
    pnt: Optional[float] = Field(None, description="Potência threshold normalizada")

    class Config:
        schema_extra = {
            "example": {
                "fabricante": "WEG",
                "modelo": "SIW500H-M",
                "potencia_saida_ca_w": 5000,
                "tipo_rede": "Monofásico 220V",
                "potencia_fv_max_w": 7500,
                "tensao_cc_max_v": 600,
                "numero_mppt": 2,
                "strings_por_mppt": 2,
                "eficiencia_max": 97.6,
                "vdco": 480,
                "pso": 25,
                "c0": -0.000008,
                "c1": -0.00012,
                "c2": 0.0014,
                "c3": -0.02,
                "pnt": 0.02,
                "efficiency_dc_ac": 0.976
            }
        }


class OrientacaoModulos(BaseModel):
    """Configuração de orientação dos módulos (água de telhado/MPPT)"""

    nome: str = Field(..., description="Nome da orientação/água")
    orientacao: float = Field(..., ge=0, le=360, description="Azimute em graus (0° = Norte)")
    inclinacao: float = Field(..., ge=0, le=90, description="Inclinação em graus (0° = horizontal)")
    modulos_por_string: int = Field(..., ge=1, le=50, description="Número de módulos em série por string")
    numero_strings: Optional[int] = Field(default=1, ge=1, le=10, description="Número de strings (padrão: 1)")

    @validator('orientacao')
    def normalize_orientacao(cls, v):
        """Normaliza orientação para range 0-360"""
        return float(v % 360)

    class Config:
        schema_extra = {
            "example": {
                "nome": "Orientação #1",
                "orientacao": 45,
                "inclinacao": 45,
                "modulos_por_string": 12,
                "numero_strings": 1
            }
        }


class InversorConfig(BaseModel):
    """Configuração de um inversor com suas orientações"""

    inversor: InversorData = Field(..., description="Dados do inversor")
    orientacoes: List[OrientacaoModulos] = Field(
        ...,
        min_items=1,
        max_items=12,
        description="Lista de orientações/MPPTs conectados a este inversor"
    )

    @validator('orientacoes')
    def validate_orientacoes_vs_mppts(cls, v, values):
        """Valida se número de orientações não excede número de MPPTs"""
        if 'inversor' in values:
            numero_mppt = values['inversor'].numero_mppt
            if len(v) > numero_mppt:
                raise ValueError(
                    f"Número de orientações ({len(v)}) excede número de MPPTs disponíveis ({numero_mppt})"
                )
        return v

    class Config:
        schema_extra = {
            "example": {
                "inversor": {
                    "fabricante": "WEG",
                    "modelo": "SIW500H-M",
                    "potencia_saida_ca_w": 5000,
                    "efficiency_dc_ac": 0.976
                },
                "orientacoes": [
                    {
                        "nome": "Orientação #1",
                        "orientacao": 45,
                        "inclinacao": 45,
                        "modulos_por_string": 12
                    }
                ]
            }
        }


class SolarSystemCalculationRequest(BaseModel):
    """Requisição para cálculo de sistema solar multi-inversor"""

    # Localização
    lat: float = Field(..., ge=-90, le=90, description="Latitude em graus decimais")
    lon: float = Field(..., ge=-180, le=180, description="Longitude em graus decimais")

    # Parâmetros de dados climáticos
    origem_dados: Literal["PVGIS", "NASA"] = Field(default="PVGIS", description="Fonte de dados climáticos")
    startyear: int = Field(default=2015, ge=2005, le=2020, description="Ano inicial dados históricos")
    endyear: int = Field(default=2020, ge=2005, le=2020, description="Ano final dados históricos")

    # Modelos de cálculo
    modelo_decomposicao: Literal["erbs", "disc", "louche"] = Field(
        default="louche",
        description="Modelo de decomposição de irradiância"
    )
    modelo_transposicao: Literal["perez", "isotropic", "haydavies"] = Field(
        default="perez",
        description="Modelo de transposição para plano inclinado"
    )
    mount_type: Literal["open_rack_glass_glass", "close_mount_glass_glass", "open_rack_glass_polymer", "insulated_back_glass_polymer"] = Field(
        default="open_rack_glass_glass",
        description="Tipo de montagem (para modelo de temperatura)"
    )

    # Consumo
    consumo_mensal_kwh: List[float] = Field(
        ...,
        min_items=12,
        max_items=12,
        description="Consumo mensal de janeiro a dezembro (kWh)"
    )

    # Perdas do sistema
    perdas: PerdasSistema = Field(..., description="Perdas do sistema")

    # Equipamentos
    modulo: ModuloSolar = Field(..., description="Dados do módulo solar")
    inversores: List[InversorConfig] = Field(
        ...,
        min_items=1,
        max_items=10,
        description="Lista de inversores com suas configurações"
    )

    @validator('endyear')
    def validate_year_range(cls, v, values):
        """Valida se endyear >= startyear"""
        if 'startyear' in values and v < values['startyear']:
            raise ValueError('endyear deve ser maior ou igual a startyear')
        return v

    @validator('consumo_mensal_kwh')
    def validate_consumo(cls, v):
        """Valida valores de consumo"""
        if any(c < 0 for c in v):
            raise ValueError('Consumo mensal não pode ser negativo')
        if all(c == 0 for c in v):
            raise ValueError('Pelo menos um mês deve ter consumo > 0')
        return v

    class Config:
        schema_extra = {
            "example": {
                "lat": -23.7617,
                "lon": -53.3292,
                "modelo_decomposicao": "louche",
                "modelo_transposicao": "perez",
                "consumo_mensal_kwh": [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500],
                "origem_dados": "PVGIS",
                "startyear": 2015,
                "endyear": 2020,
                "mount_type": "open_rack",
                "perdas": {
                    "sujeira": 1,
                    "sombreamento": 2,
                    "incompatibilidade": 1,
                    "fiacao": 0.5,
                    "outras": 0.5
                },
                "modulo": {
                    "fabricante": "Canadian Solar",
                    "modelo": "CS3W-540MS",
                    "potencia_nominal_w": 550,
                    "voc_stc": 51.16,
                    "isc_stc": 14.55
                },
                "inversores": [
                    {
                        "inversor": {
                            "fabricante": "WEG",
                            "modelo": "SIW500H-M",
                            "potencia_saida_ca_w": 5000,
                            "efficiency_dc_ac": 0.976
                        },
                        "orientacoes": [
                            {
                                "nome": "Orientação #1",
                                "orientacao": 45,
                                "inclinacao": 45,
                                "modulos_por_string": 12
                            }
                        ]
                    }
                ]
            }
        }


class CacheStatsRequest(BaseModel):
    """Requisição para estatísticas do cache"""

    include_details: bool = Field(
        default=False,
        description="Incluir detalhes dos arquivos individuais"
    )

    class Config:
        schema_extra = {
            "example": {
                "include_details": False
            }
        }
