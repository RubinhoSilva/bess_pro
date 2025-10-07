"""BESS (Battery Energy Storage System) models"""

# Modelos de componentes compartilhados
from .requests import (
    TarifaEnergia,
    PerfilConsumo,
    BessDimensioningRequest,
    BessSimulationRequest,
    BessDegradationRequest,
)

from .responses import (
    BessDimensioningResponse,
    BessSimulationResponse,
    BessDegradationResponse,
)

# Modelos híbridos (Solar + BESS)
from .hybrid_requests import (
    HybridDimensioningRequest,
)

from .hybrid_responses import (
    HybridDimensioningResponse,
)

__all__ = [
    # Componentes compartilhados
    "TarifaEnergia",
    "PerfilConsumo",

    # BESS standalone - Requests
    "BessDimensioningRequest",
    "BessSimulationRequest",
    "BessDegradationRequest",

    # BESS standalone - Responses
    "BessDimensioningResponse",
    "BessSimulationResponse",
    "BessDegradationResponse",

    # Híbrido (Solar + BESS) - Requests
    "HybridDimensioningRequest",

    # Híbrido (Solar + BESS) - Responses
    "HybridDimensioningResponse",
]
