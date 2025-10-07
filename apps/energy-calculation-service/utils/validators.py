# ========== app/utils/cache.py ==========

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


# ========== app/utils/validators.py ==========

import re
from typing import List, Tuple, Optional, Union
from pydantic import Field, validator
import logging

from core.config import settings
from core.exceptions import ValidationError

logger = logging.getLogger(__name__)

def validate_coordinates(lat: float, lon: float) -> Tuple[float, float]:
    """Valida coordenadas geográficas"""
    if not isinstance(lat, (int, float)):
        raise ValidationError("Latitude deve ser um número", "lat", lat)
    
    if not isinstance(lon, (int, float)):
        raise ValidationError("Longitude deve ser um número", "lon", lon)
    
    if not (settings.MIN_LATITUDE <= lat <= settings.MAX_LATITUDE):
        raise ValidationError(
            f"Latitude deve estar entre {settings.MIN_LATITUDE} e {settings.MAX_LATITUDE}",
            "lat", 
            lat
        )
    
    if not (settings.MIN_LONGITUDE <= lon <= settings.MAX_LONGITUDE):
        raise ValidationError(
            f"Longitude deve estar entre {settings.MIN_LONGITUDE} e {settings.MAX_LONGITUDE}",
            "lon",
            lon
        )
    
    return lat, lon

def validate_tilt(tilt: float) -> float:
    """Valida inclinação de módulos fotovoltaicos"""
    if not isinstance(tilt, (int, float)):
        raise ValidationError("Inclinação deve ser um número", "tilt", tilt)
    
    if not (settings.MIN_TILT <= tilt <= settings.MAX_TILT):
        raise ValidationError(
            f"Inclinação deve estar entre {settings.MIN_TILT}° e {settings.MAX_TILT}°",
            "tilt",
            tilt
        )
    
    return float(tilt)

def validate_azimuth(azimuth: float) -> float:
    """Valida azimute de módulos fotovoltaicos"""
    if not isinstance(azimuth, (int, float)):
        raise ValidationError("Azimute deve ser um número", "azimuth", azimuth)
    
    # Normalizar azimute para range 0-360
    azimuth = azimuth % 360
    
    if not (settings.MIN_AZIMUTH <= azimuth <= settings.MAX_AZIMUTH):
        raise ValidationError(
            f"Azimute deve estar entre {settings.MIN_AZIMUTH}° e {settings.MAX_AZIMUTH}°",
            "azimuth",
            azimuth
        )
    
    return float(azimuth)

def validate_module_power(power: float) -> float:
    """Valida potência de módulo fotovoltaico"""
    if not isinstance(power, (int, float)):
        raise ValidationError("Potência do módulo deve ser um número", "module_power", power)
    
    if not (settings.MIN_MODULE_POWER <= power <= settings.MAX_MODULE_POWER):
        raise ValidationError(
            f"Potência do módulo deve estar entre {settings.MIN_MODULE_POWER}W e {settings.MAX_MODULE_POWER}W",
            "module_power",
            power
        )
    
    return float(power)

def validate_consumption(consumption: float) -> float:
    """Valida consumo anual de energia"""
    if not isinstance(consumption, (int, float)):
        raise ValidationError("Consumo anual deve ser um número", "consumption", consumption)
    
    if not (settings.MIN_CONSUMPTION <= consumption <= settings.MAX_CONSUMPTION):
        raise ValidationError(
            f"Consumo anual deve estar entre {settings.MIN_CONSUMPTION} e {settings.MAX_CONSUMPTION} kWh",
            "consumption",
            consumption
        )
    
    return float(consumption)

def validate_decomposition_model(model: str) -> str:
    """Valida modelo de decomposição solar"""
    valid_models = ['erbs', 'disc', 'dirint', 'orgill_hollands', 'boland', 'louche']
    
    if not isinstance(model, str):
        raise ValidationError("Modelo de decomposição deve ser uma string", "model", model)
    
    model = model.lower().strip()
    
    if model not in valid_models:
        raise ValidationError(
            f"Modelo de decomposição deve ser um de: {', '.join(valid_models)}",
            "model",
            model
        )
    
    return model

def sanitize_string(value: str, max_length: int = 100) -> str:
    """Sanitiza strings de entrada"""
    if not isinstance(value, str):
        raise ValidationError("Valor deve ser uma string", "string", type(value))
    
    # Remove caracteres especiais perigosos
    sanitized = re.sub(r'[<>"\']', '', value.strip())
    
    if len(sanitized) > max_length:
        raise ValidationError(
            f"String muito longa (máximo {max_length} caracteres)",
            "string",
            len(sanitized)
        )
    
    return sanitized

