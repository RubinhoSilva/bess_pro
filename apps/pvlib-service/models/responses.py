from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class MaxMinValue(BaseModel):
    """Estrutura para valores máximo e mínimo"""
    
    valor: float = Field(..., description="Valor numérico")
    mes: str = Field(..., description="Nome do mês")
    mes_numero: int = Field(..., ge=1, le=12, description="Número do mês (1-12)")

    class Config:
        schema_extra = {
            "example": {
                "valor": 6.14,
                "mes": "Dezembro", 
                "mes_numero": 12
            }
        }

class IrradiationConfiguration(BaseModel):
    """Configuração da análise de irradiação"""
    
    tipo_irradiacao: str = Field(..., description="Tipo de irradiação analisada")
    tilt: float = Field(..., description="Inclinação utilizada")
    azimuth: float = Field(..., description="Azimute utilizado")
    modelo_decomposicao: Optional[str] = Field(None, description="Modelo de decomposição usado")
    plano_inclinado: bool = Field(..., description="Se foi usada irradiação no plano inclinado")

class PeriodAnalysis(BaseModel):
    """Informações sobre o período de análise"""
    
    inicio: str = Field(..., description="Data de início da análise")
    fim: str = Field(..., description="Data de fim da análise") 
    anos_completos: int = Field(..., description="Número de anos completos analisados")

class Coordinates(BaseModel):
    """Coordenadas geográficas"""
    
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")

class IrradiationAnalysisResponse(BaseModel):
    """Resposta da análise de irradiação solar mensal"""
    
    # Estatísticas principais
    media_anual: float = Field(..., description="Média anual de irradiação (kWh/m²/dia)")
    maximo: MaxMinValue = Field(..., description="Valor máximo e mês correspondente")
    minimo: MaxMinValue = Field(..., description="Valor mínimo e mês correspondente") 
    variacao_sazonal: float = Field(..., description="Variação sazonal em porcentagem")
    
    # Array mensal
    irradiacao_mensal: List[float] = Field(
        ..., 
        min_items=12, 
        max_items=12,
        description="Array com irradiação mensal (Jan a Dez) em kWh/m²/dia"
    )
    
    # Dados detalhados com desvio padrão
    irradiacao_com_desvio: Dict[str, Dict[str, float]] = Field(
        ..., 
        description="Irradiação mensal com média e desvio padrão por mês"
    )
    
    # Configuração da análise
    configuracao: IrradiationConfiguration = Field(..., description="Configuração utilizada na análise")
    
    # Metadados
    coordenadas: Coordinates = Field(..., description="Coordenadas analisadas")
    periodo_analise: PeriodAnalysis = Field(..., description="Período dos dados analisados")
    registros_processados: int = Field(..., description="Número de registros processados")

    class Config:
        schema_extra = {
            "example": {
                "media_anual": 4.14,
                "maximo": {
                    "valor": 6.14,
                    "mes": "Dezembro",
                    "mes_numero": 12
                },
                "minimo": {
                    "valor": 1.88,
                    "mes": "Junho", 
                    "mes_numero": 6
                },
                "variacao_sazonal": 103,
                "irradiacao_mensal": [5.2, 5.8, 5.1, 4.2, 3.1, 1.9, 2.1, 3.4, 4.8, 5.5, 5.9, 6.1],
                "irradiacao_com_desvio": {
                    "Janeiro": {"media": 5.2, "desvio": 0.3},
                    "Fevereiro": {"media": 5.8, "desvio": 0.4}
                },
                "configuracao": {
                    "tipo_irradiacao": "GHI (Horizontal)",
                    "tilt": 0,
                    "azimuth": 0,
                    "modelo_decomposicao": None,
                    "plano_inclinado": False
                },
                "coordenadas": {
                    "lat": -15.7942,
                    "lon": -47.8822
                },
                "periodo_analise": {
                    "inicio": "2005-01-01",
                    "fim": "2020-12-31", 
                    "anos_completos": 16
                },
                "registros_processados": 140256
            }
        }

