from fastapi import APIRouter

from api.v1.endpoints import irradiation, modules, admin, multi_inverter, mppt
from api.financial_router import router as financial_router

# Router principal da API v1
api_router = APIRouter()

# Incluir routers dos endpoints
api_router.include_router(irradiation.router)
api_router.include_router(modules.router)
api_router.include_router(multi_inverter.router)
api_router.include_router(mppt.router, prefix="/mppt", tags=["MPPT"])
api_router.include_router(admin.router)
api_router.include_router(financial_router)

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
        "name": "Solar Energy API v1",
        "version": "1.0.0",
        "description": "API para análise de irradiação solar, dimensionamento fotovoltaico e sistemas multi-inversor",
        "endpoints": {
            "irradiation": {
                "POST /irradiation/monthly": "Análise de irradiação mensal",
                "GET /irradiation/monthly": "Análise via query parameters"
            },
            "modules": {
                "POST /modules/calculate": "Cálculo de módulos necessários (legado)",
                "GET /modules/calculate": "Cálculo via query parameters (legado)"
            },
            "multi-inverter": {
                "POST /multi-inverter/calculate": "Cálculo de sistema multi-inversor",
                "GET /multi-inverter/validate-system": "Validação de compatibilidade",
                "GET /multi-inverter/system-info": "Informações do sistema"
            },
            "mppt": {
                "POST /mppt/calculate-modules-per-mppt": "Cálculo de módulos por MPPT",
                "GET /mppt/health": "Health check do serviço MPPT"
            },
            "financial": {
                "POST /financial/calculate-advanced": "Análise financeira avançada",
                "POST /financial/calculate-simple": "Análise financeira simplificada"
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
