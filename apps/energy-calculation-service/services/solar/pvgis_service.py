import requests
import pandas as pd
import numpy as np
import logging
from typing import Optional, Dict, Any
from pathlib import Path

from core.config import settings
from core.exceptions import PVGISError, CacheError, ValidationError
from utils.cache import cache_manager
from utils.geohash_cache import geohash_cache_manager
from utils.validators import validate_coordinates, validate_temperature, validate_wind_speed

logger = logging.getLogger(__name__)

class PVGISService:
    """Service para integração com API PVGIS"""
    
    def __init__(self):
        self.base_url = settings.PVGIS_BASE_URL
        self.timeout = settings.PVGIS_TIMEOUT
        self.start_year = 2015 
        self.end_year = 2020 
    
    def fetch_weather_data(self, lat: float, lon: float, use_cache: bool = True) -> pd.DataFrame:
        """
        Busca dados meteorológicos do PVGIS com cache inteligente baseado em geohashing.

        Cache strategy:
        1. Try geohash-based cache (searches 3x3 neighbor grid, ~44km² area)
        2. If found within 15km radius, return cached data
        3. If not found, call PVGIS API and cache with geohash
        4. Fallback to legacy file cache if geohash fails

        Args:
            lat: Latitude
            lon: Longitude
            use_cache: Se deve usar cache

        Returns:
            DataFrame com dados meteorológicos formatados

        Raises:
            PVGISError: Erro na comunicação com PVGIS
            ValidationError: Coordenadas inválidas
        """
        # Validar coordenadas
        lat, lon = validate_coordinates(lat, lon)

        logger.info(f"Buscando dados PVGIS para {lat}, {lon}")

        # Tentar geohash cache primeiro (novo sistema)
        if use_cache:
            try:
                cached_data = geohash_cache_manager.get(lat, lon)
                if cached_data is not None:
                    logger.info(f"Geohash cache HIT para {lat}, {lon}")
                    return cached_data
                else:
                    logger.debug(f"Geohash cache MISS para {lat}, {lon}")
            except Exception as e:
                logger.warning(f"Erro no geohash cache, tentando cache legado: {e}")
                # Fallback para cache legado
                cached_data = cache_manager.get(lat, lon, prefix="pvgis")
                if cached_data is not None:
                    logger.info(f"Dados encontrados no cache legado para {lat}, {lon}")
                    return cached_data

        # Buscar dados do PVGIS (API call)
        try:
            logger.info(f"Chamando API PVGIS para {lat}, {lon} (cache miss)")
            df = self._download_pvgis_data(lat, lon)

            # Salvar em ambos os caches
            if use_cache and df is not None:
                # Salvar no geohash cache (novo sistema)
                try:
                    geohash_cache_manager.set(lat, lon, df)
                    logger.debug(f"Dados salvos no geohash cache para {lat}, {lon}")
                except Exception as e:
                    logger.warning(f"Erro ao salvar no geohash cache: {e}")

                # Também salvar no cache legado para compatibilidade
                try:
                    cache_manager.set(lat, lon, df, prefix="pvgis")
                except Exception as e:
                    logger.warning(f"Erro ao salvar no cache legado: {e}")

            return df

        except Exception as e:
            logger.error(f"Erro ao buscar dados PVGIS: {e}")
            raise PVGISError(f"Falha ao obter dados meteorológicos: {str(e)}")
    
    def _download_pvgis_data(self, lat: float, lon: float) -> pd.DataFrame:
        """Download e processamento dos dados PVGIS"""
        
        # Mudança: agora usa período específico 2018-2020 diretamente na URL
        url = (f"{self.base_url}/seriescalc?"
               f"lat={lat}&lon={lon}&"
               f"startyear={self.start_year}&endyear={self.end_year}&"  # Agora: 2018-2020
               f"outputformat=json&usehorizon=1&selectrad=1&angle=0&aspect=0")
        
        logger.info(f"Fazendo requisição para PVGIS: {url}")
        logger.info(f"Período solicitado: {self.start_year}-{self.end_year}")  # Log do período
        
        try:
            response = requests.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
        except requests.RequestException as e:
            raise PVGISError(f"Erro na requisição HTTP: {str(e)}", url)
        except ValueError as e:
            raise PVGISError(f"Erro ao decodificar JSON: {str(e)}", url)
        
        # Validar estrutura da resposta
        if 'outputs' not in data or 'hourly' not in data['outputs']:
            raise PVGISError("Formato de resposta PVGIS inválido", url)
        
        hourly_data = data['outputs']['hourly']
        logger.info(f"Recebidos {len(hourly_data)} registros do PVGIS para período {self.start_year}-{self.end_year}")
        
        # Processar dados
        return self._process_pvgis_data(hourly_data)
    
    def _process_pvgis_data(self, hourly_data: list) -> pd.DataFrame:
        """Processa dados brutos do PVGIS para formato pandas"""
        
        processed_records = []
        errors = 0
        
        for record in hourly_data:
            try:
                # Parse timestamp: "20200101:0003"
                time_str = record['time']
                year = int(time_str[0:4])
                month = int(time_str[4:6])
                day = int(time_str[6:8])
                hour = int(time_str[9:11])
                minute = int(time_str[11:13])
            
                
                # Criar datetime
                dt = pd.Timestamp(year=year, month=month, day=day,
                                hour=hour, minute=minute, tz='UTC')
                
                # Extrair e validar dados - AGORA INCLUINDO DNI E DHI DO PVGIS!
                ghi = float(record['G(i)'])
                dni = float(record.get('Gb(n)', 0.0))  # Direct Normal Irradiation
                dhi = float(record.get('Gd(n)', 0.0))  # Diffuse Horizontal Irradiation
                temp_air = float(record.get('T2m', 25))
                wind_speed = float(record.get('WS10m', 2))
                
                # Validações básicas
                if not (0 <= ghi <= settings.GHI_MAX_VALUE):
                    continue
                    
                try:
                    validate_temperature(temp_air)
                    validate_wind_speed(wind_speed)
                except ValidationError:
                    # Log mas continue com valores padrão
                    temp_air = max(min(temp_air, settings.TEMP_MAX_VALUE), settings.TEMP_MIN_VALUE)
                    wind_speed = max(min(wind_speed, settings.WIND_MAX_VALUE), settings.WIND_MIN_VALUE)
                
                processed_record = {
                    'datetime': dt,
                    'ghi': ghi,
                    'dni': dni,  # ✅ AGORA SALVANDO DNI DO PVGIS
                    'dhi': dhi,  # ✅ AGORA SALVANDO DHI DO PVGIS
                    'temp_air': temp_air,
                    'wind_speed': wind_speed,
                    'pressure': 101325.0,  # Pressão padrão
                }
                
                processed_records.append(processed_record)
                
            except (KeyError, ValueError, TypeError) as e:
                errors += 1
                if errors % 1000 == 0:  # Log a cada 1000 erros
                    logger.warning(f"Erros no processamento: {errors}")
                continue
        
        if not processed_records:
            raise PVGISError(f"Nenhum registro válido processado ({errors} erros)")
        
        # Criar DataFrame
        df = pd.DataFrame(processed_records)
        df.set_index('datetime', inplace=True)
        df.index = df.index.tz_convert('America/Sao_Paulo')
        
        # Mudança: log específico do período processado
        years_processed = sorted(df.index.year.unique())
        logger.info(f"Processados {len(df)} registros para anos {years_processed} ({errors} erros ignorados)")
        
        return df
    
    def get_data_summary(self, lat: float, lon: float) -> Dict[str, Any]:
        """Retorna resumo dos dados disponíveis para uma localização"""
        
        try:
            df = self.fetch_weather_data(lat, lon)
            
            return {
                "coordenadas": {"lat": lat, "lon": lon},
                "periodo": {
                    "inicio": df.index.min().strftime('%Y-%m-%d'),
                    "fim": df.index.max().strftime('%Y-%m-%d'),
                    "total_registros": len(df),
                    # Mudança: adicionar informação sobre anos processados
                    "anos_processados": sorted(df.index.year.unique().tolist())
                },
                "estatisticas": {
                    "ghi_medio": round(df['ghi'].mean(), 1),
                    "ghi_maximo": round(df['ghi'].max(), 1),
                    "temp_media": round(df['temp_air'].mean(), 1),
                    "vento_medio": round(df['wind_speed'].mean(), 1)
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar resumo dos dados: {e}")
            raise

# Instância singleton
pvgis_service = PVGISService()