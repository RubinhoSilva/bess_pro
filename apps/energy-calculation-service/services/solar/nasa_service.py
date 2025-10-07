import pandas as pd
import numpy as np
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from pvlib.iotools import get_pvgis_tmy

from core.config import settings
from core.exceptions import NASAError, CacheError, ValidationError
from utils.cache import cache_manager
from utils.geohash_cache import geohash_cache_manager
from utils.validators import validate_coordinates, validate_temperature, validate_wind_speed
from utils.weather_data_normalizer import normalize_nasa_data

logger = logging.getLogger(__name__)


class NASAService:
    """Service para integração com NASA POWER API através do pvlib"""

    def __init__(self):
        self.timeout = settings.NASA_POWER_API_TIMEOUT
        self.years_back = settings.NASA_POWER_YEARS_BACK
        self.dataset = settings.NASA_POWER_DATASET
        self.temporal = settings.NASA_POWER_TEMPORAL
        self.api_name = settings.NASA_POWER_API

    def fetch_weather_data(self, lat: float, lon: float, use_cache: bool = True) -> pd.DataFrame:
        """
        Busca dados meteorológicos do NASA POWER com cache inteligente baseado em geohashing.

        Cache strategy:
        1. Try geohash-based cache with source='nasa' (searches 3x3 neighbor grid, ~44km² area)
        2. If found within 15km radius, return cached data
        3. If not found, call NASA POWER API via pvlib and cache with geohash
        4. Fallback to legacy file cache if geohash fails

        Args:
            lat: Latitude
            lon: Longitude
            use_cache: Se deve usar cache

        Returns:
            DataFrame com dados meteorológicos formatados (mesmo formato do PVGIS)

        Raises:
            NASAError: Erro na comunicação com NASA POWER
            ValidationError: Coordenadas inválidas
        """
        # Validar coordenadas
        lat, lon = validate_coordinates(lat, lon)

        logger.info(f"Buscando dados NASA POWER para {lat}, {lon}")

        # Parâmetros de cache para distinguir da fonte PVGIS
        cache_params = {'source': 'nasa', 'dataset': self.dataset}

        # Tentar geohash cache primeiro (novo sistema)
        if use_cache:
            try:
                cached_data = geohash_cache_manager.get(lat, lon, **cache_params)
                if cached_data is not None:
                    logger.info(f"Geohash cache HIT para NASA POWER {lat}, {lon}")
                    return cached_data
                else:
                    logger.debug(f"Geohash cache MISS para NASA POWER {lat}, {lon}")
            except Exception as e:
                logger.warning(f"Erro no geohash cache NASA, tentando cache legado: {e}")
                # Fallback para cache legado
                cached_data = cache_manager.get(lat, lon, prefix="nasa")
                if cached_data is not None:
                    logger.info(f"Dados NASA encontrados no cache legado para {lat}, {lon}")
                    return cached_data

        # Buscar dados do NASA POWER (API call via pvlib)
        try:
            logger.info(f"Chamando NASA POWER API para {lat}, {lon} (cache miss)")
            df = self._download_nasa_data(lat, lon)

            # Salvar em ambos os caches
            if use_cache and df is not None:
                # Salvar no geohash cache (novo sistema)
                try:
                    geohash_cache_manager.set(lat, lon, df, **cache_params)
                    logger.debug(f"Dados NASA salvos no geohash cache para {lat}, {lon}")
                except Exception as e:
                    logger.warning(f"Erro ao salvar NASA no geohash cache: {e}")

                # Também salvar no cache legado para compatibilidade
                try:
                    cache_manager.set(lat, lon, df, prefix="nasa")
                except Exception as e:
                    logger.warning(f"Erro ao salvar NASA no cache legado: {e}")

            return df

        except Exception as e:
            logger.error(f"Erro ao buscar dados NASA POWER: {e}")
            raise NASAError(f"Falha ao obter dados meteorológicos: {str(e)}")

    def _download_nasa_data(self, lat: float, lon: float) -> pd.DataFrame:
        """
        Download e processamento dos dados NASA POWER via pvlib.

        NASA POWER provides hourly solar radiation and meteorological data.
        We use pvlib.iotools.get_nasa_power which is the official pvlib interface
        for NASA POWER API. Unlike NREL's get_psm3, this does NOT require email or API key.
        """
        try:
            # Importar a função correta do pvlib para NASA POWER
            from pvlib.iotools import get_nasa_power

            # Calcular período de dados (últimos N anos)
            end_year = datetime.now().year - 1  # Último ano completo
            start_year = end_year - self.years_back + 1

            # Criar datas de início e fim
            start_date = datetime(start_year, 1, 1)
            end_date = datetime(end_year, 12, 31)

            logger.info(f"Fazendo requisição NASA POWER para {lat}, {lon}")
            logger.info(f"Período: {start_date.strftime('%Y-%m-%d')} até {end_date.strftime('%Y-%m-%d')}")

            # Buscar dados do NASA POWER via pvlib
            # get_nasa_power é a interface oficial do pvlib para NASA POWER API
            # NÃO requer email nem API key (diferente de get_psm3 que é do NREL)
            data, metadata = get_nasa_power(
                latitude=lat,
                longitude=lon,
                start=start_date,
                end=end_date,
                parameters=['ghi', 'dni', 'dhi', 'temp_air', 'wind_speed'],
                community='re',  # renewable energy community
                map_variables=True  # Mapeia nomes de variáveis para formato padrão pvlib
            )

            logger.info(f"Recebidos {len(data)} registros horários da NASA POWER")
            logger.info(f"Período processado: {start_date.strftime('%Y-%m-%d')} até {end_date.strftime('%Y-%m-%d')}")

            # Processar e normalizar dados
            return self._process_nasa_data(data, lat, lon, metadata)

        except ImportError:
            # Se get_nasa_power não estiver disponível, usar método alternativo
            logger.warning("pvlib.iotools.get_nasa_power não disponível, usando método alternativo")
            return self._download_nasa_data_alternative(lat, lon)

        except Exception as e:
            logger.error(f"Erro ao baixar dados NASA POWER: {e}")
            raise NASAError(f"Erro na requisição NASA POWER: {str(e)}")

    def _download_nasa_data_alternative(self, lat: float, lon: float) -> pd.DataFrame:
        """
        Método alternativo usando pvlib.iotools.get_pvgis_hourly como fallback.

        Note: This is a temporary fallback. The proper implementation should use
        NASA POWER's direct API or pvlib's NASA POWER integration.
        """
        try:
            from pvlib.iotools import read_srml, get_pvgis_hourly
            import requests

            # Calcular período
            end_year = datetime.now().year - 1
            start_year = end_year - self.years_back + 1

            logger.info(f"Usando método alternativo para NASA POWER data")

            # NASA POWER API endpoint direto
            # Documentação: https://power.larc.nasa.gov/docs/services/api/
            base_url = "https://power.larc.nasa.gov/api/temporal/hourly/point"

            # Parâmetros NASA POWER
            # ALLSKY_SFC_SW_DWN: GHI (W/m²)
            # T2M: Temperature at 2m (°C)
            # WS10M: Wind speed at 10m (m/s)
            parameters = "ALLSKY_SFC_SW_DWN,T2M,WS10M,PS"

            # Construir URL
            url = (
                f"{base_url}?"
                f"parameters={parameters}&"
                f"community=RE&"
                f"longitude={lon}&"
                f"latitude={lat}&"
                f"start={start_year}0101&"
                f"end={end_year}1231&"
                f"format=JSON"
            )

            logger.info(f"Chamando NASA POWER API: {url}")

            # Fazer requisição
            response = requests.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()

            # Validar resposta
            if 'properties' not in data or 'parameter' not in data['properties']:
                raise NASAError("Formato de resposta NASA POWER inválido")

            parameters_data = data['properties']['parameter']

            # Processar dados
            records = []

            # NASA POWER retorna dados em formato: {"YYYYMMDDHH": value}
            if 'ALLSKY_SFC_SW_DWN' in parameters_data:
                ghi_data = parameters_data['ALLSKY_SFC_SW_DWN']
                temp_data = parameters_data.get('T2M', {})
                wind_data = parameters_data.get('WS10M', {})
                pressure_data = parameters_data.get('PS', {})

                for timestamp_str, ghi in ghi_data.items():
                    try:
                        # Parse timestamp: YYYYMMDDHH
                        if len(timestamp_str) == 10:  # YYYYMMDDHH
                            year = int(timestamp_str[0:4])
                            month = int(timestamp_str[4:6])
                            day = int(timestamp_str[6:8])
                            hour = int(timestamp_str[8:10])

                            dt = pd.Timestamp(
                                year=year, month=month, day=day, hour=hour,
                                tz='UTC'
                            )

                            # Extrair dados
                            temp = temp_data.get(timestamp_str, 25.0)
                            wind = wind_data.get(timestamp_str, 2.0)
                            pressure = pressure_data.get(timestamp_str, 101325.0)

                            # Converter pressão de kPa para Pa se necessário
                            if pressure < 10000:  # Likely in kPa
                                pressure = pressure * 1000

                            # Validações básicas
                            if ghi < 0 or ghi > settings.GHI_MAX_VALUE:
                                continue

                            record = {
                                'datetime': dt,
                                'ghi': max(0, ghi),  # GHI em W/m²
                                'temp_air': temp,
                                'wind_speed': max(0, wind),
                                'pressure': pressure
                            }

                            records.append(record)

                    except (ValueError, KeyError) as e:
                        logger.debug(f"Erro ao processar registro {timestamp_str}: {e}")
                        continue

            if not records:
                raise NASAError("Nenhum registro válido processado dos dados NASA POWER")

            # Criar DataFrame
            df = pd.DataFrame(records)
            df.set_index('datetime', inplace=True)

            # Converter timezone
            df.index = df.index.tz_convert('America/Sao_Paulo')

            # Normalizar usando a função do weather_data_normalizer
            metadata = {
                'dataset': self.dataset,
                'years_back': self.years_back,
                'api': 'NASA POWER'
            }

            standardized = normalize_nasa_data(df, lat, lon, metadata)

            years_processed = sorted(standardized.dataframe.index.year.unique())
            logger.info(f"Processados {len(standardized.dataframe)} registros NASA para anos {years_processed}")

            return standardized.dataframe

        except requests.RequestException as e:
            raise NASAError(f"Erro na requisição HTTP NASA POWER: {str(e)}")
        except Exception as e:
            logger.error(f"Erro no método alternativo NASA POWER: {e}")
            raise NASAError(f"Falha ao processar dados NASA POWER: {str(e)}")

    def _process_nasa_data(self, raw_data: pd.DataFrame, lat: float, lon: float,
                          metadata: Dict[str, Any]) -> pd.DataFrame:
        """
        Processa dados brutos do NASA POWER para formato padronizado.

        Args:
            raw_data: DataFrame bruto do NASA POWER
            lat: Latitude
            lon: Longitude
            metadata: Metadados da requisição

        Returns:
            DataFrame processado e normalizado
        """
        try:
            # Usar o normalizador de dados
            full_metadata = {
                'dataset': self.dataset,
                'years_back': self.years_back,
                'api': 'NASA POWER PSM3',
                **metadata
            }

            standardized = normalize_nasa_data(raw_data, lat, lon, full_metadata)

            years_processed = sorted(standardized.dataframe.index.year.unique())
            logger.info(f"Processados {len(standardized.dataframe)} registros NASA para anos {years_processed}")

            return standardized.dataframe

        except Exception as e:
            logger.error(f"Erro ao processar dados NASA POWER: {e}")
            raise NASAError(f"Falha no processamento dos dados: {str(e)}")

    def get_data_summary(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Retorna resumo dos dados disponíveis para uma localização.

        Args:
            lat: Latitude
            lon: Longitude

        Returns:
            Dicionário com resumo dos dados
        """
        try:
            df = self.fetch_weather_data(lat, lon)

            return {
                "fonte": "NASA POWER",
                "coordenadas": {"lat": lat, "lon": lon},
                "periodo": {
                    "inicio": df.index.min().strftime('%Y-%m-%d'),
                    "fim": df.index.max().strftime('%Y-%m-%d'),
                    "total_registros": len(df),
                    "anos_processados": sorted(df.index.year.unique().tolist())
                },
                "estatisticas": {
                    "ghi_medio": round(df['ghi'].mean(), 1),
                    "ghi_maximo": round(df['ghi'].max(), 1),
                    "temp_media": round(df['temp_air'].mean(), 1),
                    "vento_medio": round(df['wind_speed'].mean(), 1)
                },
                "dataset": self.dataset
            }

        except Exception as e:
            logger.error(f"Erro ao gerar resumo dos dados NASA: {e}")
            raise


# Instância singleton
nasa_service = NASAService()
