from fastapi import APIRouter, Depends, HTTPException, Query
import logging

from models.requests import ModuleCalculationRequest
from models.responses import ModuleCalculationResponse, ErrorResponse
from services import module_service
from core.exceptions import SolarAPIException
from api.dependencies import rate_limit_dependency, log_request_dependency

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/modules", tags=["Cálculo de Módulos"])

@router.post(
    "/calculate",
    response_model=ModuleCalculationResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Erro de validação"},
        502: {"model": ErrorResponse, "description": "Erro PVGIS"},
        500: {"model": ErrorResponse, "description": "Erro interno"}
    },
    summary="Cálculo avançado de módulos fotovoltaicos com dados completos",
    description="""
    Calcula o número de módulos fotovoltaicos necessários usando dados completos do módulo e inversor.
    
    **Processo de cálculo:**
    1. Busca dados meteorológicos históricos (16 anos)
    2. Faz decomposição GHI → DNI/DHI usando modelo especificado
    3. Executa simulação completa com ModelChain usando parâmetros reais do equipamento
    4. Calcula média anual e variabilidade considerando perdas do sistema
    5. Dimensiona sistema com fator de segurança aplicado
    
    **Análises avançadas:**
    - Compatibilidade entre módulo e inversor (tensão, corrente, MPPT)
    - Cálculo de strings e módulos por string otimizado
    - Área necessária baseada nas dimensões reais do módulo
    - Peso total do sistema
    - Economia de CO2 estimada
    - Utilização e margem de segurança do inversor
    
    **Dados de entrada:**
    - Módulo: fabricante, modelo, potência, dimensões, características elétricas, coeficientes de temperatura
    - Inversor: fabricante, modelo, potência CA/CC, MPPT, faixas de tensão, eficiência
    - Sistema: consumo, localização, orientação, perdas, fator de segurança
    
    **Considerações técnicas:**
    - Usa parâmetros reais dos equipamentos para simulação precisa
    - Considera coeficientes de temperatura específicos do módulo
    - Aplica perdas configuráveis do sistema
    - Análise de compatibilidade técnica detalhada
    """
)
async def calculate_required_modules(
    request: ModuleCalculationRequest,
    _: None = Depends(rate_limit_dependency),
    req_log: None = Depends(log_request_dependency)
):
    """Calcula módulos fotovoltaicos necessários"""
    
    try:
        logger.info(f"Calculando módulos para {request.lat}, {request.lon} - "
                   f"{request.modulo.fabricante} {request.modulo.modelo} {request.modulo.potencia_nominal_w}W, "
                   f"{request.consumo_anual_kwh} kWh/ano")
        
        result = module_service.calculate_required_modules(request)
        
        logger.info(f"Cálculo concluído: {result.num_modulos} módulos, "
                   f"{result.potencia_total_kw} kWp")
        
        return result
        
    except SolarAPIException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado no cálculo de módulos: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno no servidor. Tente novamente."
        )

