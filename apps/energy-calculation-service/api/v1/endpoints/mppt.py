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
        print("\n" + "=" * 100)
        print("🔧 [PYTHON - MPPT ENDPOINT] INÍCIO - calculate_modules_per_mppt")
        print("=" * 100)

        logger.info(f"📥 Recebida requisição de cálculo MPPT para {request.fabricante} {request.modelo}")

        # Converter request para dict
        request_dict = request.dict() if hasattr(request, 'dict') else request.model_dump()

        # Salvar JSON de entrada em arquivo
        try:
            debug_dir = Path("/app/debug_logs")
            debug_dir.mkdir(exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"mppt_request_{timestamp}.json"
            filepath = debug_dir / filename

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(request_dict, f, indent=2, ensure_ascii=False, default=str)

            print(f"💾 JSON salvo em: {filepath}")
            logger.info(f"JSON de entrada salvo em: {filepath}")
        except Exception as e:
            print(f"⚠️  Erro ao salvar JSON: {e}")
            logger.warning(f"Não foi possível salvar JSON de entrada: {e}")

        # Log detalhado dos dados de entrada
        print("\n" + "=" * 100)
        print("📊 [PYTHON - MPPT ENDPOINT] DADOS DE ENTRADA RECEBIDOS DO NODE.JS:")
        print("=" * 100)
        print(json.dumps(request_dict, indent=2, ensure_ascii=False, default=str))
        print("=" * 100)

        print("\n📝 [PYTHON - MPPT ENDPOINT] RESUMO DOS PARÂMETROS:")
        print(f"   🏭 Inversor: {request.fabricante} {request.modelo}")
        print(f"   ⚡ Potência CA: {request.potencia_saida_ca_w}W")
        print(f"   🔌 Número de MPPTs: {request.numero_mppt}")
        print(f"   🔋 Potência do Módulo: {request.potencia_modulo_w}W")
        print(f"   📍 Localização: ({request.latitude}, {request.longitude})")
        print(f"   🌡️  Voc STC: {request.voc_stc}V")
        print(f"   📉 Coef. Temp. Voc: {request.temp_coef_voc}%/°C")
        print(f"   🔝 Tensão CC Máx: {request.tensao_cc_max_v}V")
        if request.faixa_mppt_max_v:
            print(f"   🎯 Faixa MPPT Máx: {request.faixa_mppt_max_v}V")
        print("=" * 100)

        # Executar cálculo
        print("\n🔄 [PYTHON - MPPT ENDPOINT] Chamando mppt_service.calculate_modules_per_mppt...")
        result = mppt_service.calculate_modules_per_mppt(request)

        # Verificar se o resultado é um erro estruturado
        if isinstance(result, MPPTCalculationErrorResponse):
            print(f"\n❌ [PYTHON - MPPT ENDPOINT] ERRO ESTRUTURADO: {result.message}")
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

        print("\n✅ [PYTHON - MPPT ENDPOINT] RESULTADO DO CÁLCULO:")
        print(f"   📊 Módulos por MPPT: {result.modulos_por_mppt}")
        print(f"   🔢 Total no Sistema: {result.modulos_total_sistema}")
        print(f"   🎯 Limitação Principal: {result.limitacao_principal}")

        logger.info(f"✅ Cálculo MPPT concluído: {result.modulos_por_mppt} módulos por MPPT, {result.modulos_total_sistema} total")

        print("\n" + "=" * 100)
        print("🏁 [PYTHON - MPPT ENDPOINT] FIM - calculate_modules_per_mppt")
        print("=" * 100 + "\n")

        return result

    except ValidationError as e:
        print(f"\n❌ [PYTHON - MPPT ENDPOINT] ERRO DE VALIDAÇÃO: {e}\n")
        logger.error(f"Erro de validação no cálculo MPPT: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except CalculationError as e:
        print(f"\n❌ [PYTHON - MPPT ENDPOINT] ERRO DE CÁLCULO: {e}\n")
        logger.error(f"Erro no cálculo MPPT: {e}")
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        print(f"\n❌ [PYTHON - MPPT ENDPOINT] ERRO INTERNO: {e}\n")
        logger.error(f"Erro interno no cálculo MPPT: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@router.get("/health")
async def mppt_health():
    """Health check do serviço MPPT"""
    return {
        "service": "MPPT Calculation Service",
        "status": "healthy",
        "version": "1.0.0"
    }