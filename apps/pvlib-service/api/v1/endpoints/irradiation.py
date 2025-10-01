from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from models.requests import IrradiationAnalysisRequest
from models.responses import IrradiationAnalysisResponse, ErrorResponse
from services import solar_service
from core.exceptions import SolarAPIException
from api.dependencies import rate_limit_dependency, log_request_dependency

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/irradiation", tags=["Análise de Irradiação"])

@router.post(
    "/monthly",
    response_model=IrradiationAnalysisResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Erro de validação"},
        502: {"model": ErrorResponse, "description": "Erro PVGIS"},
        500: {"model": ErrorResponse, "description": "Erro interno"}
    },
    summary="Análise de irradiação solar mensal",
    description="""
    Analisa a irradiação solar mensal para uma localização específica.

    **Funcionalidades:**
    - Irradiação horizontal (GHI) quando tilt=0 e azimuth=0
    - Irradiação no plano inclinado (POA) quando tilt>0 ou azimuth≠0
    - Dados históricos de 16 anos (2005-2020)
    - Estatísticas mensais completas com variabilidade
    - Múltiplas fontes de dados com fallback automático

    **Fontes de dados:**
    - **pvgis**: PVGIS (default) - Dados para Europa, África, Ásia
    - **nasa**: NASA POWER - Cobertura global

    **Orientação dos módulos:**
    - **Azimute**: 0°=Norte, 90°=Leste, 180°=Sul, 270°=Oeste
    - **Inclinação**: 0°=Horizontal, 90°=Vertical

    **Modelos de decomposição:**
    - **erbs**: Recomendado para uso geral
    - **disc**: Bom para dados de alta qualidade
    - **dirint**: Para dados horários precisos
    """
)
async def analyze_monthly_irradiation(
    request: IrradiationAnalysisRequest,
    _: None = Depends(rate_limit_dependency),
    req_log: None = Depends(log_request_dependency)
):
    """Analisa irradiação solar mensal para coordenadas específicas"""
    
    try:
        logger.info(f"Analisando irradiação mensal para {request.lat}, {request.lon}")
        
        result = solar_service.analyze_monthly_irradiation(request)
        
        logger.info(f"Análise concluída: {result.media_anual} kWh/m²/dia média anual")
        
        return result
        
    except SolarAPIException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado na análise de irradiação: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno no servidor. Tente novamente."
        )

@router.get(
    "/monthly",
    response_model=IrradiationAnalysisResponse,
    summary="Análise de irradiação via query parameters",
    description="Versão GET do endpoint de análise mensal. Útil para testes rápidos."
)
async def analyze_monthly_irradiation_get(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    tilt: float = Query(0, ge=0, le=90, description="Inclinação em graus"),
    azimuth: float = Query(0, ge=0, le=360, description="Azimute em graus"),
    data_source: str = Query("pvgis", description="Fonte de dados (pvgis ou nasa)"),
    modelo_decomposicao: str = Query("erbs", description="Modelo de decomposição"),
    _: None = Depends(rate_limit_dependency)
):
    """Versão GET da análise de irradiação mensal"""

    request = IrradiationAnalysisRequest(
        lat=lat, lon=lon, tilt=tilt,
        azimuth=azimuth, data_source=data_source,
        modelo_decomposicao=modelo_decomposicao
    )

    return await analyze_monthly_irradiation(request, _, None)