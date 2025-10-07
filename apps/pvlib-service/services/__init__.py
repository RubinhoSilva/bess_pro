"""
Services - Lógica de negócio e integração com APIs externas
"""

from .pvgis_service import PVGISService, pvgis_service
from .nasa_service import NASAService, nasa_service
from .solar_service import SolarCalculationService
from .irradiation_service import IrradiationService, irradiation_service

__all__ = [
    # Classes
    "PVGISService",
    "NASAService",
    "SolarCalculationService",
    "IrradiationService",

    # Instâncias singleton
    "pvgis_service",
    "nasa_service",
    "irradiation_service"
]