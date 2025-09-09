"""
Core - Configurações e exceções centrais
"""

from .config import settings
from .exceptions import (
    SolarAPIException,
    ValidationError,
    PVGISError,
    CacheError,
    CalculationError
)

__all__ = [
    "settings",
    "SolarAPIException", 
    "ValidationError",
    "PVGISError",
    "CacheError", 
    "CalculationError"
]