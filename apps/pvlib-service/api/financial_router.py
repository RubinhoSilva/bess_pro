"""
Router para endpoints de cálculos financeiros
"""

from fastapi import APIRouter, HTTPException, Depends
from models.financial_models import FinancialInput, AdvancedFinancialResults
from services.financial_service import FinancialCalculationService
from core.response_models import SuccessResponse
import logging

# Configurar logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/financial", tags=["Cálculos Financeiros"])

@router.post("/calculate-advanced", response_model=SuccessResponse[AdvancedFinancialResults])
async def calculate_advanced_financial_analysis(
    input_data: FinancialInput
):
    """
    Calcula análise financeira avançada para sistema fotovoltaico
    
    Inclui:
    - VPL (Valor Presente Líquido)
    - TIR (Taxa Interna de Retorno)  
    - Payback simples e descontado
    - Fluxo de caixa detalhado
    - Indicadores de performance
    - Análise de sensibilidade
    - Análise de cenários
    """
    
    try:
        logger.info("Iniciando cálculo financeiro avançado")
        logger.info(f"Investimento inicial: R$ {input_data.investimento_inicial:,.2f}")
        logger.info(f"Geração anual: {sum(input_data.geracao_mensal):.1f} kWh")
        logger.info(f"Consumo anual: {sum(input_data.consumo_mensal):.1f} kWh")
        logger.info(f"Tarifa energia: R$ {input_data.tarifa_energia:.4f}/kWh")
        
        # Validações
        if input_data.investimento_inicial <= 0:
            raise HTTPException(status_code=400, detail="Investimento inicial deve ser positivo")
        
        if len(input_data.geracao_mensal) != 12:
            raise HTTPException(status_code=400, detail="Geração mensal deve ter 12 valores")
        
        if len(input_data.consumo_mensal) != 12:
            raise HTTPException(status_code=400, detail="Consumo mensal deve ter 12 valores")
        
        if input_data.tarifa_energia <= 0:
            raise HTTPException(status_code=400, detail="Tarifa de energia deve ser positiva")
        
        if input_data.vida_util <= 0 or input_data.vida_util > 50:
            raise HTTPException(status_code=400, detail="Vida útil deve ser entre 1 e 50 anos")
        
        # Realizar cálculos
        resultado = FinancialCalculationService.calculate_advanced_financials(input_data)
        
        logger.info("Cálculo financeiro concluído com sucesso")
        logger.info(f"VPL: R$ {resultado.vpl:,.2f}")
        logger.info(f"TIR: {resultado.tir:.2f}%")
        logger.info(f"Payback simples: {resultado.payback_simples:.1f} anos")
        
        return SuccessResponse(
            success=True,
            data=resultado,
            message="Análise financeira calculada com sucesso"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Erro no cálculo financeiro: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno no cálculo financeiro: {str(e)}"
        )

@router.post("/calculate-simple", response_model=SuccessResponse[dict])
async def calculate_simple_financial_analysis(
    input_data: FinancialInput
):
    """
    Calcula análise financeira simplificada
    
    Retorna apenas os indicadores principais:
    - VPL, TIR, Payback
    - Economia anual média
    """
    
    try:
        logger.info("Iniciando cálculo financeiro simplificado")
        
        # Realizar cálculos completos
        resultado_completo = FinancialCalculationService.calculate_advanced_financials(input_data)
        
        # Extrair apenas indicadores principais
        resultado_simples = {
            "vpl": resultado_completo.vpl,
            "tir": resultado_completo.tir,
            "payback_simples": resultado_completo.payback_simples,
            "payback_descontado": resultado_completo.payback_descontado,
            "economia_anual_media": resultado_completo.economia_anual_media,
            "economia_total_25_anos": resultado_completo.economia_total_25_anos,
            "lucratividade_index": resultado_completo.lucratividade_index
        }
        
        logger.info("Cálculo financeiro simplificado concluído")
        
        return SuccessResponse(
            success=True,
            data=resultado_simples,
            message="Análise financeira simplificada calculada com sucesso"
        )
        
    except Exception as e:
        logger.error(f"Erro no cálculo financeiro simplificado: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno no cálculo financeiro: {str(e)}"
        )