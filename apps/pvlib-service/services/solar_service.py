import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Optional
from pvlib import irradiance, solarposition

from core.config import settings
from core.exceptions import CalculationError, ValidationError
from models.requests import IrradiationAnalysisRequest
from models.responses import IrradiationAnalysisResponse
from services.pvgis_service import pvgis_service
from utils.validators import validate_decomposition_model
from utils.cache import cache_manager

logger = logging.getLogger(__name__)

class SolarService:
    """Service para análise de irradiação solar"""
    
    def __init__(self):
        self.pvgis = pvgis_service
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
        
        # Determinar se precisa usar plano inclinado
        use_tilted_plane = (request.tilt > 0) or (request.azimuth != 0)
        
        # Buscar dados meteorológicos
        df = self.pvgis.fetch_weather_data(request.lat, request.lon)
        
        # Filtrar anos completos (2005-2020)
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
            monthly_stats, request, irradiation_type, len(df_filtered)
        )
    
    def _calculate_poa_irradiance(self, df: pd.DataFrame, lat: float, lon: float, 
                                 tilt: float, azimuth: float, model: str) -> pd.Series:
        """Calcula irradiação no plano inclinado"""
        
        # Validar modelo de decomposição
        model = validate_decomposition_model(model)
        
        # Verificar cache para POA
        cache_key_params = {
            'tilt': tilt, 'azimuth': azimuth, 'model': model
        }
        
        cached_poa = cache_manager.get(lat, lon, prefix="poa", **cache_key_params)
        if cached_poa is not None:
            logger.info("POA encontrada no cache")
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
            
            # Salvar no cache
            cache_manager.set(lat, lon, poa_irradiance, prefix="poa", **cache_key_params)
            
            logger.info(f"POA calculada (máximo: {poa_irradiance.max():.0f} W/m²)")
            
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
                                   records_processed: int) -> IrradiationAnalysisResponse:
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
                'plano_inclinado': (request.tilt > 0 or request.azimuth != 0)
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
