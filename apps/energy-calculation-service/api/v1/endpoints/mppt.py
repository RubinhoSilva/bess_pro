from fastapi import APIRouter, Depends, HTTPException
from models.solar.mppt_models import MPPTCalculationRequest, MPPTCalculationResponse, MPPTCalculationErrorResponse
from services.solar.mppt_service import mppt_service
from core.exceptions import ValidationError, CalculationError
from api.dependencies import rate_limit_dependency, log_request_dependency
import logging
import json
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/calculate-modules-per-mppt", response_model=MPPTCalculationResponse)
async def calculate_modules_per_mppt(
    request: MPPTCalculationRequest,
    _: None = Depends(rate_limit_dependency),
    req_log: None = Depends(log_request_dependency)
):
    """
    Calcula quantos módulos podem ser conectados por MPPT

    Este endpoint recebe dados de um inversor e calcula a quantidade
    ótima de módulos fotovoltaicos que podem ser conectados em cada
    canal MPPT, considerando limitações de tensão, corrente e potência.

    Args:
        request: Dados técnicos do inversor

    Returns:
        MPPTCalculationResponse: Resultado do cálculo com recomendações

    Raises:
        HTTPException: Erro de validação ou cálculo
    """

    try:
        # Executar cálculo
        result = mppt_service.calculate_modules_per_mppt(request)

        # Verificar se o resultado é um erro estruturado
        if isinstance(result, MPPTCalculationErrorResponse):
            logger.error(f"Erro no cálculo MPPT: {result.error_type} - {result.message}")
            
            # Retornar HTTP 422 com o erro estruturado
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": result.error_type,
                    "message": result.message,
                    "details": result.details
                }
            )
        return result

    except ValidationError as e:
        logger.error(f"Erro de validação no cálculo MPPT: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except CalculationError as e:
        logger.error(f"Erro no cálculo MPPT: {e}")
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        logger.error(f"Erro interno no cálculo MPPT: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno do servidor")