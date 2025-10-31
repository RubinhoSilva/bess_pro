from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path
from typing import List
import os

class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Informações do projeto
    PROJECT_NAME: str = Field(default="Solar Energy API", description="Nome do projeto")
    PROJECT_DESCRIPTION: str = Field(
        default="API para análise de irradiação solar e dimensionamento de sistemas fotovoltaicos",
        description="Descrição do projeto"
    )
    VERSION: str = Field(default="1.0.0", description="Versão da API")
    
    # Configurações do servidor
    HOST: str = Field(default="0.0.0.0", description="Host do servidor")
    PORT: int = Field(default=8000, description="Porta do servidor")
    DEBUG: bool = Field(default=False, description="Modo debug")
    
    # API versioning
    API_V1_STR: str = Field(default="/api/v1", description="Prefixo da API v1")
    
    # CORS
    ALLOWED_HOSTS: List[str] = Field(
        default=["*"], 
        description="Hosts permitidos para CORS"
    )
    
    # Cache e armazenamento
    CACHE_DIR: Path = Field(
        default_factory=lambda: Path("/tmp/cache_pvgis"),
        description="Diretório para cache dos dados PVGIS"
    )
    
    # Configurações PVGIS
    PVGIS_BASE_URL: str = Field(
        default="https://re.jrc.ec.europa.eu/api/v5_2",
        description="URL base da API PVGIS"
    )
    PVGIS_TIMEOUT: int = Field(default=120, description="Timeout para requisições PVGIS (segundos)")
    PVGIS_START_YEAR: int = Field(default=2005, description="Ano inicial dos dados PVGIS")
    PVGIS_END_YEAR: int = Field(default=2020, description="Ano final dos dados PVGIS")
    
    # Limites de validação
    MAX_LATITUDE: float = Field(default=90.0, description="Latitude máxima permitida")
    MIN_LATITUDE: float = Field(default=-90.0, description="Latitude mínima permitida")
    MAX_LONGITUDE: float = Field(default=180.0, description="Longitude máxima permitida")
    MIN_LONGITUDE: float = Field(default=-180.0, description="Longitude mínima permitida")
    MAX_TILT: float = Field(default=90.0, description="Inclinação máxima permitida")
    MIN_TILT: float = Field(default=0.0, description="Inclinação mínima permitida")
    MAX_AZIMUTH: float = Field(default=360.0, description="Azimute máximo permitido")
    MIN_AZIMUTH: float = Field(default=0.0, description="Azimute mínimo permitido")
    MAX_MODULE_POWER: float = Field(default=1000.0, description="Potência máxima do módulo (W)")
    MIN_MODULE_POWER: float = Field(default=100.0, description="Potência mínima do módulo (W)")
    MAX_CONSUMPTION: float = Field(default=100000.0, description="Consumo máximo anual (kWh)")
    MIN_CONSUMPTION: float = Field(default=100.0, description="Consumo mínimo anual (kWh)")
    
    # Rate limiting (para implementação futura)
    RATE_LIMIT_REQUESTS: int = Field(default=100, description="Requisições por minuto por IP")
    RATE_LIMIT_WINDOW: int = Field(default=60, description="Janela de rate limiting (segundos)")
    
    # Configurações de cache
    CACHE_TTL_HOURS: int = Field(default=24*7, description="TTL do cache em horas (padrão: 1 semana)")
    MAX_CACHE_SIZE_MB: int = Field(default=1000, description="Tamanho máximo do cache em MB")
    
    # Geohash cache configuration
    GEOHASH_PRECISION: int = Field(default=5, description="Geohash precision (5 = ~4.9km cells)")
    CACHE_RADIUS_KM: float = Field(default=15.0, description="Maximum distance for cache hits (km)")
    PVGIS_CACHE_TTL_DAYS: int = Field(default=30, description="PVGIS cache TTL in days")
    
    # Weather data source configuration
    WEATHER_DATA_SOURCE_DEFAULT: str = Field(
        default="pvgis",
        description="Default weather data source (pvgis or nasa)"
    )
    WEATHER_DATA_FALLBACK_ENABLED: bool = Field(
        default=True,
        description="Enable fallback to alternative data source on failure"
    )
    
    # NASA POWER configuration
    NASA_POWER_API_TIMEOUT: int = Field(
        default=60,
        description="NASA POWER API timeout in seconds"
    )
    NASA_POWER_YEARS_BACK: int = Field(
        default=2,
        description="Number of years of historical data to fetch from NASA POWER (max 2 for hourly JSON)"
    )
    NASA_POWER_API: str = Field(
        default="SolarResource",
        description="NASA POWER API endpoint (SolarResource or Renewable)"
    )
    NASA_POWER_TEMPORAL: str = Field(
        default="hourly",
        description="NASA POWER temporal resolution (hourly, daily, monthly)"
    )
    NASA_POWER_DATASET: str = Field(
        default="PSM3",
        description="NASA POWER dataset name (PSM3 or TMY)"
    )
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Nível de log")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Formato do log"
    )
    
    # Validações de dados
    GHI_MAX_VALUE: float = Field(default=1500.0, description="Valor máximo válido para GHI (W/m²)")
    GHI_MIN_VALUE: float = Field(default=0.0, description="Valor mínimo válido para GHI (W/m²)")
    TEMP_MAX_VALUE: float = Field(default=60.0, description="Temperatura máxima válida (°C)")
    TEMP_MIN_VALUE: float = Field(default=-50.0, description="Temperatura mínima válida (°C)")
    WIND_MAX_VALUE: float = Field(default=50.0, description="Velocidade máxima do vento válida (m/s)")
    WIND_MIN_VALUE: float = Field(default=0.0, description="Velocidade mínima do vento válida (m/s)")
    
    # Configurações de propostas
    PROPOSALS_STORAGE_DIR: str = Field(
        default="./storage/proposals",
        description="Diretório para armazenamento de propostas"
    )
    DEFAULT_LOGO_URL: str = Field(
        default="https://via.placeholder.com/150x80/0066cc/ffffff?text=Logo",
        description="URL padrão para logo da empresa"
    )
    MAX_PROPOSAL_SIZE_MB: int = Field(
        default=10,
        description="Tamanho máximo do arquivo de proposta em MB"
    )
    
    # Configurações de S3
    USE_S3_STORAGE: bool = Field(
        default=False,
        description="Usar S3 para armazenamento de propostas (produção)"
    )
    AWS_ACCESS_KEY_ID: str = Field(
        default="",
        description="AWS Access Key ID para S3"
    )
    AWS_SECRET_ACCESS_KEY: str = Field(
        default="",
        description="AWS Secret Access Key para S3"
    )
    AWS_REGION: str = Field(
        default="us-east-1",
        description="Região AWS"
    )
    S3_BUCKET_NAME: str = Field(
        default="",
        description="Nome do bucket S3 para armazenar propostas"
    )
    S3_PROPOSALS_PREFIX: str = Field(
        default="proposals/",
        description="Prefixo para arquivos de propostas no S3"
    )
    S3_PRESIGNED_URL_EXPIRATION: int = Field(
        default=3600,
        description="Validade da URL pré-assinada em segundos (padrão: 1 hora)"
    )
    AWS_CLOUDFRONT_URL: str = Field(
        default="",
        description="URL do CloudFront para URLs diretas (sem presigned)"
    )
    
    # Configurações de fontes
    FONTS_DIR: str = Field(
        default="/usr/share/fonts/truetype/dejavu",
        description="Diretório de fontes para PDF"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Converter CACHE_DIR para Path se for string
        if isinstance(self.CACHE_DIR, str):
            self.CACHE_DIR = Path(self.CACHE_DIR)
        
        # Criar diretório de cache se não existir
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Instância global das configurações
settings = Settings()