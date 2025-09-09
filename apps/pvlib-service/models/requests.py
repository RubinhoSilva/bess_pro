from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
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
    modelo_decomposicao: Literal['erbs', 'disc', 'dirint', 'orgill_hollands', 'boland', 'louche'] = Field(
        default='erbs',
        description="Modelo para decomposição GHI → DNI/DHI (usado apenas se tilt > 0 ou azimuth ≠ 0)",
        example='erbs'
    )

    @validator('azimuth')
    def normalize_azimuth(cls, v):
        """Normaliza azimute para range 0-360"""
        return float(v % 360)

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
                "modelo_decomposicao": "erbs"
            }
        }

class SolarModuleData(BaseModel):
    """Dados completos do módulo solar"""
    
    fabricante: str = Field(..., description="Fabricante do módulo")
    modelo: str = Field(..., description="Modelo do módulo")
    potencia_nominal_w: float = Field(
        ..., 
        ge=settings.MIN_MODULE_POWER, 
        le=settings.MAX_MODULE_POWER,
        description="Potência nominal em Watts"
    )
    
    # Dimensões
    largura_mm: Optional[float] = Field(None, ge=100, le=5000, description="Largura em mm")
    altura_mm: Optional[float] = Field(None, ge=100, le=5000, description="Altura em mm")
    espessura_mm: Optional[float] = Field(None, ge=10, le=100, description="Espessura em mm")
    
    # Características elétricas
    vmpp: Optional[float] = Field(None, ge=0, le=100, description="Tensão no ponto de máxima potência (V)")
    impp: Optional[float] = Field(None, ge=0, le=20, description="Corrente no ponto de máxima potência (A)")
    voc: Optional[float] = Field(None, ge=0, le=100, description="Tensão de circuito aberto (V)")
    isc: Optional[float] = Field(None, ge=0, le=25, description="Corrente de curto-circuito (A)")
    
    # Características técnicas
    tipo_celula: Optional[str] = Field(None, description="Tipo de célula (ex: Monocristalino)")
    eficiencia: Optional[float] = Field(None, ge=5, le=30, description="Eficiência do módulo (%)")
    numero_celulas: Optional[int] = Field(None, ge=36, le=144, description="Número de células")
    
    # Coeficientes de temperatura
    temp_coef_pmax: Optional[float] = Field(None, ge=-1, le=0, description="Coef. temperatura Pmax (%/°C)")
    temp_coef_voc: Optional[float] = Field(None, ge=-1, le=0, description="Coef. temperatura Voc (%/°C)")
    temp_coef_isc: Optional[float] = Field(None, ge=0, le=1, description="Coef. temperatura Isc (%/°C)")
    
    # Outros
    peso_kg: Optional[float] = Field(None, ge=5, le=50, description="Peso em kg")
    garantia_anos: Optional[int] = Field(None, ge=1, le=30, description="Garantia em anos")
    tolerancia: Optional[str] = Field(None, description="Tolerância de potência (ex: +3/-0%)")
    
    # Parâmetros para modelo espectral
    material: Optional[str] = Field(None, description="Material da célula (c-Si, a-Si, CdTe, etc.)")
    technology: Optional[str] = Field(None, description="Tecnologia (mono-Si, mc-Si, a-Si, CdTe, etc.)")
    
    # Parâmetros do modelo de diodo único (5 parâmetros fundamentais)
    a_ref: Optional[float] = Field(None, ge=0.5, le=3.0, description="Fator de idealidade modificado [V]")
    i_l_ref: Optional[float] = Field(None, ge=5, le=20, description="Fotocorrente STC [A]")
    i_o_ref: Optional[float] = Field(None, ge=1e-15, le=1e-8, description="Corrente saturação reversa STC [A]")
    r_s: Optional[float] = Field(None, ge=0.1, le=2.0, description="Resistência série [Ω]")
    r_sh_ref: Optional[float] = Field(None, ge=100, le=1000, description="Resistência paralelo STC [Ω]")
    
    # Coeficientes de temperatura críticos
    alpha_sc: Optional[float] = Field(None, ge=0.0001, le=0.001, description="Coef. temperatura corrente [A/°C]")
    beta_oc: Optional[float] = Field(None, ge=-0.01, le=-0.001, description="Coef. temperatura tensão [V/°C]")
    gamma_r: Optional[float] = Field(None, ge=-0.001, le=0, description="Coef. temperatura potência [1/°C]")
    
    # Parâmetros SAPM térmicos (modelo de temperatura avançado)
    a0: Optional[float] = Field(None, ge=-10, le=10, description="Parâmetro térmico SAPM A0")
    a1: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM A1")
    a2: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM A2")
    a3: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM A3")
    a4: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM A4")
    b0: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM B0")
    b1: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM B1")
    b2: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM B2")
    b3: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM B3")
    b4: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM B4")
    b5: Optional[float] = Field(None, ge=-1, le=1, description="Parâmetro térmico SAPM B5")
    dtc: Optional[float] = Field(None, ge=0, le=10, description="Delta T para SAPM [°C]")

    class Config:
        schema_extra = {
            "example": {
                "fabricante": "Canadian Solar",
                "modelo": "CS3W-540MS",
                "potencia_nominal_w": 540,
                "largura_mm": 2256,
                "altura_mm": 1133,
                "espessura_mm": 35,
                "vmpp": 41.4,
                "impp": 13.05,
                "voc": 49.8,
                "isc": 13.8,
                "tipo_celula": "Monocristalino PERC",
                "eficiencia": 20.9,
                "numero_celulas": 120,
                "temp_coef_pmax": -0.37,
                "temp_coef_voc": -0.29,
                "temp_coef_isc": 0.05,
                "peso_kg": 27.5,
                "garantia_anos": 25,
                "tolerancia": "+5/-0%",
                "material": "c-Si",
                "technology": "mono-Si",
                "a_ref": 1.8,
                "i_l_ref": 13.91,
                "i_o_ref": 3.712e-12,
                "r_s": 0.348,
                "r_sh_ref": 381.68,
                "alpha_sc": 0.0004,
                "beta_oc": -0.0028,
                "gamma_r": -0.0004,
                "a0": -3.56,
                "a1": -0.075,
                "a2": 0.0,
                "a3": 0.0,
                "a4": 0.0,
                "b0": 0.0,
                "b1": 0.0,
                "b2": 0.0,
                "b3": 0.0,
                "b4": 0.0,
                "b5": 0.0,
                "dtc": 3.0
            }
        }


