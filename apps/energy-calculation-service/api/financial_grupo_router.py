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

# Configurar logger detalhado para o router
router = APIRouter(prefix="/financial", tags=["Financial Grupo A/B"])
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Adicionar handler para arquivo de log do router
file_handler = logging.FileHandler('debug_logs/financial_router_detailed.log', mode='a')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

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
        logger.info("="*80)
        logger.info("[ENDPOINT GRUPO B] INÍCIO DO PROCESSAMENTO DA REQUISIÇÃO")
        logger.info("="*80)
        
        # Log JSON BRUTO recebido (antes da validação Pydantic)
        import json
        logger.info("JSON BRUTO RECEBIDO (exatamente como chegou):")
        logger.info(json.dumps(input_data.model_dump(), indent=2, ensure_ascii=False))
        
        # Log detalhado do payload recebido
        logger.info("PAYLOAD COMPLETO RECEBIDO:")
        payload_dict = input_data.model_dump()
        logger.info(f"Tipo do payload: {type(payload_dict)}")
        
        # Log estrutura principal
        logger.info("ESTRUTURA PRINCIPAL:")
        for key, value in payload_dict.items():
            logger.info(f"  {key}: {type(value)} - {str(value)[:100]}...")
        
        # Log detalhado dos financeiros
        if 'financeiros' in payload_dict:
            logger.info("DADOS FINANCEIROS:")
            financeiros = payload_dict['financeiros']
            for key, value in financeiros.items():
                logger.info(f"  financeiros.{key}: {value}")
        
        # Log dados de geração
        if 'geracao' in payload_dict:
            logger.info("DADOS DE GERAÇÃO:")
            geracao = payload_dict['geracao']
            for key, value in geracao.items():
                logger.info(f"  geracao.{key}: {value} kWh")
        
        # Log dados de consumo
        if 'consumo_local' in payload_dict:
            logger.info("DADOS DE CONSUMO LOCAL:")
            consumo = payload_dict['consumo_local']
            for key, value in consumo.items():
                logger.info(f"  consumo_local.{key}: {value} kWh")
        
        # Log dados remotos
        logger.info("DADOS REMOTOS:")
        for remote_key in ['remoto_b', 'remoto_a_verde', 'remoto_a_azul']:
            if remote_key in payload_dict:
                remote_data = payload_dict[remote_key]
                logger.info(f"  {remote_key}: enabled={remote_data.get('enabled')}, percentage={remote_data.get('percentage')}%")
        
        logger.info(f"[Grupo B] Iniciando cálculo - CAPEX: R$ {input_data.financeiros.capex:,.2f}")

        # Chamar serviço
        logger.info("CHAMANDO SERVIÇO DE CÁLCULO...")
        resultado = await grupo_b_service.calculate(input_data)

        logger.info("[Grupo B] Cálculo concluído com sucesso")
        logger.info("RESPOSTA GERADA:")
        logger.info(f"  Tipo: {type(resultado)}")
        logger.info(f"  Somas iniciais: {resultado.somas_iniciais}")
        logger.info(f"  Financeiro: {resultado.financeiro}")

        return SuccessResponse(
            success=True,
            data=resultado,
            message="Cálculo Grupo B concluído com sucesso"
        )

    except ValueError as e:
        logger.error(f"[Grupo B] Erro de validação: {str(e)}")
        logger.error(f"Tipo do erro: {type(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"[Grupo B] Erro no cálculo: {str(e)}", exc_info=True)
        logger.error(f"Tipo do erro: {type(e)}")
        logger.error(f"Args do erro: {e.args}")
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
        logger.info(f"[Grupo A Python DEBUG] Payload recebido: {input_data.model_dump()}")
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