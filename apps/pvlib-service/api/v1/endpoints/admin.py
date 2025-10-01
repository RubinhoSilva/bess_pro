from fastapi import APIRouter, Depends, HTTPException
import logging

from models.responses import CacheStatsResponse, MessageResponse, HealthCheckResponse
from utils.cache import cache_manager
from utils.geohash_cache import geohash_cache_manager
from core.config import settings
from api.dependencies import log_request_dependency

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Administração"])

@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health check da aplicação",
    description="Verifica se a aplicação está funcionando corretamente"
)
async def health_check():
    """Health check detalhado da aplicação"""
    
    try:
        # Verificações básicas
        cache_stats = cache_manager.get_cache_stats()
        
        return HealthCheckResponse(
            status="healthy",
            version=settings.VERSION,
            cache_dir=str(settings.CACHE_DIR)
        )
        
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        raise HTTPException(
            status_code=503,
            detail="Aplicação não está funcionando corretamente"
        )

@router.get(
    "/cache/stats",
    response_model=CacheStatsResponse,
    summary="Estatísticas do cache",
    description="Retorna informações sobre o uso do cache de dados PVGIS"
)
async def get_cache_statistics(
    _: None = Depends(log_request_dependency)
):
    """Obtém estatísticas do cache"""
    
    try:
        stats = cache_manager.get_cache_stats()
        
        if "error" in stats:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter estatísticas: {stats['error']}"
            )
        
        return CacheStatsResponse(
            total_files=stats.get('total_files', 0),
            total_size_mb=stats.get('total_size_mb', 0),
            oldest_file=stats.get('oldest_file'),
            newest_file=stats.get('newest_file'),
            cache_dir=stats.get('cache_dir', str(settings.CACHE_DIR)),
            cache_ttl_hours=settings.CACHE_TTL_HOURS,
            max_size_mb=settings.MAX_CACHE_SIZE_MB
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do cache: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao obter estatísticas"
        )

@router.delete(
    "/cache/clear",
    response_model=MessageResponse,
    summary="Limpar cache",
    description="Remove todos os arquivos do cache. Use com cuidado!"
)
async def clear_cache():
    """Limpa todo o cache"""
    
    try:
        removed_count = cache_manager.clear_all()
        
        message = f"Cache limpo com sucesso. {removed_count} arquivos removidos."
        logger.info(message)
        
        return MessageResponse(message=message)
        
    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao limpar cache"
        )

@router.delete(
    "/cache/cleanup",
    response_model=MessageResponse,
    summary="Limpeza de cache antigo",
    description="Remove apenas arquivos de cache antigos (mais de 7 dias)"
)
async def cleanup_old_cache():
    """Limpa arquivos antigos do cache"""

    try:
        removed_count = cache_manager.cleanup_old_files(days_old=7)

        message = f"Limpeza concluída. {removed_count} arquivos antigos removidos."
        logger.info(message)

        return MessageResponse(message=message)

    except Exception as e:
        logger.error(f"Erro na limpeza de cache: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno na limpeza de cache"
        )


# Geohash Cache Endpoints

@router.get(
    "/cache/geohash/stats",
    summary="Estatísticas do Geohash Cache",
    description="Retorna informações sobre o cache geohash-based incluindo configuração e uso"
)
async def get_geohash_cache_stats():
    """Obtém estatísticas do geohash cache"""

    try:
        stats = geohash_cache_manager.get_cache_stats()

        if "error" in stats:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter estatísticas: {stats['error']}"
            )

        return stats

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do geohash cache: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao obter estatísticas"
        )


@router.delete(
    "/cache/geohash/clear",
    response_model=MessageResponse,
    summary="Limpar Geohash Cache",
    description="Remove todos os arquivos do geohash cache. Use com cuidado!"
)
async def clear_geohash_cache():
    """Limpa todo o geohash cache"""

    try:
        removed_count = geohash_cache_manager.clear_all()

        message = f"Geohash cache limpo com sucesso. {removed_count} arquivos removidos."
        logger.info(message)

        return MessageResponse(message=message)

    except Exception as e:
        logger.error(f"Erro ao limpar geohash cache: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao limpar geohash cache"
        )


@router.delete(
    "/cache/geohash/cleanup",
    response_model=MessageResponse,
    summary="Limpeza de Geohash Cache Expirado",
    description="Remove apenas arquivos de geohash cache expirados"
)
async def cleanup_expired_geohash_cache():
    """Limpa arquivos expirados do geohash cache"""

    try:
        removed_count = geohash_cache_manager.clear_expired()

        message = f"Limpeza do geohash cache concluída. {removed_count} arquivos expirados removidos."
        logger.info(message)

        return MessageResponse(message=message)

    except Exception as e:
        logger.error(f"Erro na limpeza do geohash cache: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno na limpeza do geohash cache"
        )
