from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import json
from contextlib import asynccontextmanager

from core.config import settings
from core.exceptions import SolarAPIException
from api.v1.router import api_router

# Configurar logging detalhado
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar ciclo de vida da aplicação"""
    # Startup
    logger.info("Iniciando Solar API...")
    logger.info(f"Cache directory: {settings.CACHE_DIR}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Criar diretório de cache se não existir
    settings.CACHE_DIR.mkdir(exist_ok=True)
    
    yield
    
    # Shutdown
    logger.info("Encerrando Solar API...")

# Criar instância FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Middleware para logar payload bruto antes da validação Pydantic
@app.middleware("http")
async def log_payload_middleware(request: Request, call_next):
    # Logar apenas requisições POST para endpoints financeiros
    if request.method == "POST" and "/financial" in request.url.path:
        try:
            # Ler e logar o body bruto
            body = await request.body()
            logger.info("="*80)
            logger.info(f"[MIDDLEWARE] PAYLOAD BRUTO RECEBIDO - {request.method} {request.url.path}")
            logger.info("JSON EXATO COMO CHEGOU:")
            logger.info(body.decode('utf-8'))
            logger.info("="*80)
            
            # Recriar o request com o body original
            async def receive():
                return {"type": "http.request", "body": body}
            
            request = Request(request.scope, receive)
            
        except Exception as e:
            logger.error(f"[MIDDLEWARE] Erro ao logar payload: {e}")
    
    response = await call_next(request)
    return response

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handler global para exceções customizadas
@app.exception_handler(SolarAPIException)
async def solar_api_exception_handler(request, exc: SolarAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
            "timestamp": exc.timestamp.isoformat()
        }
    )

# Handler para exceções não tratadas
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.error(f"Erro não tratado: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "details": "Entre em contato com o suporte se o problema persistir"
        }
    )

# Rota de health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "cache_dir": str(settings.CACHE_DIR)
    }

# Rota raiz
@app.get("/")
async def root():
    """Endpoint raiz com informações da API"""
    return {
        "message": "Solar Energy API",
        "version": settings.VERSION,
        "docs_url": "/docs" if settings.DEBUG else "Documentação disponível apenas em modo debug",
        "api_v1": f"{settings.API_V1_STR}/info"
    }

# INCLUIR ROUTER DA API V1
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )