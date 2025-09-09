"""
Models - Modelos Pydantic para requests e responses
"""

from .requests import (
    LocationRequest,
    IrradiationAnalysisRequest,
    ModuleCalculationRequest,
    CacheStatsRequest
)

from .responses import (
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

__all__ = [
    # Request models
    "LocationRequest",
    "IrradiationAnalysisRequest",
    "ModuleCalculationRequest", 
    "CacheStatsRequest",
    
    # Response models - Base components
    "MaxMinValue",
    "IrradiationConfiguration",
    "PeriodAnalysis", 
    "Coordinates",
    "ModuleSystemParameters",
    
    # Response models - Main responses
    "IrradiationAnalysisResponse",
    "ModuleCalculationResponse",
    "HealthCheckResponse",
    "CacheStatsResponse",
    "ErrorResponse",
    "MessageResponse"
]