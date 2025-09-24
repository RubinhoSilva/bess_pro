"""
Endpoints para cálculos de sistemas multi-inversor
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional
import logging

from models.requests import MultiInverterCalculationRequest
from models.responses import MultiInverterCalculationResponse, ErrorResponse
from services.multi_inverter_service import MultiInverterCalculationService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Router para multi-inversor
router = APIRouter(
    prefix="/multi-inverter",
    tags=["Multi-Inversor"],
    responses={
        400: {"model": ErrorResponse, "description": "Erro de validação"},
        422: {"model": ErrorResponse, "description": "Erro de processamento"},
        500: {"model": ErrorResponse, "description": "Erro interno do servidor"}
    }
)

@router.post(
    "/calculate",
    response_model=MultiInverterCalculationResponse,
    summary="Cálculo de sistema multi-inversor",
    description="""
    Calcula sistema fotovoltaico completo com múltiplos inversores e múltiplas águas de telhado.
    
    **Características:**
    - Suporte a múltiplos inversores diferentes
    - Configuração por água de telhado (orientação/inclinação específicas)
    - Associação de águas a canais MPPT específicos
    - Validação de compatibilidade do sistema
    - Análise de performance por inversor e por água
    - Cálculos de oversizing e eficiência
    
    **Parâmetros necessários:**
    - Localização (lat/lon)
    - Consumo anual
    - Dados completos do módulo solar
    - Lista de inversores selecionados com quantidades
    - Lista de águas de telhado com associações MPPT
    
    **Validações realizadas:**
    - Compatibilidade tensão/corrente
    - Disponibilidade de canais MPPT
    - Oversizing adequado (80-150%)
    - Conflitos de atribuição MPPT
    """,
    response_description="Resultados completos do sistema multi-inversor"
)
async def calculate_multi_inverter_system(
    request: MultiInverterCalculationRequest,
    background_tasks: BackgroundTasks
) -> MultiInverterCalculationResponse:
    """
    Endpoint principal para cálculo de sistemas multi-inversor
    """
    
    try:
        logger.info(f"Iniciando cálculo multi-inversor para {len(request.inversores_selecionados)} inversor(es) e {len(request.aguas_telhado)} água(s)")
        
        # Validações básicas
        if not request.inversores_selecionados:
            raise HTTPException(
                status_code=400,
                detail="Pelo menos um inversor deve ser selecionado"
            )
        
        if not request.aguas_telhado:
            raise HTTPException(
                status_code=400,
                detail="Pelo menos uma água de telhado deve ser configurada"
            )
        
        # Verificar se todas as águas têm MPPT associado
        for agua in request.aguas_telhado:
            if not agua.inversor_id or agua.mppt_numero is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Água '{agua.nome}' deve ter um MPPT associado"
                )
        
        # Calcular sistema
        result = MultiInverterCalculationService.calculate_multi_inverter_system(request)
        
        # Log do resultado
        logger.info(f"Cálculo concluído: {result.num_modulos_total} módulos, {result.potencia_total_dc_kw:.1f}kWp, {result.energia_total_anual:.0f}kWh/ano")
        
        # Adicionar tarefa em background para logging adicional se necessário
        background_tasks.add_task(
            _log_calculation_details,
            request.lat,
            request.lon,
            len(request.inversores_selecionados),
            len(request.aguas_telhado),
            result.energia_total_anual
        )
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except ValueError as ve:
        logger.error(f"Erro de validação: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Erro interno no cálculo multi-inversor: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno no cálculo: {str(e)}"
        )

@router.get(
    "/validate-system",
    summary="Validar compatibilidade do sistema",
    description="""
    Valida a compatibilidade de um sistema multi-inversor sem realizar cálculos completos.
    
    **Validações realizadas:**
    - Disponibilidade de canais MPPT
    - Compatibilidade de tensões
    - Conflitos de atribuição MPPT
    - Oversizing adequado
    
    Útil para validação em tempo real na interface.
    """,
    response_description="Status de compatibilidade e alertas"
)
async def validate_system_compatibility(
    inversores_json: str,
    aguas_json: str,
    modulo_json: str
) -> dict:
    """
    Endpoint para validação rápida de compatibilidade (via query parameters)
    """
    
    try:
        import json
        
        # Parse dos parâmetros JSON
        inversores_data = json.loads(inversores_json)
        aguas_data = json.loads(aguas_json)
        modulo_data = json.loads(modulo_json)
        
        # Converter para objetos Pydantic
        from models.requests import SelectedInverterData, AguaTelhadoData, SolarModuleData
        
        inversores = [SelectedInverterData(**inv) for inv in inversores_data]
        aguas = [AguaTelhadoData(**agua) for agua in aguas_data]
        modulo = SolarModuleData(**modulo_data)
        
        # Validar compatibilidade
        compatibility = MultiInverterCalculationService._validate_system_compatibility(
            inversores, aguas, modulo
        )
        
        return {
            "compativel": compatibility.sistema_compativel,
            "alertas": compatibility.alertas,
            "total_potencia_dc_w": compatibility.total_potencia_dc_w,
            "total_potencia_ca_w": compatibility.total_potencia_ca_w,
            "oversizing_global": compatibility.oversizing_global,
            "mppts_utilizados": compatibility.total_mppts_utilizados,
            "mppts_disponiveis": compatibility.total_mppts_disponiveis
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON inválido nos parâmetros")
    except Exception as e:
        logger.error(f"Erro na validação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na validação: {str(e)}")

@router.get(
    "/system-info",
    summary="Informações do sistema multi-inversor",
    description="Retorna informações sobre capacidades e limitações do sistema multi-inversor"
)
async def get_system_info():
    """
    Informações sobre o sistema multi-inversor
    """
    
    return {
        "version": "1.0.0",
        "capacidades": {
            "max_inversores": 10,
            "max_aguas_telhado": 50,
            "max_potencia_sistema_kw": 1000,
            "orientacoes_suportadas": "0-360 graus",
            "inclinacoes_suportadas": "0-90 graus",
            "mppts_por_inversor": "1-12"
        },
        "validacoes": [
            "Compatibilidade de tensões",
            "Disponibilidade de MPPTs",
            "Oversizing adequado (80-150%)",
            "Conflitos de atribuição",
            "Limites de potência"
        ],
        "metricas_calculadas": [
            "Energia anual por água/inversor",
            "Performance Ratio por seção",
            "Fator de capacidade global",
            "Oversizing por inversor",
            "Utilização de capacity",
            "Economia de CO2"
        ]
    }

async def _log_calculation_details(
    lat: float, 
    lon: float, 
    num_inversores: int,
    num_aguas: int,
    energia_anual: float
):
    """
    Tarefa em background para logging detalhado
    """
    
    try:
        logger.info(
            f"Detalhes do cálculo - "
            f"Localização: {lat:.4f},{lon:.4f} | "
            f"Inversores: {num_inversores} | "
            f"Águas: {num_aguas} | "
            f"Energia: {energia_anual:.0f} kWh/ano"
        )
    except Exception as e:
        logger.error(f"Erro no logging em background: {e}")