
"""
Endpoints v1 - Endpoints específicos da API v1
"""

from . import irradiation
from . import modules 
from . import admin

__all__ = [
    "irradiation",
    "modules",
    "admin"
]