class ModuleSystemParameters(BaseModel):
    """Parâmetros do sistema de módulos"""
    
    consumo_anual_kwh: float = Field(..., description="Consumo anual em kWh")
    potencia_modulo_w: float = Field(..., description="Potência do módulo em W")
    orientacao: Dict[str, float] = Field(..., description="Orientação (tilt e azimuth)")
    coordenadas: Coordinates = Field(..., description="Coordenadas do sistema")
    modelo_decomposicao: str = Field(..., description="Modelo de decomposição usado")

class SystemCompatibility(BaseModel):
    """Análise de compatibilidade do sistema"""
    
    compatibilidade_tensao: bool = Field(..., description="Se módulo e inversor são compatíveis em tensão")
    strings_recomendadas: int = Field(..., description="Número de strings recomendado")
    modulos_por_string: int = Field(..., description="Módulos por string recomendado")
    utilizacao_inversor: float = Field(..., description="% de utilização da capacidade do inversor")
    margem_seguranca: float = Field(..., description="Margem de segurança do dimensionamento")




# Renomear para ser a versão principal
class ModuleCalculationResponse(BaseModel):
    """Resposta avançada do cálculo de módulos fotovoltaicos"""
    
    # Resultados principais
    num_modulos: int = Field(..., description="Número de módulos necessários")
    potencia_total_kw: float = Field(..., description="Potência total do sistema em kWp")
    energia_total_anual: float = Field(..., description="Geração anual estimada em kWh")
    energia_por_modulo: float = Field(..., description="Energia anual por módulo em kWh")
    cobertura_percentual: float = Field(..., description="Porcentagem de cobertura do consumo")
    
    # Métricas de performance
    fator_capacidade: float = Field(..., description="Fator de capacidade do sistema em %")
    hsp_equivalente_dia: float = Field(..., description="HSP equivalente em horas por dia")
    hsp_equivalente_anual: float = Field(..., description="HSP equivalente em horas por ano")
    pr_medio: float = Field(..., description="Performance Ratio médio do sistema em %")
    yield_especifico: float = Field(..., description="Yield específico em kWh/kWp")
    
    # Análise estatística anual
    energia_anual_std: float = Field(..., description="Desvio padrão da energia anual")
    variabilidade_percentual: float = Field(..., description="Variabilidade percentual entre anos")
    energia_por_ano: Dict[str, float] = Field(..., description="Energia anual por cada ano analisado")
    
    # Análise estatística diária
    energia_diaria_media: Optional[float] = Field(None, description="Energia média diária em kWh/dia")
    energia_diaria_std: Optional[float] = Field(None, description="Desvio padrão da energia diária")
    energia_diaria_min: Optional[float] = Field(None, description="Energia mínima diária em kWh/dia")
    energia_diaria_max: Optional[float] = Field(None, description="Energia máxima diária em kWh/dia")
    
    # Geração mensal
    geracao_mensal: Optional[List[float]] = Field(None, description="Geração mensal estimada em kWh por mês")
    
    # Análises avançadas
    compatibilidade_sistema: SystemCompatibility = Field(..., description="Análise de compatibilidade")
    area_necessaria_m2: float = Field(..., description="Área necessária para instalação (m²)")
    peso_total_kg: float = Field(..., description="Peso total do sistema (kg)")
    economia_anual_co2: float = Field(..., description="Economia anual de CO2 (kg)")
    
    # Parâmetros de entrada completos
    parametros_completos: Dict = Field(..., description="Todos os parâmetros utilizados no cálculo")
    
    # Dados para análises
    dados_processados: int = Field(..., description="Número de registros processados")
    anos_analisados: int = Field(..., description="Número de anos analisados")
    periodo_dados: PeriodAnalysis = Field(..., description="Período dos dados utilizados")

    class Config:
        schema_extra = {
            "example": {
                "num_modulos": 8,
                "potencia_total_kw": 4.32,
                "energia_total_anual": 5289.9,
                "energia_por_modulo": 661.2,
                "cobertura_percentual": 110.2,
                "fator_capacidade": 14.0,
                "hsp_equivalente_dia": 3.4,
                "hsp_equivalente_anual": 1224.5,
                "energia_anual_std": 171.9,
                "variabilidade_percentual": 26.0,
                "energia_por_ano": {
                    "2005": 675.9,
                    "2006": 676.0,
                    "2007": 738.1
                },
                "compatibilidade_sistema": {
                    "compatibilidade_tensao": True,
                    "strings_recomendadas": 2,
                    "modulos_por_string": 4,
                    "utilizacao_inversor": 86.4,
                    "margem_seguranca": 13.6
                },
                "area_necessaria_m2": 20.5,
                "peso_total_kg": 220,
                "economia_anual_co2": 2644.95,
                "parametros_completos": {
                    "consumo_anual_kwh": 4800,
                    "localizacao": {"lat": -15.7942, "lon": -47.8822},
                    "orientacao": {"tilt": 20, "azimuth": 180},
                    "modulo": {"fabricante": "Canadian Solar", "modelo": "CS3W-540MS"},
                    "inversor": {"fabricante": "WEG", "modelo": "SIW500H-M"}
                },
                "dados_processados": 140256,
                "anos_analisados": 16,
                "periodo_dados": {
                    "inicio": "2005-01-01",
                    "fim": "2020-12-31",
                    "anos_completos": 16
                }
            }
        }