def validate_irradiance_data(ghi: float, dni: Optional[float] = None, dhi: Optional[float] = None) -> bool:
    """Valida dados de irradiância solar"""
    if not (settings.GHI_MIN_VALUE <= ghi <= settings.GHI_MAX_VALUE):
        raise ValidationError(
            f"GHI deve estar entre {settings.GHI_MIN_VALUE} e {settings.GHI_MAX_VALUE} W/m²",
            "ghi",
            ghi
        )
    
    if dni is not None and not (0 <= dni <= settings.GHI_MAX_VALUE):
        raise ValidationError(
            f"DNI deve estar entre 0 e {settings.GHI_MAX_VALUE} W/m²",
            "dni",
            dni
        )
    
    if dhi is not None and not (0 <= dhi <= settings.GHI_MAX_VALUE):
        raise ValidationError(
            f"DHI deve estar entre 0 e {settings.GHI_MAX_VALUE} W/m²", 
            "dhi",
            dhi
        )
    
    # Validação física: GHI = DNI * cos(zenith) + DHI (aproximadamente)
    if dni is not None and dhi is not None:
        if dhi > ghi:
            raise ValidationError(
                "DHI não pode ser maior que GHI",
                "dhi",
                f"DHI: {dhi}, GHI: {ghi}"
            )
    
    return True

def validate_temperature(temp: float) -> float:
    """Valida temperatura ambiente"""
    if not isinstance(temp, (int, float)):
        raise ValidationError("Temperatura deve ser um número", "temperature", temp)
    
    if not (settings.TEMP_MIN_VALUE <= temp <= settings.TEMP_MAX_VALUE):
        raise ValidationError(
            f"Temperatura deve estar entre {settings.TEMP_MIN_VALUE}°C e {settings.TEMP_MAX_VALUE}°C",
            "temperature",
            temp
        )
    
    return float(temp)

def validate_wind_speed(wind: float) -> float:
    """Valida velocidade do vento"""
    if not isinstance(wind, (int, float)):
        raise ValidationError("Velocidade do vento deve ser um número", "wind_speed", wind)
    
    if not (settings.WIND_MIN_VALUE <= wind <= settings.WIND_MAX_VALUE):
        raise ValidationError(
            f"Velocidade do vento deve estar entre {settings.WIND_MIN_VALUE} e {settings.WIND_MAX_VALUE} m/s",
            "wind_speed",
            wind
        )
    
    return float(wind)

def validate_year_range(start_year: int, end_year: int) -> Tuple[int, int]:
    """Valida range de anos para análise"""
    current_year = 2024  # Poderia usar datetime.now().year, mas PVGIS vai até 2020
    
    if not isinstance(start_year, int) or not isinstance(end_year, int):
        raise ValidationError("Anos devem ser números inteiros", "year", f"{start_year}-{end_year}")
    
    if start_year < 2005:
        raise ValidationError("Ano inicial não pode ser anterior a 2005", "start_year", start_year)
    
    if end_year > 2020:
        raise ValidationError("Ano final não pode ser posterior a 2020", "end_year", end_year)
    
    if start_year >= end_year:
        raise ValidationError("Ano inicial deve ser menor que ano final", "year_range", f"{start_year}-{end_year}")
    
    if (end_year - start_year) < 1:
        raise ValidationError("Range deve ter pelo menos 2 anos", "year_range", f"{start_year}-{end_year}")
    
    return start_year, end_year

class CoordinateValidator:
    """Validador de coordenadas com contexto geográfico"""
    
    @staticmethod
    def is_brazil(lat: float, lon: float) -> bool:
        """Verifica se coordenadas estão no Brasil (aproximadamente)"""
        # Bounding box aproximado do Brasil
        return (-35 <= lat <= 5) and (-75 <= lon <= -30)
    
    @staticmethod
    def is_ocean(lat: float, lon: float) -> bool:
        """Verifica básica se coordenadas podem estar no oceano"""
        # Esta é uma verificação muito básica
        # Implementação mais sofisticada usaria dados geográficos reais
        known_land_areas = [
            # Brasil
            ((-35, 5), (-75, -30)),
            # Europa  
            ((35, 70), (-10, 40)),
            # Estados Unidos
            ((25, 50), (-130, -65))
        ]
        
        for (lat_range, lon_range) in known_land_areas:
            if lat_range[0] <= lat <= lat_range[1] and lon_range[0] <= lon <= lon_range[1]:
                return False
        
        return True
    
    @staticmethod
    def get_location_context(lat: float, lon: float) -> Dict[str, Any]:
        """Retorna contexto geográfico das coordenadas"""
        context = {
            "is_brazil": CoordinateValidator.is_brazil(lat, lon),
            "is_ocean": CoordinateValidator.is_ocean(lat, lon),
            "hemisphere": "Norte" if lat >= 0 else "Sul",
            "timezone_estimate": "UTC" + ("+3" if CoordinateValidator.is_brazil(lat, lon) else "")
        }
        
        return context