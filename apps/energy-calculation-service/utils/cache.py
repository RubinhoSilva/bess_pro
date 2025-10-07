import pickle
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Any, Dict, List
import logging
import os

from core.config import settings
from core.exceptions import CacheError

logger = logging.getLogger(__name__)

class CacheManager:
    """Gerenciador de cache para dados PVGIS"""
    
    def __init__(self, cache_dir: Path = None):
        self.cache_dir = cache_dir or settings.CACHE_DIR
        self.cache_dir.mkdir(exist_ok=True)
    
    def _generate_cache_key(self, lat: float, lon: float, **kwargs) -> str:
        """Gera chave única para cache baseada em coordenadas e parâmetros"""
        # Arredondar coordenadas para evitar cache duplicado para valores muito próximos
        lat_rounded = round(lat, 4)
        lon_rounded = round(lon, 4)
        
        # Incluir outros parâmetros na chave se fornecidos
        key_parts = [f"lat_{lat_rounded}", f"lon_{lon_rounded}"]
        
        for key, value in sorted(kwargs.items()):
            if value is not None:
                key_parts.append(f"{key}_{value}")
        
        key_string = "_".join(key_parts)
        
        # Gerar hash para evitar nomes de arquivo muito longos
        hash_object = hashlib.md5(key_string.encode())
        return hash_object.hexdigest()
    
    def _get_cache_filepath(self, cache_key: str, prefix: str = "pvgis") -> Path:
        """Retorna caminho completo para arquivo de cache"""
        filename = f"{prefix}_{cache_key}.pkl"
        return self.cache_dir / filename
    
    def get(self, lat: float, lon: float, prefix: str = "pvgis", **kwargs) -> Optional[Any]:
        """Recupera dados do cache se existir e não expirou"""
        try:
            cache_key = self._generate_cache_key(lat, lon, **kwargs)
            cache_file = self._get_cache_filepath(cache_key, prefix)
            
            if not cache_file.exists():
                logger.debug(f"Cache miss: {cache_file}")
                return None
            
            # Verificar se cache expirou
            file_age = datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)
            if file_age > timedelta(hours=settings.CACHE_TTL_HOURS):
                logger.info(f"Cache expirado: {cache_file} (idade: {file_age})")
                cache_file.unlink()  # Remove arquivo expirado
                return None
            
            # Carregar dados do cache
            with open(cache_file, 'rb') as f:
                data = pickle.load(f)
            
            logger.info(f"Cache hit: {cache_file}")
            return data
            
        except Exception as e:
            logger.error(f"Erro ao ler cache: {e}")
            return None
    
    def set(self, lat: float, lon: float, data: Any, prefix: str = "pvgis", **kwargs) -> bool:
        """Salva dados no cache"""
        try:
            cache_key = self._generate_cache_key(lat, lon, **kwargs)
            cache_file = self._get_cache_filepath(cache_key, prefix)
            
            # Verificar espaço em disco antes de salvar
            if not self._check_disk_space():
                logger.warning("Espaço em disco insuficiente, limpando cache antigo...")
                self.cleanup_old_files()
            
            with open(cache_file, 'wb') as f:
                pickle.dump(data, f)
            
            logger.info(f"Dados salvos no cache: {cache_file}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao salvar cache: {e}")
            raise CacheError(f"Falha ao salvar cache: {str(e)}", str(cache_file))
    
    def _check_disk_space(self) -> bool:
        """Verifica se há espaço suficiente em disco"""
        try:
            # Calcular tamanho atual do diretório de cache
            total_size = sum(
                f.stat().st_size for f in self.cache_dir.rglob('*') if f.is_file()
            )
            
            # Converter para MB
            total_size_mb = total_size / (1024 * 1024)
            
            if total_size_mb > settings.MAX_CACHE_SIZE_MB:
                logger.warning(f"Cache muito grande: {total_size_mb:.1f}MB > {settings.MAX_CACHE_SIZE_MB}MB")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao verificar espaço em disco: {e}")
            return True  # Assumir que há espaço se não conseguir verificar
    
    def cleanup_old_files(self, days_old: int = 7) -> int:
        """Remove arquivos de cache antigos"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            removed_count = 0
            
            for cache_file in self.cache_dir.glob("*.pkl"):
                if cache_file.is_file():
                    file_time = datetime.fromtimestamp(cache_file.stat().st_mtime)
                    if file_time < cutoff_date:
                        cache_file.unlink()
                        removed_count += 1
                        logger.debug(f"Arquivo de cache removido: {cache_file}")
            
            if removed_count > 0:
                logger.info(f"Limpeza de cache: {removed_count} arquivos removidos")
            
            return removed_count
            
        except Exception as e:
            logger.error(f"Erro na limpeza de cache: {e}")
            return 0
    
    def clear_all(self) -> int:
        """Remove todos os arquivos de cache"""
        try:
            removed_count = 0
            for cache_file in self.cache_dir.glob("*.pkl"):
                if cache_file.is_file():
                    cache_file.unlink()
                    removed_count += 1
            
            logger.info(f"Cache limpo: {removed_count} arquivos removidos")
            return removed_count
            
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache"""
        try:
            files = list(self.cache_dir.glob("*.pkl"))
            total_files = len(files)
            
            if total_files == 0:
                return {
                    "total_files": 0,
                    "total_size_mb": 0,
                    "oldest_file": None,
                    "newest_file": None
                }
            
            total_size = sum(f.stat().st_size for f in files)
            total_size_mb = total_size / (1024 * 1024)
            
            file_times = [datetime.fromtimestamp(f.stat().st_mtime) for f in files]
            oldest_file = min(file_times)
            newest_file = max(file_times)
            
            return {
                "total_files": total_files,
                "total_size_mb": round(total_size_mb, 2),
                "oldest_file": oldest_file.isoformat(),
                "newest_file": newest_file.isoformat(),
                "cache_dir": str(self.cache_dir)
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas do cache: {e}")
            return {"error": str(e)}

# Instância global do gerenciador de cache
cache_manager = CacheManager()