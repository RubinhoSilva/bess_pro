"""
Router para endpoints de cálculo financeiro de Grupo A e B

Este módulo expõe endpoints REST para análise financeira completa de sistemas
fotovoltaicos, suportando tanto consumidores do Grupo B (residencial/baixa tensão)
quanto do Grupo A (comercial/industrial - média e alta tensão).

Funcionalidades:
- Cálculo de autoconsumo instantâneo e remoto
- Aplicação de Fio B e custos de disponibilidade
- Análise de fluxo de caixa e indicadores financeiros
- Suporte a múltiplas unidades consumidoras remotas
- Documentação automática via FastAPI/OpenAPI
"""

from fastapi import APIRouter, HTTPException
from models.shared.financial_models import (
    GrupoBFinancialRequest, 
    GrupoAFinancialRequest,
    ResultadosCodigoBResponse, 
    ResultadosCodigoAResponse
)
from services.financial_grupo_b_service import FinancialGrupoBService
from services.financial_grupo_a_service import FinancialGrupoAService
from core.response_models import SuccessResponse
import logging

router = APIRouter(prefix="/financial", tags=["Financial Grupo A/B"])
logger = logging.getLogger(__name__)

# Instanciar serviços
grupo_b_service = FinancialGrupoBService()
grupo_a_service = FinancialGrupoAService()


@router.post(
    "/calculate-grupo-b",
    response_model=SuccessResponse[ResultadosCodigoBResponse],
    summary="Calcular análise financeira Grupo B",
    description="""
    Calcula análise financeira completa para unidade geradora Grupo B.

    Inclui:
    - Autoconsumo instantâneo
    - Créditos de energia com aplicação de Fio B
    - Custo de disponibilidade
    - Autoconsumo remoto (Grupo B, A Verde, A Azul)
    - Fluxo de caixa (até 25 anos)
    - Indicadores financeiros (VPL, TIR, Payback)
    """
)
async def calculate_grupo_b_financials(input_data: GrupoBFinancialRequest):
    try:
        logger.info(f"[Grupo B] Iniciando cálculo - CAPEX: R$ {input_data.financeiros.capex:,.2f}")

        # Chamar serviço
        resultado = await grupo_b_service.calculate(input_data)

        logger.info("[Grupo B] Cálculo concluído com sucesso")

        return SuccessResponse(
            success=True,
            data=resultado,
            message="Cálculo Grupo B concluído com sucesso"
        )

    except ValueError as e:
        logger.error(f"[Grupo B] Erro de validação: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"[Grupo B] Erro no cálculo: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro no cálculo: {str(e)}")


@router.post(
    "/calculate-grupo-a",
    response_model=SuccessResponse[ResultadosCodigoAResponse],
    summary="Calcular análise financeira Grupo A",
    description="""
    Calcula análise financeira completa para unidade geradora Grupo A (Verde).

    Inclui:
    - Autoconsumo simultâneo (economia imediata)
    - Créditos separados por período (ponta/fora-ponta)
    - Fator de equivalência entre períodos
    - Autoconsumo remoto (Grupo B, A Verde, A Azul)
    - Fluxo de caixa (até 25 anos)
    - Indicadores financeiros (VPL, TIR, Payback)
    - Análise de sensibilidade
    """
)
async def calculate_grupo_a_financials(input_data: GrupoAFinancialRequest):
    try:
        logger.info(f"[Grupo A] Iniciando cálculo - CAPEX: R$ {input_data.financeiros.capex:,.2f}")

        # Chamar serviço
        resultado = await grupo_a_service.calculate(input_data)

        logger.info("[Grupo A] Cálculo concluído com sucesso")

        return SuccessResponse(
            success=True,
            data=resultado,
            message="Cálculo Grupo A concluído com sucesso"
        )

    except ValueError as e:
        logger.error(f"[Grupo A] Erro de validação: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"[Grupo A] Erro no cálculo: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro no cálculo: {str(e)}")