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
    
    # Coordenadas para buscar temperatura mínima
    latitude: float = Field(..., description="Latitude para buscar dados climáticos")
    longitude: float = Field(..., description="Longitude para buscar dados climáticos")
    
    # Parâmetros críticos para cálculo MPPT
    potencia_saida_ca_w: float = Field(..., description="Potência de saída CA em watts")
    tensao_cc_max_v: Optional[float] = Field(default=1000, description="Tensão CC máxima suportada (V)")
    numero_mppt: int = Field(default=2, description="Número de canais MPPT")
    strings_por_mppt: Optional[int] = Field(default=2, description="Número de strings por MPPT")
    corrente_entrada_max_a: Optional[float] = Field(default=20, description="Corrente máxima de entrada por string (A)")
    
    # Parâmetros opcionais para cálculo avançado
    faixa_mppt_min_v: Optional[float] = Field(default=200, description="Tensão mínima MPPT (V)")
    faixa_mppt_max_v: Optional[float] = Field(default=800, description="Tensão máxima MPPT (V)")
    tipo_rede: str = Field(default="Monofásico 220V", description="Tipo de rede")
    
    class Config:
        schema_extra = {
            "example": {
                "fabricante": "WEG",
                "modelo": "SIW500H-M",
                "potencia_modulo_w": 550,
                "voc_stc": 49.7,
                "temp_coef_voc": -0.27,
                "latitude": -21.2037,
                "longitude": -50.4364,
                "potencia_saida_ca_w": 5000,
                "tensao_cc_max_v": 600,
                "numero_mppt": 2,
                "strings_por_mppt": 2,
                "corrente_entrada_max_a": 16,
                "faixa_mppt_min_v": 200,
                "faixa_mppt_max_v": 580,
                "tipo_rede": "Monofásico 220V"
            }
        }


class MPPTCalculationResponse(BaseModel):
    """Response do cálculo de módulos por MPPT"""
    
    # Resultado principal
    modulos_por_mppt: int = Field(..., description="Quantidade de módulos recomendada por MPPT")
    modulos_total_sistema: int = Field(..., description="Total de módulos no sistema completo")
    
    # Detalhamento técnico
    limitacao_principal: str = Field(..., description="Principal limitação que define a quantidade")
    analise_detalhada: Dict[str, Any] = Field(..., description="Análise técnica detalhada")
    
    # Configuração recomendada
    configuracao_recomendada: Dict[str, Any] = Field(..., description="Configuração ótima do sistema")
    
    # Parâmetros de entrada utilizados
    parametros_entrada: Dict[str, Any] = Field(..., description="Parâmetros utilizados no cálculo")
    
    class Config:
        schema_extra = {
            "example": {
                "modulos_por_mppt": 5,
                "modulos_total_sistema": 10,
                "limitacao_principal": "Configuração padrão - cálculo detalhado será implementado",
                "analise_detalhada": {
                    "limite_tensao": "OK",
                    "limite_corrente": "OK",
                    "limite_potencia": "OK"
                },
                "configuracao_recomendada": {
                    "strings_por_mppt": 2,
                    "modulos_por_string": 5,
                    "total_mppt_utilizados": 2
                },
                "parametros_entrada": {
                    "fabricante": "WEG",
                    "modelo": "SIW500H-M",
                    "numero_mppt": 2
                }
            }
        }