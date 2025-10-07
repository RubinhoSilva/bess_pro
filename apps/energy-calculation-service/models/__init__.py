"""
Models - Modelos Pydantic para requests e responses

Organized by domain:
- solar: Solar PV system models
- bess: Battery Energy Storage System models
- hybrid: Hybrid system (Solar + BESS) models
- shared: Shared models (financial, tariffs, etc.)
"""

# Solar models
from .solar.requests import (
    LocationRequest,
    IrradiationAnalysisRequest,
    SolarSystemCalculationRequest,
    CacheStatsRequest
)

from .solar.responses import (
    MaxMinValue,
    IrradiationConfiguration,
    PeriodAnalysis,
    Coordinates,
    IrradiationAnalysisResponse,
    ModuleSystemParameters,
    ModuleCalculationResponse,
    HealthCheckResponse,
    CacheStatsResponse,
    ErrorResponse,
    MessageResponse
)

from .solar.mppt_models import (
    MPPTCalculationRequest,
    MPPTCalculationResponse,
)

# BESS models
from .bess import (
    TarifaEnergia,
    PerfilConsumo,
    BessDimensioningRequest,
    BessSimulationRequest,
    BessDegradationRequest,
    BessDimensioningResponse,
    BessSimulationResponse,
    BessDegradationResponse,
)

# Shared models
from .shared.financial_models import (
    FinancialInput,
    AdvancedFinancialResults,
)

__all__ = [
    # Solar Request models
    "LocationRequest",
    "IrradiationAnalysisRequest",
    "SolarSystemCalculationRequest",
    "CacheStatsRequest",
    "MPPTCalculationRequest",

    # Solar Response models - Base components
    "MaxMinValue",
    "IrradiationConfiguration",
    "PeriodAnalysis",
    "Coordinates",
    "ModuleSystemParameters",

    # Solar Response models - Main responses
    "IrradiationAnalysisResponse",
    "MPPTCalculationResponse",
    "HealthCheckResponse",
    "CacheStatsResponse",
    "ErrorResponse",
    "MessageResponse",

    # BESS models - Components
    "TarifaEnergia",
    "PerfilConsumo",

    # BESS models - Requests
    "BessDimensioningRequest",
    "BessSimulationRequest",
    "BessDegradationRequest",

    # BESS models - Responses
    "BessDimensioningResponse",
    "BessSimulationResponse",
    "BessDegradationResponse",

    # Shared models
    "FinancialInput",
    "AdvancedFinancialResults",
]