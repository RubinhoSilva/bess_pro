from fastapi import APIRouter

from api.v1.endpoints import irradiation, modules, admin
from api.financial_router import router as financial_router

# Router principal da API v1
api_router = APIRouter()

# Incluir routers dos endpoints
api_router.include_router(irradiation.router)
api_router.include_router(modules.router)
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
        "description": "API para análise de irradiação solar e dimensionamento fotovoltaico",
        "endpoints": {
            "irradiation": {
                "POST /irradiation/monthly": "Análise de irradiação mensal",
                "GET /irradiation/monthly": "Análise via query parameters"
            },
            "modules": {
                "POST /modules/calculate": "Cálculo de módulos necessários",
                "GET /modules/calculate": "Cálculo via query parameters"
            },
            "admin": {
                "GET /admin/health": "Health check",
                "GET /admin/cache/stats": "Estatísticas do cache",
                "DELETE /admin/cache/clear": "Limpar cache",
                "DELETE /admin/cache/cleanup": "Limpeza de arquivos antigos"
            }
        },
        "documentation": "/docs"
    }
