from fastapi import APIRouter, Depends, HTTPException
from models.mppt_models import MPPTCalculationRequest, MPPTCalculationResponse
from services.mppt_service import mppt_service
from core.exceptions import ValidationError, CalculationError
from api.dependencies import rate_limit_dependency, log_request_dependency
import logging

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
        logger.info(f"Recebida requisição de cálculo MPPT para {request.fabricante} {request.modelo}")
        
        # Executar cálculo
        result = mppt_service.calculate_modules_per_mppt(request)
        
        logger.info(f"Cálculo MPPT concluído: {result.modulos_por_mppt} módulos por MPPT")
        
        return result
        
    except ValidationError as e:
        logger.error(f"Erro de validação no cálculo MPPT: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except CalculationError as e:
        logger.error(f"Erro no cálculo MPPT: {e}")
        raise HTTPException(status_code=422, detail=str(e))
        
    except Exception as e:
        logger.error(f"Erro interno no cálculo MPPT: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@router.get("/health")
async def mppt_health():
    """Health check do serviço MPPT"""
    return {
        "service": "MPPT Calculation Service",
        "status": "healthy",
        "version": "1.0.0"
    }