class InverterData(BaseModel):
    """Dados completos do inversor"""
    
    fabricante: str = Field(..., description="Fabricante do inversor")
    modelo: str = Field(..., description="Modelo do inversor")
    potencia_saida_ca_w: float = Field(..., ge=500, le=100000, description="Potência nominal CA (W)")
    tipo_rede: str = Field(..., description="Tipo de rede (ex: Monofásico 220V)")
    
    # Dados de entrada (CC/FV)
    potencia_fv_max_w: Optional[float] = Field(None, ge=500, le=150000, description="Máxima potência FV (W)")
    tensao_cc_max_v: Optional[float] = Field(None, ge=100, le=1500, description="Máxima tensão CC (V)")
    numero_mppt: Optional[int] = Field(None, ge=1, le=12, description="Número de MPPTs")
    strings_por_mppt: Optional[int] = Field(None, ge=1, le=4, description="Strings por MPPT")
    faixa_mppt: Optional[str] = Field(None, description="Faixa de tensão MPPT (ex: 60-550V)")
    corrente_entrada_max_a: Optional[float] = Field(None, ge=5, le=50, description="Corrente max entrada (A)")
    
    # Dados de saída (CA)
    potencia_aparente_max_va: Optional[float] = Field(None, ge=500, le=120000, description="Potência aparente máxima (VA)")
    corrente_saida_max_a: Optional[float] = Field(None, ge=2, le=200, description="Corrente máxima saída (A)")
    tensao_saida_nominal: Optional[str] = Field(None, description="Tensão saída nominal (ex: 220V)")
    frequencia_nominal_hz: Optional[float] = Field(None, ge=50, le=60, description="Frequência nominal (Hz)")
    
    # Eficiência
    eficiencia_max: Optional[float] = Field(None, ge=90, le=99, description="Eficiência máxima (%)")
    eficiencia_europeia: Optional[float] = Field(None, ge=90, le=99, description="Eficiência europeia (%)")
    eficiencia_mppt: Optional[float] = Field(None, ge=95, le=100, description="Eficiência MPPT (%)")
    
    # Características físicas
    peso_kg: Optional[float] = Field(None, ge=5, le=100, description="Peso em kg")
    grau_protecao: Optional[str] = Field(None, description="Grau de proteção (ex: IP65)")
    temperatura_operacao: Optional[str] = Field(None, description="Faixa temperatura (ex: -25°C a +60°C)")
    
    # Dados comerciais
    garantia_anos: Optional[int] = Field(None, ge=1, le=25, description="Garantia em anos")
    
    # Parâmetros Sandia para simulação precisa
    vdco: Optional[float] = Field(None, ge=100, le=1000, description="Tensão DC nominal de operação (V)")
    pso: Optional[float] = Field(None, ge=0, le=100, description="Potência de standby/consumo próprio (W)")
    c0: Optional[float] = Field(None, ge=-1, le=1, description="Coeficiente 0 da curva de eficiência")
    c1: Optional[float] = Field(None, ge=-1, le=1, description="Coeficiente 1 da curva de eficiência") 
    c2: Optional[float] = Field(None, ge=-1, le=1, description="Coeficiente 2 da curva de eficiência")
    c3: Optional[float] = Field(None, ge=-1, le=1, description="Coeficiente 3 da curva de eficiência")
    pnt: Optional[float] = Field(None, ge=0, le=1, description="Potência threshold normalizada (fração de Paco)")

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
                "faixa_mppt": "80-550V",
                "corrente_entrada_max_a": 12.5,
                "potencia_aparente_max_va": 5000,
                "corrente_saida_max_a": 25,
                "tensao_saida_nominal": "220V",
                "frequencia_nominal_hz": 60,
                "eficiencia_max": 97.6,
                "eficiencia_europeia": 97.2,
                "eficiencia_mppt": 99.9,
                "peso_kg": 22.5,
                "grau_protecao": "IP65",
                "temperatura_operacao": "-25°C a +60°C",
                "garantia_anos": 10,
                "vdco": 480,
                "pso": 25,
                "c0": -0.000008,
                "c1": -0.000120,
                "c2": 0.001400,
                "c3": -0.020000,
                "pnt": 0.02
            }
        }




# Renomear para ser a versão principal
class ModuleCalculationRequest(IrradiationAnalysisRequest):
    """Requisição avançada para cálculo de módulos com dados completos"""
    
    # Dados do sistema
    consumo_anual_kwh: float = Field(
        ...,
        ge=settings.MIN_CONSUMPTION,
        le=settings.MAX_CONSUMPTION,
        description="Consumo anual de energia em kWh",
        example=4800
    )
    
    # Dados completos do módulo e inversor
    modulo: SolarModuleData = Field(..., description="Dados completos do módulo solar")
    inversor: InverterData = Field(..., description="Dados completos do inversor")
    
    # Parâmetros adicionais do sistema
    perdas_sistema: Optional[float] = Field(
        default=14.0, 
        ge=0, 
        le=30, 
        description="Perdas totais do sistema (%)"
    )
    fator_seguranca: Optional[float] = Field(
        default=1.1, 
        ge=1.0, 
        le=1.5, 
        description="Fator de segurança para dimensionamento"
    )
    num_modules: Optional[int] = Field(
        default=None,
        ge=1,
        le=1000,
        description="Número específico de módulos (se fornecido, usa este valor ao invés de calcular automaticamente)"
    )

    @validator('consumo_anual_kwh')
    def round_consumption(cls, v):
        """Arredonda consumo para 1 casa decimal"""
        return round(float(v), 1)

    class Config:
        schema_extra = {
            "example": {
                "lat": -15.7942,
                "lon": -47.8822,
                "tilt": 20,
                "azimuth": 180,
                "modelo_decomposicao": "erbs",
                "consumo_anual_kwh": 4800,
                "modulo": {
                    "fabricante": "Canadian Solar",
                    "modelo": "CS3W-540MS",
                    "potencia_nominal_w": 540,
                    "eficiencia": 20.9,
                    "temp_coef_pmax": -0.37
                },
                "inversor": {
                    "fabricante": "WEG",
                    "modelo": "SIW500H-M", 
                    "potencia_saida_ca_w": 5000,
                    "tipo_rede": "Monofásico 220V",
                    "eficiencia_max": 97.6
                },
                "perdas_sistema": 14.0,
                "fator_seguranca": 1.1
            }
        }

class CacheStatsRequest(BaseModel):
    """Requisição para estatísticas do cache (admin)"""
    
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