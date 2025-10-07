"""
Endpoint para cálculo de sistemas solares multi-inversor
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging

from models.requests import SolarSystemCalculationRequest
from services.solar_service import SolarCalculationService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/solar",
    tags=["Solar System"],
    responses={
        400: {"description": "Erro de validação"},
        422: {"description": "Erro de processamento"},
        500: {"description": "Erro interno do servidor"}
    }
)

@router.post(
    "/calculate",
    summary="Cálculo de sistema solar multi-inversor",
    description="Calcula sistema fotovoltaico completo usando pvlib"
)
async def calculate_solar_system(request: SolarSystemCalculationRequest):
    """
    Endpoint para cálculo de sistema solar multi-inversor
    """

    try:
        logger.info(f"Calculando sistema solar para lat={request.lat}, lon={request.lon}")

        result = SolarCalculationService.calculate(request)

        logger.info(f"Cálculo concluído com sucesso")

        return result

    except ValueError as ve:
        logger.error(f"Erro de validação: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Erro interno: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
