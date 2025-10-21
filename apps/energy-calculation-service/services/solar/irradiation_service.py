"""
Serviço de análise de irradiação solar
Recuperado do git histórico para manter funcionalidade do endpoint /irradiation/monthly
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Tuple

from models.solar.requests import IrradiationAnalysisRequest
from models.solar.responses import IrradiationAnalysisResponse, PeriodAnalysis, MaxMinValue, IrradiationConfiguration, Coordinates
from core.config import settings
from core.exceptions import CalculationError, PVGISError, NASAError
from services.solar.pvgis_service import pvgis_service
from services.solar.nasa_service import nasa_service

from utils.geohash_cache import geohash_cache_manager

def validate_decomposition_model(model: str) -> str:
    """Valida modelo de decomposição"""
    valid_models = ["erbs", "disc", "louche", "dirint"]
    return model.lower() if model.lower() in valid_models else "erbs"
import pvlib

logger = logging.getLogger(__name__)


class IrradiationService:
    """Serviço para análise de irradiação solar"""
    
    def __init__(self):
        self.pvgis = pvgis_service
        self.nasa = nasa_service

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
        
        # Log claro sobre fonte utilizada vs solicitada
        # Normalizar comparação (request.data_source é 'nasa'/'pvgis', actual_source é 'NASA POWER'/'PVGIS')
        requested_normalized = request.data_source.lower()
        actual_normalized = actual_source.lower().replace(' power', '').replace(' ', '')
        
        if actual_normalized != requested_normalized:
            logger.warning(f"FALLBACK: Fonte solicitada ({request.data_source}) não disponível, usando ({actual_source})")
        else:
            logger.info(f"Sucesso: Utilizando fonte de dados {actual_source} conforme solicitado")

        # Filtrar anos completos (2005-2020 ou disponível)
        df_filtered = df[df.index.year >= 2005]

        if len(df_filtered) == 0:
            raise CalculationError("Nenhum dado válido encontrado para o período")

        # Escolher fonte de irradiação
        if use_tilted_plane:
            logger.info(f"Calculando irradiação no plano inclinado ({request.tilt}°, {request.azimuth}°) com dados {actual_source}")
            irradiance_source = self._calculate_poa_irradiance(
                df_filtered, request.lat, request.lon,
                request.tilt, request.azimuth, request.modelo_decomposicao, actual_source
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
                                          preferred_source: str) -> Tuple[pd.DataFrame, str]:
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
                                 tilt: float, azimuth: float, model: str, source: str = 'unknown') -> pd.Series:
        """Calcula irradiação no plano inclinado"""
        
        # Validar modelo de decomposição
        model = validate_decomposition_model(model)

        # Verificar geohash cache para POA - incluir fonte de dados para diferenciar
        cache_key_params = {
            'tilt': tilt, 'azimuth': azimuth, 'model': model, 'type': 'poa', 'source': source
        }

        try:
            cached_poa = geohash_cache_manager.get(lat, lon, **cache_key_params)
            if cached_poa is not None:
                logger.info(f"Geohash cache HIT para POA (tilt={tilt}, azimuth={azimuth}, model={model}, source={source})")
                return cached_poa
            else:
                logger.debug(f"Geohash cache MISS para POA (source={source})")
        except Exception as e:
            logger.warning(f"Erro no geohash cache POA (source={source}): {e}")

        # Calcular posição solar
        solar_pos = pvlib.solarposition.get_solarposition(df.index, lat, lon)

        # Decompor se necessário
        if df['dni'].sum() == 0:
            logger.info(f"Decompondo GHI usando modelo {model}")
            df = self._decompose_ghi(df, lat, lon, model)

        # Calcular POA
        poa_irrad = pvlib.irradiance.get_total_irradiance(
            tilt, azimuth,
            solar_pos['apparent_zenith'], solar_pos['azimuth'],
            df['dni'], df['ghi'], df['dhi'],
            model='isotropic'
        )

        poa_global = poa_irrad['poa_global']

        # Cachear resultado
        try:
            geohash_cache_manager.set(lat, lon, poa_global, **cache_key_params)
            logger.info(f"POA cacheado com sucesso no geohash cache (source={source})")
        except Exception as e:
            logger.warning(f"Erro ao cachear POA (source={source}): {e}")

        return poa_global

    def _decompose_ghi(self, df: pd.DataFrame, lat: float, lon: float, model: str) -> pd.DataFrame:
        """Decompõe GHI em DNI e DHI"""
        
        solar_pos = pvlib.solarposition.get_solarposition(df.index, lat, lon)
        
        if model == 'erbs':
            decomp = pvlib.irradiance.erbs(df['ghi'], solar_pos['zenith'], df.index)
        elif model == 'disc':
            decomp = pvlib.irradiance.disc(df['ghi'], solar_pos['zenith'], df.index)
        elif model == 'louche':
            decomp = pvlib.irradiance.louche(df['ghi'], solar_pos['zenith'], df.index)
        else:
            decomp = pvlib.irradiance.erbs(df['ghi'], solar_pos['zenith'], df.index)
        
        df['dni'] = decomp['dni']
        df['dhi'] = decomp['dhi']
        
        return df

    def _calculate_monthly_statistics(self, irradiance_series: pd.Series) -> Dict[str, Any]:
        """Calcula estatísticas mensais de irradiação"""

        # Converter W/m² para kWh/m²/dia
        daily_kwh = irradiance_series.groupby(irradiance_series.index.date).sum() / 1000.0

        # Converter índice para datetime se necessário
        if not isinstance(daily_kwh.index, pd.DatetimeIndex):
            daily_kwh.index = pd.to_datetime(daily_kwh.index)

        # Agrupar por mês
        monthly_kwh = daily_kwh.groupby(daily_kwh.index.month).mean()

        # Estatísticas anuais
        annual_avg = monthly_kwh.mean()

        return {
            'monthly_kwh': monthly_kwh.to_dict(),
            'annual_avg': annual_avg,
            'total_annual': monthly_kwh.sum() * 30.4167,  # média de dias por mês
            'max_month': monthly_kwh.idxmax(),
            'min_month': monthly_kwh.idxmin(),
            'max_value': monthly_kwh.max(),
            'min_value': monthly_kwh.min()
        }

    def _build_irradiation_response(self, stats: Dict[str, Any],
                                    request: IrradiationAnalysisRequest,
                                    irradiation_type: str,
                                    data_hours: int,
                                    actual_source: str) -> IrradiationAnalysisResponse:
        """Monta resposta da análise"""

        meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        monthly_dict = stats['monthly_kwh']

        # Criar lista ordenada por mês
        monthly_list = [monthly_dict.get(i, 0.0) for i in range(1, 13)]

        # Calcular variação sazonal
        max_val = stats['max_value']
        min_val = stats['min_value']
        variacao_sazonal = ((max_val - min_val) / stats['annual_avg']) * 100.0 if stats['annual_avg'] > 0 else 0.0

        # Criar dicionário com média e desvio padrão (usando 0 para desvio já que não temos múltiplos anos)
        irradiacao_com_desvio = {
            mes: {"media": val, "desvio_padrao": 0.0}
            for mes, val in zip(meses, monthly_list)
        }

        # Período de análise
        periodo = PeriodAnalysis(
            inicio=f"{request.startyear}-01-01",
            fim=f"{request.endyear}-12-31",
            anos_completos=request.endyear - request.startyear + 1
        )

        # Determinar se foi usado plano inclinado
        plano_inclinado = (request.tilt > 0) or (request.azimuth != 0)

        return IrradiationAnalysisResponse(
            media_anual=stats['annual_avg'],
            maximo=MaxMinValue(
                valor=max_val,
                mes=meses[stats['max_month'] - 1],
                mes_numero=stats['max_month']
            ),
            minimo=MaxMinValue(
                valor=min_val,
                mes=meses[stats['min_month'] - 1],
                mes_numero=stats['min_month']
            ),
            variacao_sazonal=variacao_sazonal,
            irradiacao_mensal=monthly_list,
            irradiacao_com_desvio=irradiacao_com_desvio,
            configuracao=IrradiationConfiguration(
                tipo_irradiacao=irradiation_type,
                tilt=request.tilt,
                azimuth=request.azimuth,
                modelo_decomposicao=request.modelo_decomposicao,
                plano_inclinado=plano_inclinado,
                fonte_dados=actual_source
            ),
            coordenadas=Coordinates(lat=request.lat, lon=request.lon),
            periodo_analise=periodo,
            registros_processados=data_hours
        )


# Instância singleton
irradiation_service = IrradiationService()
