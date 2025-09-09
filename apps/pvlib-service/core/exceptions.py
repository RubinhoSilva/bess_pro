from datetime import datetime
from typing import Optional, Dict, Any

class SolarAPIException(Exception):
    """Exceção base para a Solar API"""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.timestamp = datetime.utcnow()
        super().__init__(self.message)

class ValidationError(SolarAPIException):
    """Erro de validação de dados"""
    
    def __init__(self, message: str, field: str = None, value: Any = None):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["received_value"] = value
            
        super().__init__(
            message=f"Erro de validação: {message}",
            status_code=422,
            details=details
        )

class PVGISError(SolarAPIException):
    """Erro relacionado à API PVGIS"""
    
    def __init__(self, message: str, url: str = None):
        details = {}
        if url:
            details["pvgis_url"] = url
            
        super().__init__(
            message=f"Erro PVGIS: {message}",
            status_code=502,
            details=details
        )

class CacheError(SolarAPIException):
    """Erro relacionado ao cache"""
    
    def __init__(self, message: str, cache_path: str = None):
        details = {}
        if cache_path:
            details["cache_path"] = cache_path
            
        super().__init__(
            message=f"Erro de cache: {message}",
            status_code=500,
            details=details
        )

class CalculationError(SolarAPIException):
    """Erro de cálculo"""
    
    def __init__(self, message: str, calculation_type: str = None):
        details = {}
        if calculation_type:
            details["calculation_type"] = calculation_type
            
        super().__init__(
            message=f"Erro de cálculo: {message}",
            status_code=500,
            details=details
        )
    