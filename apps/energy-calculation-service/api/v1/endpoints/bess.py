"""
Endpoints para cálculos de BESS (Battery Energy Storage System)

Endpoints disponíveis:
- POST /hybrid-dimensioning: Calcula sistema híbrido Solar + BESS
- GET /health: Health check do serviço BESS
"""

from fastapi import APIRouter, Depends, HTTPException
from models.bess.hybrid_requests import HybridDimensioningRequest
from models.bess.hybrid_responses import HybridDimensioningResponse
from services.bess.hybrid_service import hybrid_dimensioning_service
from core.exceptions import ValidationError, CalculationError
from api.dependencies import rate_limit_dependency, log_request_dependency
import logging
import json
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/hybrid-dimensioning", response_model=HybridDimensioningResponse)
async def calculate_hybrid_dimensioning(
    request: HybridDimensioningRequest,
    _: None = Depends(rate_limit_dependency),
    req_log: None = Depends(log_request_dependency)
):
    """
    Calcula dimensionamento de sistema híbrido Solar + BESS

    Este endpoint executa um cálculo completo de sistema híbrido:

    **ETAPA 1: Cálculo Solar (PVLIB)**
    - Busca dados meteorológicos (PVGIS ou NASA)
    - Executa ModelChain multi-inversor
    - Retorna geração mensal/anual e métricas de performance

    **ETAPA 2: Geração de Perfil de Consumo**
    - Converte consumo mensal em curva horária (8760 pontos)
    - Usa perfil típico (residencial, comercial, industrial)

    **ETAPA 3: Simulação BESS**
    - Simula operação hora a hora da bateria
    - Aplica estratégia (arbitragem, peak shaving, autoconsumo)
    - Calcula ciclos, SOC, economia

    **ETAPA 4: Análise Financeira Integrada**
    - Calcula VPL, TIR, Payback
    - Compara 4 cenários: sem sistema, só solar, só BESS, híbrido
    - Retorna autossuficiência energética

    Args:
        request: Parâmetros do sistema híbrido (solar + BESS)

    Returns:
        HybridDimensioningResponse: Resultado completo com análise integrada

    Raises:
        HTTPException: Erro de validação (400), cálculo (422) ou interno (500)
    """

    try:
        # =================================================================
        # LOG: INÍCIO
        # =================================================================
        print("\n" + "=" * 100)
        print("🔋⚡ [PYTHON - BESS ENDPOINT] INÍCIO - calculate_hybrid_dimensioning")
        print("=" * 100)

        logger.info(f"📥 Recebida requisição de cálculo HÍBRIDO Solar + BESS")

        # =================================================================
        # SALVAR JSON DE ENTRADA (DEBUG)
        # =================================================================
        # Converter request para dict para salvar
        request_dict = request.dict() if hasattr(request, 'dict') else request.model_dump()

        # Tentar salvar JSON em arquivo para debug
        try:
            debug_dir = Path("/app/debug_logs")
            debug_dir.mkdir(exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"hybrid_request_{timestamp}.json"
            filepath = debug_dir / filename

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(request_dict, f, indent=2, ensure_ascii=False, default=str)

            print(f"💾 JSON de entrada salvo em: {filepath}")
            logger.info(f"JSON de entrada salvo em: {filepath}")
        except Exception as e:
            print(f"⚠️  Não foi possível salvar JSON: {e}")
            logger.warning(f"Não foi possível salvar JSON de entrada: {e}")

        # =================================================================
        # LOG: DADOS DE ENTRADA
        # =================================================================
        print("\n" + "=" * 100)
        print("📊 [PYTHON - BESS ENDPOINT] DADOS DE ENTRADA RECEBIDOS DO NODE.JS:")
        print("=" * 100)

        print("\n🌞 SISTEMA SOLAR:")
        print(f"   📍 Localização: ({request.sistema_solar.lat}, {request.sistema_solar.lon})")
        print(f"   🔆 Origem dados: {request.sistema_solar.origem_dados}")
        print(f"   📅 Período: {request.sistema_solar.startyear}-{request.sistema_solar.endyear}")
        print(f"   ⚙️  Módulo: {request.sistema_solar.modulo.fabricante} {request.sistema_solar.modulo.modelo}")
        print(f"   ⚡ Potência módulo: {request.sistema_solar.modulo.potencia_nominal_w}W")
        print(f"   🔌 Número de inversores: {len(request.sistema_solar.inversores)}")

        print("\n🔋 SISTEMA BESS:")
        print(f"   🔋 Capacidade: {request.capacidade_kwh} kWh")
        print(f"   ⚡ Potência: {request.potencia_kw} kW")
        print(f"   🔧 Tipo bateria: {request.tipo_bateria}")
        print(f"   🔄 Eficiência: {request.eficiencia_roundtrip:.1%}")
        print(f"   📊 SOC limites: {request.soc_minimo:.1%} - {request.soc_maximo:.1%}")
        print(f"   🎯 Estratégia: {request.estrategia}")

        print("\n💰 PARÂMETROS ECONÔMICOS:")
        print(f"   💵 Custo bateria: R$ {request.custo_kwh_bateria:,.0f}/kWh")
        print(f"   💵 Custo inversor BESS: R$ {request.custo_kw_inversor_bess:,.0f}/kW")
        print(f"   💵 Custo instalação: R$ {request.custo_instalacao_bess:,.0f}")
        print(f"   📈 Taxa desconto: {request.taxa_desconto:.1%}")
        print(f"   📅 Vida útil: {request.vida_util_anos} anos")

        print("\n⚡ TARIFA:")
        print(f"   📋 Tipo: {request.tarifa.tipo}")
        print(f"   💲 Ponta: R$ {request.tarifa.tarifa_ponta_kwh:.2f}/kWh")
        print(f"   💲 Fora-ponta: R$ {request.tarifa.tarifa_fora_ponta_kwh:.2f}/kWh")

        print("=" * 100)

        # =================================================================
        # EXECUTAR CÁLCULO
        # =================================================================
        print("\n🔄 [PYTHON - BESS ENDPOINT] Chamando hybrid_dimensioning_service.calculate_hybrid_system...")

        # Chamar serviço orquestrador
        # Este método executa:
        # 1. Cálculo solar (SolarCalculationService)
        # 2. Geração perfil consumo horário
        # 3. Simulação BESS (BessSimulationService)
        # 4. Análise financeira (HybridFinancialService)
        result = hybrid_dimensioning_service.calculate_hybrid_system(request)

        # =================================================================
        # LOG: RESULTADO
        # =================================================================
        print("\n✅ [PYTHON - BESS ENDPOINT] RESULTADO DO CÁLCULO HÍBRIDO:")
        print("\n🌞 SISTEMA SOLAR:")
        print(f"   ⚡ Potência: {result.sistema_solar['potencia_total_kwp']:.2f} kWp")
        print(f"   🔆 Geração anual: {result.sistema_solar['energia_anual_kwh']:,.0f} kWh/ano")
        print(f"   📊 Performance Ratio: {result.sistema_solar.get('pr_total', 0):.1f}%")

        print("\n🔋 SISTEMA BESS:")
        print(f"   🔋 Capacidade: {result.sistema_bess['capacidade_kwh']} kWh")
        print(f"   ⚡ Potência: {result.sistema_bess['potencia_kw']} kW")
        print(f"   🔄 Ciclos equivalentes: {result.sistema_bess['ciclos_equivalentes_ano']:.1f}/ano")
        print(f"   📊 SOC médio: {result.sistema_bess['soc_medio_percentual']:.1f}%")
        print(f"   💰 Economia anual: R$ {result.sistema_bess['economia_total_anual_reais']:,.2f}")

        print("\n🔗 SISTEMA HÍBRIDO:")
        print(f"   🎯 Autossuficiência: {result.analise_hibrida['autossuficiencia']['autossuficiencia_percentual']:.1f}%")
        print(f"   💰 Economia total: R$ {result.analise_hibrida['analise_economica']['economia_anual_total_reais']:,.2f}/ano")
        print(f"   📊 VPL: R$ {result.analise_hibrida['retorno_financeiro']['npv_reais']:,.2f}")
        print(f"   📈 TIR: {result.analise_hibrida['retorno_financeiro']['tir_percentual']:.1f}%")
        print(f"   ⏱️  Payback: {result.analise_hibrida['retorno_financeiro']['payback_simples_anos']:.1f} anos")

        logger.info(f"✅ Cálculo híbrido concluído com sucesso:")
        logger.info(f"   Solar: {result.sistema_solar['potencia_total_kwp']:.2f}kWp, {result.sistema_solar['energia_anual_kwh']:,.0f}kWh/ano")
        logger.info(f"   BESS: {result.sistema_bess['capacidade_kwh']}kWh, economia R$ {result.sistema_bess['economia_total_anual_reais']:,.2f}/ano")
        logger.info(f"   Híbrido: Autossuf. {result.analise_hibrida['autossuficiencia']['autossuficiencia_percentual']:.1f}%, VPL R$ {result.analise_hibrida['retorno_financeiro']['npv_reais']:,.2f}")

        print("\n" + "=" * 100)
        print("🏁 [PYTHON - BESS ENDPOINT] FIM - calculate_hybrid_dimensioning")
        print("=" * 100 + "\n")

        return result

    except ValidationError as e:
        # Erro de validação de dados de entrada
        print(f"\n❌ [PYTHON - BESS ENDPOINT] ERRO DE VALIDAÇÃO: {e}\n")
        logger.error(f"Erro de validação no cálculo híbrido: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except CalculationError as e:
        # Erro durante o cálculo (PVLIB, simulação, etc.)
        print(f"\n❌ [PYTHON - BESS ENDPOINT] ERRO DE CÁLCULO: {e}\n")
        logger.error(f"Erro no cálculo híbrido: {e}")
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        # Erro interno não tratado
        print(f"\n❌ [PYTHON - BESS ENDPOINT] ERRO INTERNO: {e}\n")
        logger.error(f"Erro interno no cálculo híbrido: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@router.get("/health")
async def bess_health():
    """
    Health check do serviço BESS

    Retorna status do serviço e versão.
    Útil para monitoramento e verificação de disponibilidade.

    Returns:
        Dict com status e informações do serviço
    """
    return {
        "service": "BESS Calculation Service",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": {
            "hybrid_dimensioning": "/api/v1/bess/hybrid-dimensioning",
        }
    }
