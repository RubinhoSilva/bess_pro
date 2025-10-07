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
        import json
        print("\n" + "=" * 80)
        print("🐍 [PYTHON - modules.py] INÍCIO - calculate_required_modules")
        print("=" * 80)

        logger.info(f"📥 [PYTHON] Recebendo requisição de cálculo de módulos")
        logger.info(f"   - Localização: {request.lat}, {request.lon}")
        logger.info(f"   - Módulo: {request.modulo.fabricante} {request.modulo.modelo} ({request.modulo.potencia_nominal_w}W)")
        logger.info(f"   - Consumo anual: {request.consumo_anual_kwh} kWh/ano")

        if hasattr(request, 'inversor') and request.inversor:
            logger.info(f"   - Inversor: {request.inversor.fabricante} {request.inversor.modelo}")

        print("\n" + "=" * 80)
        print("🐍 [PYTHON - modules.py] JSON COMPLETO RECEBIDO DO NODE.JS:")
        print("=" * 80)
        
        # Converter request para dict para visualização completa
        try:
            request_dict = request.dict() if hasattr(request, 'dict') else request.__dict__
            print(json.dumps(request_dict, indent=2, ensure_ascii=False, default=str))
        except Exception as e:
            print(f"Erro ao serializar request: {e}")
            print(f"Request type: {type(request)}")
            print(f"Request attributes: {dir(request)}")
        
        print("=" * 80)
        print("🐍 [PYTHON - modules.py] RESUMO DADOS PRINCIPAIS:")
        print(f"🔧 PERDAS DO SISTEMA: {request.perdas_sistema}%")
        print(f"📊 CONSUMO ANUAL: {request.consumo_anual_kwh} kWh")
        print(f"📍 COORDENADAS: {request.lat}, {request.lon}")
        print(f"🔋 MÓDULO: {request.modulo.fabricante} {request.modulo.modelo} - {request.modulo.potencia_nominal_w}W")
        print(f"⚡ INVERSOR: {request.inversor.fabricante} {request.inversor.modelo} - {request.inversor.potencia_saida_ca_w}W")
        if hasattr(request, 'num_modules') and request.num_modules:
            print(f"🧮 NÚMERO ESPECÍFICO DE MÓDULOS: {request.num_modules}")
        print("=" * 80)

        print("\n🔧 [PYTHON - modules.py] Chamando module_service.calculate_required_modules")
        print("   - Passando parâmetros: request (ModuleCalculationRequest)")

        result = module_service.calculate_required_modules(request)

        print("\n✅ [PYTHON - modules.py] Retorno do module_service recebido")
        logger.info(f"📊 [PYTHON] Cálculo concluído com sucesso:")
        logger.info(f"   - Módulos: {result.num_modulos}")
        logger.info(f"   - Potência: {result.potencia_total_kw} kWp")
        logger.info(f"   - Energia anual: {result.energia_total_anual} kWh")

        print("=" * 80)
        print("🏁 [PYTHON - modules.py] FIM - calculate_required_modules")
        print("=" * 80 + "\n")

        return result
        
    except SolarAPIException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado no cálculo de módulos: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro interno no servidor. Tente novamente."
        )

