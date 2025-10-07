"""
Services - Lógica de negócio e integração com APIs externas

Organized by domain:
- solar: Solar PV system calculations
- bess: Battery Energy Storage System calculations
- hybrid: Hybrid system (Solar + BESS) calculations
- shared: Shared services (financial, tariffs, etc.)
"""

# Solar services
from .solar.pvgis_service import PVGISService, pvgis_service
from .solar.nasa_service import NASAService, nasa_service
from .solar.solar_service import SolarCalculationService
from .solar.irradiation_service import IrradiationService, irradiation_service
from .solar.mppt_service import MPPTService, mppt_service

# Shared services
from .shared.financial_service import FinancialCalculationService

__all__ = [
    # Solar Classes
    "PVGISService",
    "NASAService",
    "SolarCalculationService",
    "IrradiationService",
    "MPPTService",

    # Shared Classes
    "FinancialCalculationService",

    # Instâncias singleton
    "pvgis_service",
    "nasa_service",
    "irradiation_service",
    "mppt_service",
]