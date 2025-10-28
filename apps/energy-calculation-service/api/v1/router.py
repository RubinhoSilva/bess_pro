from fastapi import APIRouter

from api.v1.endpoints import irradiation, admin, mppt, solar, bess, proposal
from api.financial_router import router as financial_router
from api.financial_grupo_router import router as financial_grupo_router

# Router principal da API v1
api_router = APIRouter()

# Incluir routers dos endpoints
api_router.include_router(irradiation.router)
api_router.include_router(solar.router)
api_router.include_router(mppt.router, prefix="/mppt", tags=["MPPT"])
api_router.include_router(bess.router, prefix="/bess", tags=["BESS - Battery Energy Storage System"])
api_router.include_router(admin.router)
api_router.include_router(financial_router)
api_router.include_router(financial_grupo_router)
api_router.include_router(proposal.router, tags=["Propostas"])

# Endpoint de informações da API
@api_router.get(
    "/info",
    tags=["Informações"],
    summary="Informações da API",
    description="Retorna informações gerais sobre a API v1"
)
async def api_info():
    """Informações da API v1"""
    return {
        "name": "Energy Calculation API v1",
        "version": "1.0.0",
        "description": "API para análise de sistemas de energia renovável: Solar FV, BESS e Híbridos",
        "endpoints": {
            "irradiation": {
                "POST /irradiation/monthly": "Análise de irradiação mensal",
                "GET /irradiation/monthly": "Análise via query parameters"
            },
            "solar": {
                "POST /solar/calculate": "Cálculo de sistema solar multi-inversor"
            },
            "mppt": {
                "POST /mppt/calculate-modules-per-mppt": "Cálculo de módulos por MPPT",
                "GET /mppt/health": "Health check do serviço MPPT"
            },
            "bess": {
                "POST /bess/hybrid-dimensioning": "Cálculo de sistema híbrido Solar + BESS",
                "GET /bess/health": "Health check do serviço BESS"
            },
            "financial": {
                "POST /financial/calculate-advanced": "Análise financeira avançada",
                "POST /financial/calculate-simple": "Análise financeira simplificada",
                "POST /financial/calculate-grupo-a": "Análise financeira Grupo A (Verde)",
                "POST /financial/calculate-grupo-b": "Análise financeira Grupo B"
            },
            "proposal": {
                "POST /proposal/generate": "Geração de proposta comercial em PDF",
                "GET /proposal/download/{filename}": "Download de proposta gerada"
            },
            "admin": {
                "GET /admin/health": "Health check",
                "GET /admin/cache/stats": "Estatísticas do cache legado",
                "DELETE /admin/cache/clear": "Limpar cache legado",
                "DELETE /admin/cache/cleanup": "Limpeza de arquivos antigos",
                "GET /admin/cache/geohash/stats": "Estatísticas do geohash cache",
                "DELETE /admin/cache/geohash/clear": "Limpar geohash cache",
                "DELETE /admin/cache/geohash/cleanup": "Limpeza de cache expirado"
            }
        },
        "documentation": "/docs"
    }
