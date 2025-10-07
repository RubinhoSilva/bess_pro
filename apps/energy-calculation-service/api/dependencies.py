from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer
import time
import logging

from core.config import settings
from core.exceptions import SolarAPIException

logger = logging.getLogger(__name__)

# Rate limiting simples (em produção usar Redis)
request_counts = {}

def rate_limit_dependency(request: Request):
    """Dependency para rate limiting básico"""
    if not settings.DEBUG:  # Só aplicar em produção
        client_ip = request.client.host
        current_time = time.time()
        
        # Limpar registros antigos
        cutoff_time = current_time - settings.RATE_LIMIT_WINDOW
        request_counts[client_ip] = [
            timestamp for timestamp in request_counts.get(client_ip, [])
            if timestamp > cutoff_time
        ]
        
        # Verificar limite
        if len(request_counts.get(client_ip, [])) >= settings.RATE_LIMIT_REQUESTS:
            logger.warning(f"Rate limit excedido para IP: {client_ip}")
            raise HTTPException(
                status_code=429,
                detail="Muitas requisições. Tente novamente em alguns minutos."
            )
        
        # Adicionar requisição atual
        if client_ip not in request_counts:
            request_counts[client_ip] = []
        request_counts[client_ip].append(current_time)

def log_request_dependency(request: Request):
    """Dependency para logging de requisições"""
    start_time = time.time()
    logger.info(f"Requisição: {request.method} {request.url}")
    
    def log_response():
        duration = time.time() - start_time
        logger.info(f"Resposta em {duration:.3f}s")
    
    request.state.log_response = log_response
    return request

# Security scheme para autenticação futura
security = HTTPBearer(auto_error=False)

def get_current_user(token: Optional[str] = Depends(security)):
    """Dependency para autenticação (preparado para futuro)"""
    # Por enquanto não há autenticação, mas estrutura está pronta
    return None