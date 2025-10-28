from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class MPPTCalculationRequest(BaseModel):
    """Request para cálculo de módulos por MPPT"""
    
    # Dados básicos do inversor
    fabricante: str = Field(..., description="Fabricante do inversor")
    modelo: str = Field(..., description="Modelo do inversor")
    
    # Dados do módulo para cálculo
    potencia_modulo_w: float = Field(..., description="Potência nominal do módulo em watts")
    voc_stc: float = Field(..., description="Tensão de circuito aberto STC (V)")
    temp_coef_voc: float = Field(..., description="Coeficiente de temperatura Voc (%/°C)")
    isc: Optional[float] = Field(None, description="Corrente de curto-circuito do módulo STC (A)")
    
    # Coordenadas para buscar temperatura mínima
    latitude: float = Field(..., description="Latitude para buscar dados climáticos")
    longitude: float = Field(..., description="Longitude para buscar dados climáticos")
    
    # Parâmetros críticos para cálculo MPPT
    potencia_saida_ca_w: float = Field(..., description="Potência de saída CA nominal em watts")
    potencia_fv_max_w: Optional[float] = Field(None, description="Potência FV máxima de entrada DC em watts (para cálculo de módulos)")
    tensao_cc_max_v: Optional[float] = Field(default=1000, description="Tensão CC máxima suportada (V)")
    numero_mppt: int = Field(default=2, description="Número de canais MPPT")
    strings_por_mppt: Optional[int] = Field(default=2, description="Número de strings por MPPT")
    corrente_entrada_max_a: Optional[float] = Field(default=20, description="Corrente máxima de entrada por string (A)")
    
    # Parâmetros opcionais para cálculo avançado
    faixa_mppt_min_v: Optional[float] = Field(default=200, description="Tensão mínima MPPT (V)")
    faixa_mppt_max_v: Optional[float] = Field(default=800, description="Tensão máxima MPPT (V)")
    tipo_rede: str = Field(default="Monofásico 220V", description="Tipo de rede")
    
    class Config:
        json_schema_extra = {
            "example": {
                "fabricante": "WEG",
                "modelo": "SIW500H-M",
                "potencia_modulo_w": 550,
                "voc_stc": 49.7,
                "temp_coef_voc": -0.27,
                "latitude": -21.2037,
                "longitude": -50.4364,
                "potencia_saida_ca_w": 5000,
                "potencia_fv_max_w": 7500,
                "tensao_cc_max_v": 600,
                "numero_mppt": 2,
                "strings_por_mppt": 2,
                "corrente_entrada_max_a": 16,
                "isc": 10.5,
                "faixa_mppt_min_v": 200,
                "faixa_mppt_max_v": 580,
                "tipo_rede": "Monofásico 220V"
            }
        }


class MPPTCalculationResponse(BaseModel):
    """Response do cálculo de módulos por MPPT"""
    
    # Resultado principal - apenas os 2 valores necessários
    modulos_por_mppt: int = Field(..., description="Quantidade de módulos recomendada por MPPT")
    modulos_por_string: int = Field(..., description="Quantidade de módulos recomendada por string")
    
    class Config:
        json_schema_extra = {
            "example": {
                "modulos_por_mppt": 5,
                "modulos_por_string": 5
            }
        }


class MPPTCalculationErrorResponse(BaseModel):
    """Response de erro do cálculo de módulos por MPPT"""
    
    success: bool = Field(False, description="Indica se o cálculo foi bem-sucedido")
    error_type: str = Field(..., description="Tipo de erro ocorrido")
    message: str = Field(..., description="Mensagem de erro detalhada")
    details: Optional[Dict[str, Any]] = Field(None, description="Detalhes adicionais do erro")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error_type": "CORRENTE_MPPT_EXCEDIDA",
                "message": "A corrente excede o valor máximo da MPPT, revise o projeto!",
                "details": {
                    "corrente_calculada": 25.0,
                    "corrente_maxima_mppt": 20.0,
                    "strings_por_mppt": 2,
                    "isc_modulo": 10.0
                }
            }
        }