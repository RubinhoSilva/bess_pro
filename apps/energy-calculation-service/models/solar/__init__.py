"""Solar PV system models (requests and responses)"""

from .requests import (
    LocationRequest,
    IrradiationAnalysisRequest,
    SolarModuleData,
    PerdasSistema,
    ModuloSolar,
    InversorData,
    OrientacaoModulos,
    InversorConfig,
    SolarSystemCalculationRequest,
    CacheStatsRequest,
)

from .responses import (
    MaxMinValue,
    IrradiationConfiguration,
    PeriodAnalysis,
    Coordinates,
    IrradiationAnalysisResponse,
    ModuleSystemParameters,
    SystemCompatibility,
    InverterResults,
    AguaTelhadoResults,
    HealthCheckResponse,
    CacheStatsResponse,
    ErrorResponse,
    MessageResponse,
)

from .mppt_models import (
    MPPTCalculationRequest,
    MPPTCalculationResponse,
)

__all__ = [
    # Requests
    "LocationRequest",
    "IrradiationAnalysisRequest",
    "SolarModuleData",
    "PerdasSistema",
    "ModuloSolar",
    "InversorData",
    "OrientacaoModulos",
    "InversorConfig",
    "SolarSystemCalculationRequest",
    "CacheStatsRequest",
    # Responses
    "MaxMinValue",
    "IrradiationConfiguration",
    "PeriodAnalysis",
    "Coordinates",
    "IrradiationAnalysisResponse",
    "ModuleSystemParameters",
    "SystemCompatibility",
    "InverterResults",
    "AguaTelhadoResults",
    "HealthCheckResponse",
    "CacheStatsResponse",
    "ErrorResponse",
    "MessageResponse",
    # MPPT Models
    "MPPTCalculationRequest",
    "MPPTCalculationResponse",
]
