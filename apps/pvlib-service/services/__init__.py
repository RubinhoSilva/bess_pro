"""
Services - Lógica de negócio e integração com APIs externas
"""

from .pvgis_service import PVGISService, pvgis_service
from .solar_service import SolarService, solar_service
from .module_service import ModuleService, module_service

__all__ = [
    # Classes
    "PVGISService",
    "SolarService", 
    "ModuleService",
    
    # Instâncias singleton
    "pvgis_service",
    "solar_service",
    "module_service"
]