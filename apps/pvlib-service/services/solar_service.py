import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Optional
from pvlib import irradiance, solarposition

from core.config import settings
from core.exceptions import CalculationError, ValidationError, PVGISError, NASAError
from models.requests import IrradiationAnalysisRequest
from models.responses import IrradiationAnalysisResponse
from services.pvgis_service import pvgis_service
from services.nasa_service import nasa_service
from utils.validators import validate_decomposition_model
from utils.cache import cache_manager
from utils.geohash_cache import geohash_cache_manager

logger = logging.getLogger(__name__)

class SolarService:
    """Service para análise de irradiação solar"""

    def __init__(self):
        self.pvgis = pvgis_service
        self.nasa = nasa_service
        self.month_names = {
            1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
            5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
            9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
        }
    
    def analyze_monthly_irradiation(self, request: IrradiationAnalysisRequest) -> IrradiationAnalysisResponse:
        """
        Analisa irradiação solar mensal

        Args:
            request: Parâmetros da análise

        Returns:
            Análise completa da irradiação mensal
        """
        logger.info(f"Iniciando análise de irradiação para {request.lat}, {request.lon}")
        logger.info(f"Fonte de dados solicitada: {request.data_source}")

        # Determinar se precisa usar plano inclinado
        use_tilted_plane = (request.tilt > 0) or (request.azimuth != 0)

        # Buscar dados meteorológicos da fonte selecionada com fallback automático
        df, actual_source = self._fetch_weather_data_with_fallback(
            request.lat, request.lon, request.data_source
        )

        # Filtrar anos completos (2005-2020 ou disponível)
        df_filtered = df[df.index.year >= 2005]

        if len(df_filtered) == 0:
            raise CalculationError("Nenhum dado válido encontrado para o período")

        # Escolher fonte de irradiação
        if use_tilted_plane:
            logger.info(f"Calculando irradiação no plano inclinado ({request.tilt}°, {request.azimuth}°)")
            irradiance_source = self._calculate_poa_irradiance(
                df_filtered, request.lat, request.lon,
                request.tilt, request.azimuth, request.modelo_decomposicao
            )
            irradiation_type = "POA (Plano Inclinado)"
        else:
            logger.info("Usando irradiação horizontal (GHI)")
            irradiance_source = df_filtered['ghi']
            irradiation_type = "GHI (Horizontal)"

        # Calcular estatísticas mensais
        monthly_stats = self._calculate_monthly_statistics(irradiance_source)

        # Montar resposta
        return self._build_irradiation_response(
            monthly_stats, request, irradiation_type, len(df_filtered), actual_source
        )

    def _fetch_weather_data_with_fallback(self, lat: float, lon: float,
                                          preferred_source: str) -> tuple[pd.DataFrame, str]:
        """
        Busca dados meteorológicos com fallback automático entre fontes.

        Args:
            lat: Latitude
            lon: Longitude
            preferred_source: Fonte preferencial ('pvgis' ou 'nasa')

        Returns:
            Tuple (DataFrame, fonte_utilizada)

        Raises:
            CalculationError: Se ambas as fontes falharem
        """
        # Determinar ordem de tentativa
        if preferred_source == 'nasa':
            primary_service = self.nasa
            secondary_service = self.pvgis
            primary_name = 'NASA POWER'
            secondary_name = 'PVGIS'
            primary_error = NASAError
            secondary_error = PVGISError
        else:  # pvgis (default)
            primary_service = self.pvgis
            secondary_service = self.nasa
            primary_name = 'PVGIS'
            secondary_name = 'NASA POWER'
            primary_error = PVGISError
            secondary_error = NASAError

        # Tentar fonte primária
        try:
            logger.info(f"Tentando buscar dados de {primary_name}")
            df = primary_service.fetch_weather_data(lat, lon)
            logger.info(f"Dados obtidos com sucesso de {primary_name}")
            return df, primary_name

        except (primary_error, Exception) as e:
            logger.warning(f"Erro ao buscar dados de {primary_name}: {e}")

            # Verificar se fallback está habilitado
            if not settings.WEATHER_DATA_FALLBACK_ENABLED:
                logger.error(f"Fallback desabilitado. Falha ao obter dados de {primary_name}")
                raise CalculationError(
                    f"Falha ao obter dados de {primary_name} e fallback está desabilitado: {str(e)}"
                )

            # Tentar fonte secundária (fallback)
            try:
                logger.warning(f"Tentando fallback para {secondary_name}")
                df = secondary_service.fetch_weather_data(lat, lon)
                logger.info(f"Fallback bem-sucedido! Dados obtidos de {secondary_name}")
                return df, secondary_name

            except (secondary_error, Exception) as e2:
                logger.error(f"Fallback também falhou. Erro em {secondary_name}: {e2}")
                raise CalculationError(
                    f"Falha ao obter dados de ambas as fontes. "
                    f"{primary_name}: {str(e)}. {secondary_name}: {str(e2)}"
                )
    
    def _calculate_poa_irradiance(self, df: pd.DataFrame, lat: float, lon: float,
                                 tilt: float, azimuth: float, model: str) -> pd.Series:
        """
        Calcula irradiação no plano inclinado com cache geohash-based.

        Cache strategy for POA:
        1. Try geohash cache with parameters (tilt, azimuth, model)
        2. If found within radius, return cached POA
        3. If not found, calculate POA and cache with geohash
        4. Fallback to legacy cache if geohash fails

        Args:
            df: DataFrame with weather data
            lat: Latitude
            lon: Longitude
            tilt: Surface tilt angle (degrees)
            azimuth: Surface azimuth angle (degrees)
            model: Decomposition model (erbs, disc, etc.)

        Returns:
            Series with POA irradiance
        """
        # Validar modelo de decomposição
        model = validate_decomposition_model(model)

        # Verificar geohash cache para POA (novo sistema)
        cache_key_params = {
            'tilt': tilt, 'azimuth': azimuth, 'model': model, 'type': 'poa'
        }

        try:
            cached_poa = geohash_cache_manager.get(lat, lon, **cache_key_params)
            if cached_poa is not None:
                logger.info(f"Geohash cache HIT para POA (tilt={tilt}, azimuth={azimuth}, model={model})")
                return cached_poa
            else:
                logger.debug(f"Geohash cache MISS para POA")
        except Exception as e:
            logger.warning(f"Erro no geohash cache POA, tentando cache legado: {e}")
            # Fallback para cache legado
            cached_poa = cache_manager.get(lat, lon, prefix="poa", tilt=tilt, azimuth=azimuth, model=model)
            if cached_poa is not None:
                logger.info("POA encontrada no cache legado")
                return cached_poa

        try:
            # Decompor GHI em DNI/DHI
            df_decomposed = self._decompose_ghi(df, lat, lon, model)

            # Calcular irradiação no plano inclinado
            poa_components = irradiance.get_total_irradiance(
                surface_tilt=tilt,
                surface_azimuth=azimuth,
                solar_zenith=df_decomposed['solar_zenith'],
                solar_azimuth=df_decomposed['solar_azimuth'],
                dni=df_decomposed['dni'],
                ghi=df_decomposed['ghi'],
                dhi=df_decomposed['dhi'],
                dni_extra=df_decomposed['dni_extra'],
                model='perez'
            )

            poa_irradiance = poa_components['poa_global'].clip(lower=0)

            logger.info(f"POA calculada (máximo: {poa_irradiance.max():.0f} W/m²)")

            # Salvar em ambos os caches
            try:
                geohash_cache_manager.set(lat, lon, poa_irradiance, **cache_key_params)
                logger.debug(f"POA salva no geohash cache")
            except Exception as e:
                logger.warning(f"Erro ao salvar POA no geohash cache: {e}")

            # Também salvar no cache legado
            try:
                cache_manager.set(lat, lon, poa_irradiance, prefix="poa", tilt=tilt, azimuth=azimuth, model=model)
            except Exception as e:
                logger.warning(f"Erro ao salvar POA no cache legado: {e}")

            return poa_irradiance

        except Exception as e:
            logger.error(f"Erro no cálculo POA: {e}")
            raise CalculationError(f"Falha no cálculo de irradiação inclinada: {str(e)}")
    
    def _decompose_ghi(self, df: pd.DataFrame, lat: float, lon: float, model: str) -> pd.DataFrame:
        """Decompõe GHI em componentes DNI e DHI"""
        
        try:
            # Calcular posição solar
            solar_position = solarposition.get_solarposition(
                df.index, lat, lon,
                pressure=df['pressure'],
                temperature=df['temp_air']
            )
            
            # Aplicar modelo de decomposição
            if model == 'erbs':
                decomposed = irradiance.erbs(
                    ghi=df['ghi'],
                    zenith=solar_position['zenith'],
                    datetime_or_doy=df.index
                )
                df['dni'], df['dhi'] = decomposed['dni'], decomposed['dhi']
                
            elif model == 'disc':
                decomposed = irradiance.disc(
                    ghi=df['ghi'],
                    solar_zenith=solar_position['zenith'],
                    datetime_or_doy=df.index
                )
                df['dni'] = decomposed['dni']
                df['dhi'] = df['ghi'] - df['dni'] * np.cos(np.radians(solar_position['zenith']))
                
            else:
                # Outros modelos (dirint, orgill_hollands, etc.)
                decompose_func = getattr(irradiance, model)
                decomposed = decompose_func(
                    ghi=df['ghi'],
                    solar_zenith=solar_position['zenith'],
                    datetime_or_doy=df.index
                )
                df['dni'], df['dhi'] = decomposed['dni'], decomposed['dhi']
            
            # Adicionar posição solar
            df['solar_zenith'] = solar_position['zenith']
            df['solar_azimuth'] = solar_position['azimuth']
            
            # Calcular irradiância extraterrestre normal
            df['dni_extra'] = irradiance.get_extra_radiation(df.index, solar_position['zenith'])
            
            # Garantir valores físicos válidos
            df['dni'] = df['dni'].clip(lower=0)
            df['dhi'] = df['dhi'].clip(lower=0)
            
            return df
            
        except Exception as e:
            logger.error(f"Erro na decomposição ({model}): {e}")
            raise CalculationError(f"Falha na decomposição GHI: {str(e)}")
    
    def _calculate_monthly_statistics(self, irradiance_series: pd.Series) -> Dict[str, Any]:
        """Calcula estatísticas mensais de irradiação"""
        
        # Converter para kWh/m²/dia
        daily_irradiation = (irradiance_series / 1000).resample('D').sum()
        
        # Agrupar por mês
        monthly_mean = daily_irradiation.groupby(daily_irradiation.index.month).mean()
        monthly_std = daily_irradiation.groupby(daily_irradiation.index.month).std()
        
        # Criar array mensal
        monthly_array = [round(monthly_mean.get(month, 0), 2) for month in range(1, 13)]
        
        # Estatísticas principais
        annual_mean = monthly_mean.mean()
        max_value = monthly_mean.max()
        min_value = monthly_mean.min()
        max_month = monthly_mean.idxmax()
        min_month = monthly_mean.idxmin()
        
        # Variação sazonal
        seasonal_variation = ((max_value - min_value) / min_value) * 100
        
        # Dados com desvio padrão
        monthly_with_std = {
            self.month_names[month]: {
                'media': round(monthly_mean.get(month, 0), 2),
                'desvio': round(monthly_std.get(month, 0), 2)
            } for month in range(1, 13)
        }
        
        return {
            'annual_mean': annual_mean,
            'max_value': max_value, 'max_month': max_month,
            'min_value': min_value, 'min_month': min_month,
            'seasonal_variation': seasonal_variation,
            'monthly_array': monthly_array,
            'monthly_with_std': monthly_with_std
        }
    
    def _build_irradiation_response(self, stats: Dict[str, Any],
                                   request: IrradiationAnalysisRequest,
                                   irradiation_type: str,
                                   records_processed: int,
                                   actual_source: str) -> IrradiationAnalysisResponse:
        """Constrói resposta da análise de irradiação"""

        return IrradiationAnalysisResponse(
            media_anual=round(stats['annual_mean'], 2),
            maximo={
                'valor': round(stats['max_value'], 2),
                'mes': self.month_names[stats['max_month']],
                'mes_numero': stats['max_month']
            },
            minimo={
                'valor': round(stats['min_value'], 2),
                'mes': self.month_names[stats['min_month']],
                'mes_numero': stats['min_month']
            },
            variacao_sazonal=round(stats['seasonal_variation'], 0),
            irradiacao_mensal=stats['monthly_array'],
            irradiacao_com_desvio=stats['monthly_with_std'],
            configuracao={
                'tipo_irradiacao': irradiation_type,
                'tilt': request.tilt,
                'azimuth': request.azimuth,
                'modelo_decomposicao': request.modelo_decomposicao if (request.tilt > 0 or request.azimuth != 0) else None,
                'plano_inclinado': (request.tilt > 0 or request.azimuth != 0),
                'fonte_dados': actual_source
            },
            coordenadas={'lat': request.lat, 'lon': request.lon},
            periodo_analise={
                'inicio': '2005-01-01',
                'fim': '2020-12-31',
                'anos_completos': 16
            },
            registros_processados=records_processed
        )

# Instância singleton
solar_service = SolarService()