class HealthCheckResponse(BaseModel):
    """Resposta do health check"""
    
    status: str = Field(..., description="Status da aplicação")
    version: str = Field(..., description="Versão da aplicação")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp da verificação")
    cache_dir: str = Field(..., description="Diretório de cache")
    uptime_seconds: Optional[float] = Field(None, description="Tempo de atividade em segundos")

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2024-01-15T10:30:00Z",
                "cache_dir": "./cache_pvgis",
                "uptime_seconds": 3600.5
            }
        }

class CacheStatsResponse(BaseModel):
    """Resposta das estatísticas do cache"""
    
    total_files: int = Field(..., description="Número total de arquivos no cache")
    total_size_mb: float = Field(..., description="Tamanho total do cache em MB")
    oldest_file: Optional[str] = Field(None, description="Data do arquivo mais antigo")
    newest_file: Optional[str] = Field(None, description="Data do arquivo mais recente")
    cache_dir: str = Field(..., description="Diretório do cache")
    cache_ttl_hours: int = Field(..., description="TTL do cache em horas")
    max_size_mb: int = Field(..., description="Tamanho máximo permitido em MB")

    class Config:
        schema_extra = {
            "example": {
                "total_files": 25,
                "total_size_mb": 156.7,
                "oldest_file": "2024-01-01T08:00:00Z",
                "newest_file": "2024-01-15T10:30:00Z",
                "cache_dir": "./cache_pvgis",
                "cache_ttl_hours": 168,
                "max_size_mb": 1000
            }
        }

class ErrorResponse(BaseModel):
    """Resposta padrão para erros"""
    
    error: str = Field(..., description="Mensagem de erro")
    details: Optional[Dict[str, Any]] = Field(None, description="Detalhes do erro")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp do erro")
    
    class Config:
        schema_extra = {
            "example": {
                "error": "Erro de validação: Latitude deve estar entre -90 e 90",
                "details": {
                    "field": "lat",
                    "received_value": 95.0
                },
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }

class MessageResponse(BaseModel):
    """Resposta simples com mensagem"""
    
    message: str = Field(..., description="Mensagem de resposta")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp da resposta")
    
    class Config:
        schema_extra = {
            "example": {
                "message": "Cache limpo com sucesso. 15 arquivos removidos.",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }