"""
Weather Data Normalizer

This module provides utilities to normalize weather data from different sources
(PVGIS, NASA POWER) into a standardized format for consistent processing.
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class StandardizedWeatherData:
    """
    Standardized weather data structure that all sources conform to.

    This ensures that regardless of the data source (PVGIS, NASA POWER, etc.),
    the downstream processing code receives data in a consistent format.
    """

    def __init__(
        self,
        dataframe: pd.DataFrame,
        source: str,
        latitude: float,
        longitude: float,
        elevation: Optional[float] = None,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize standardized weather data.

        Args:
            dataframe: DataFrame with datetime index and columns: ghi, temp_air, wind_speed, pressure
            source: Data source identifier ("pvgis", "nasa", etc.)
            latitude: Latitude of the location
            longitude: Longitude of the location
            elevation: Elevation in meters (if available)
            year_min: Minimum year in dataset
            year_max: Maximum year in dataset
            metadata: Additional metadata dictionary
        """
        self.dataframe = dataframe
        self.source = source
        self.latitude = latitude
        self.longitude = longitude
        self.elevation = elevation
        self.year_min = year_min or dataframe.index.year.min()
        self.year_max = year_max or dataframe.index.year.max()
        self.metadata = metadata or {}

        # Validate required columns
        self._validate_dataframe()

    def _validate_dataframe(self):
        """Validate that DataFrame has required columns and structure."""
        required_columns = {'ghi', 'temp_air', 'wind_speed', 'pressure'}
        optional_columns = {'dni', 'dhi'}  # DNI/DHI são opcionais mas desejáveis
        
        missing_columns = required_columns - set(self.dataframe.columns)
        if missing_columns:
            raise ValueError(f"DataFrame missing required columns: {missing_columns}")

        # Verificar se DNI/DHI estão disponíveis (log informativo)
        available_optional = optional_columns & set(self.dataframe.columns)
        if available_optional:
            logger.debug(f"DNI/DHI disponíveis no DataFrame: {available_optional}")

        if not isinstance(self.dataframe.index, pd.DatetimeIndex):
            raise ValueError("DataFrame index must be DatetimeIndex")

    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics about the weather data."""
        df = self.dataframe

        return {
            "source": self.source,
            "coordenadas": {
                "lat": self.latitude,
                "lon": self.longitude,
                "elevation": self.elevation
            },
            "periodo": {
                "inicio": df.index.min().strftime('%Y-%m-%d'),
                "fim": df.index.max().strftime('%Y-%m-%d'),
                "total_registros": len(df),
                "anos_processados": sorted(df.index.year.unique().tolist()),
                "year_min": self.year_min,
                "year_max": self.year_max
            },
            "estatisticas": {
                "ghi_medio": round(df['ghi'].mean(), 1),
                "ghi_maximo": round(df['ghi'].max(), 1),
                "temp_media": round(df['temp_air'].mean(), 1),
                "temp_min": round(df['temp_air'].min(), 1),
                "temp_max": round(df['temp_air'].max(), 1),
                "vento_medio": round(df['wind_speed'].mean(), 1)
            },
            "metadata": self.metadata
        }


def normalize_pvgis_data(
    raw_dataframe: pd.DataFrame,
    latitude: float,
    longitude: float,
    metadata: Optional[Dict[str, Any]] = None
) -> StandardizedWeatherData:
    """
    Transform PVGIS DataFrame to standardized format.

    PVGIS data is already in the correct format from pvgis_service.py,
    so this is mostly a wrapper to create the StandardizedWeatherData object.

    Args:
        raw_dataframe: DataFrame from PVGIS with columns: ghi, temp_air, wind_speed, pressure
        latitude: Latitude of the location
        longitude: Longitude of the location
        metadata: Additional metadata

    Returns:
        StandardizedWeatherData object

    Raises:
        ValueError: If data is invalid or missing required columns
    """
    try:
        logger.info(f"Normalizing PVGIS data: {len(raw_dataframe)} records")

        # PVGIS data is already processed by pvgis_service, so we just validate and wrap
        required_cols = {'ghi', 'temp_air', 'wind_speed', 'pressure'}
        if not required_cols.issubset(raw_dataframe.columns):
            raise ValueError(f"PVGIS data missing required columns: {required_cols - set(raw_dataframe.columns)}")

        # Extract year range
        year_min = raw_dataframe.index.year.min()
        year_max = raw_dataframe.index.year.max()

        # Build metadata
        full_metadata = {
            "api": "PVGIS",
            "api_version": "v5_2",
            "temporal_resolution": "hourly",
            **(metadata or {})
        }

        standardized = StandardizedWeatherData(
            dataframe=raw_dataframe.copy(),
            source="pvgis",
            latitude=latitude,
            longitude=longitude,
            elevation=None,  # PVGIS doesn't provide elevation in the data we use
            year_min=year_min,
            year_max=year_max,
            metadata=full_metadata
        )

        logger.info(f"PVGIS data normalized: {year_min}-{year_max}, {len(raw_dataframe)} records")
        return standardized

    except Exception as e:
        logger.error(f"Error normalizing PVGIS data: {e}")
        raise ValueError(f"Failed to normalize PVGIS data: {str(e)}")


def normalize_nasa_data(
    raw_dataframe: pd.DataFrame,
    latitude: float,
    longitude: float,
    metadata: Optional[Dict[str, Any]] = None
) -> StandardizedWeatherData:
    """
    Transform NASA POWER DataFrame to standardized format.

    NASA POWER provides data in a different format than PVGIS, so we need to:
    1. Rename columns to match our standard
    2. Convert units if needed
    3. Handle missing data
    4. Ensure timezone consistency

    NASA POWER columns (typical):
    - GHI: Global Horizontal Irradiance (W/m²)
    - DNI: Direct Normal Irradiance (W/m²)
    - DHI: Diffuse Horizontal Irradiance (W/m²)
    - T2M: Temperature at 2 meters (°C)
    - WS10M: Wind speed at 10 meters (m/s)
    - PRECTOTCORR: Precipitation (mm/hour)

    Args:
        raw_dataframe: DataFrame from NASA POWER (pvlib.iotools.get_nasa_power)
        latitude: Latitude of the location
        longitude: Longitude of the location
        metadata: Additional metadata

    Returns:
        StandardizedWeatherData object

    Raises:
        ValueError: If data is invalid or missing required columns
    """
    try:
        logger.info(f"Normalizing NASA POWER data: {len(raw_dataframe)} records")

        # Create a copy to avoid modifying original
        df = raw_dataframe.copy()

        # NASA POWER column mapping (case-insensitive check)
        df.columns = df.columns.str.upper()

        # Map NASA POWER columns to our standard format
        # AGORA INCLUINDO DNI E DHI!
        column_mapping = {
            'GHI': 'ghi',
            'DNI': 'dni',  # ✅ Direct Normal Irradiance do NASA POWER
            'DHI': 'dhi',  # ✅ Diffuse Horizontal Irradiance do NASA POWER
            'T2M': 'temp_air',
            'TAMB': 'temp_air',  # Alternative name
            'TEMP_AIR': 'temp_air',  # Already mapped by pvlib map_variables=True
            'WS10M': 'wind_speed',
            'WS': 'wind_speed',  # Alternative name
            'WIND_SPEED': 'wind_speed',  # Already mapped by pvlib map_variables=True
        }

        # Rename columns
        normalized_df = pd.DataFrame(index=df.index)

        for nasa_col, standard_col in column_mapping.items():
            if nasa_col in df.columns:
                normalized_df[standard_col] = df[nasa_col]
                logger.debug(f"Mapped NASA column {nasa_col} -> {standard_col}")

        # Check for required columns (DNI/DHI são opcionais mas desejáveis)
        required_columns = {'ghi', 'temp_air', 'wind_speed'}
        optional_columns = {'dni', 'dhi'}
        
        missing_columns = required_columns - set(normalized_df.columns)
        if missing_columns:
            raise ValueError(f"NASA POWER data missing required columns: {missing_columns}")
        
        # Logar se DNI/DHI estão disponíveis
        available_optional = optional_columns & set(normalized_df.columns)
        if available_optional:
            logger.info(f"✅ NASA POWER DNI/DHI disponíveis: {available_optional}")
        else:
            logger.info("⚠️ NASA POWER DNI/DHI não disponíveis, será necessária decomposição")

        # Add pressure (standard atmospheric pressure if not available)
        if 'pressure' not in normalized_df.columns:
            if 'PS' in df.columns:  # Surface pressure in Pa
                normalized_df['pressure'] = df['PS']
            else:
                # Standard atmospheric pressure at sea level
                normalized_df['pressure'] = 101325.0
                logger.debug("Using standard atmospheric pressure (101325 Pa)")

        # Validate and clean data
        normalized_df = _clean_weather_data(normalized_df)

        # Ensure timezone awareness (NASA POWER is typically UTC)
        if normalized_df.index.tz is None:
            normalized_df.index = normalized_df.index.tz_localize('UTC')
            logger.debug("Localized NASA data to UTC")

        # Convert to America/Sao_Paulo for consistency with PVGIS
        normalized_df.index = normalized_df.index.tz_convert('America/Sao_Paulo')
        logger.debug("Converted NASA data timezone to America/Sao_Paulo")

        # Extract year range
        year_min = normalized_df.index.year.min()
        year_max = normalized_df.index.year.max()

        # Extract elevation if available from metadata
        elevation = None
        if metadata and 'elevation' in metadata:
            elevation = metadata['elevation']

        # Build metadata
        full_metadata = {
            "api": "NASA POWER",
            "temporal_resolution": "hourly",
            "dataset": metadata.get('dataset', 'PSM3') if metadata else 'PSM3',
            "source_columns": list(df.columns),
            **(metadata or {})
        }

        standardized = StandardizedWeatherData(
            dataframe=normalized_df,
            source="nasa",
            latitude=latitude,
            longitude=longitude,
            elevation=elevation,
            year_min=year_min,
            year_max=year_max,
            metadata=full_metadata
        )

        logger.info(f"NASA POWER data normalized: {year_min}-{year_max}, {len(normalized_df)} records")
        return standardized

    except Exception as e:
        logger.error(f"Error normalizing NASA POWER data: {e}")
        raise ValueError(f"Failed to normalize NASA POWER data: {str(e)}")


def _clean_weather_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and validate weather data.

    Args:
        df: DataFrame with weather data

    Returns:
        Cleaned DataFrame
    """
    # Define valid ranges
    valid_ranges = {
        'ghi': (0, 1500),      # W/m²
        'temp_air': (-50, 60),  # °C
        'wind_speed': (0, 50),  # m/s
        'pressure': (70000, 110000)  # Pa
    }

    for col, (min_val, max_val) in valid_ranges.items():
        if col in df.columns:
            # Count invalid values
            invalid_mask = (df[col] < min_val) | (df[col] > max_val) | df[col].isna()
            invalid_count = invalid_mask.sum()

            if invalid_count > 0:
                logger.warning(f"Found {invalid_count} invalid {col} values, clipping to valid range")

                # Replace invalid values with NaN, then interpolate
                df.loc[invalid_mask, col] = np.nan
                df[col] = df[col].interpolate(method='linear', limit=24)  # Interpolate up to 24 hours

                # Fill any remaining NaNs with median
                if df[col].isna().any():
                    median_val = df[col].median()
                    df[col] = df[col].fillna(median_val)
                    logger.debug(f"Filled remaining NaN in {col} with median: {median_val:.2f}")

                # Final clipping to ensure valid range
                df[col] = df[col].clip(lower=min_val, upper=max_val)

    return df


def compare_data_sources(
    pvgis_data: StandardizedWeatherData,
    nasa_data: StandardizedWeatherData
) -> Dict[str, Any]:
    """
    Compare two weather data sources to assess differences.

    Useful for validation and quality control.

    Args:
        pvgis_data: Standardized PVGIS data
        nasa_data: Standardized NASA POWER data

    Returns:
        Dictionary with comparison statistics
    """
    try:
        # Find common time period
        pvgis_df = pvgis_data.dataframe
        nasa_df = nasa_data.dataframe

        common_start = max(pvgis_df.index.min(), nasa_df.index.min())
        common_end = min(pvgis_df.index.max(), nasa_df.index.max())

        # Filter to common period
        pvgis_common = pvgis_df[(pvgis_df.index >= common_start) & (pvgis_df.index <= common_end)]
        nasa_common = nasa_df[(nasa_df.index >= common_start) & (nasa_df.index <= common_end)]

        # Resample to daily for fair comparison (both might have different temporal resolutions)
        pvgis_daily = pvgis_common['ghi'].resample('D').mean()
        nasa_daily = nasa_common['ghi'].resample('D').mean()

        # Calculate differences
        common_dates = pvgis_daily.index.intersection(nasa_daily.index)

        if len(common_dates) == 0:
            return {
                "error": "No overlapping data between sources",
                "pvgis_period": f"{pvgis_df.index.min()} to {pvgis_df.index.max()}",
                "nasa_period": f"{nasa_df.index.min()} to {nasa_df.index.max()}"
            }

        pvgis_values = pvgis_daily.loc[common_dates]
        nasa_values = nasa_daily.loc[common_dates]

        differences = pvgis_values - nasa_values
        relative_diff = (differences / pvgis_values * 100).dropna()

        return {
            "common_period": {
                "start": common_start.strftime('%Y-%m-%d'),
                "end": common_end.strftime('%Y-%m-%d'),
                "days": len(common_dates)
            },
            "ghi_comparison": {
                "pvgis_mean": round(pvgis_values.mean(), 2),
                "nasa_mean": round(nasa_values.mean(), 2),
                "mean_absolute_diff": round(abs(differences).mean(), 2),
                "mean_relative_diff_pct": round(relative_diff.mean(), 2),
                "max_absolute_diff": round(abs(differences).max(), 2),
                "correlation": round(pvgis_values.corr(nasa_values), 4)
            },
            "recommendation": _get_comparison_recommendation(relative_diff.mean())
        }

    except Exception as e:
        logger.error(f"Error comparing data sources: {e}")
        return {"error": str(e)}


def _get_comparison_recommendation(mean_relative_diff: float) -> str:
    """Get recommendation based on comparison results."""
    abs_diff = abs(mean_relative_diff)

    if abs_diff < 5:
        return "Excellent agreement between sources (< 5% difference)"
    elif abs_diff < 10:
        return "Good agreement between sources (5-10% difference)"
    elif abs_diff < 15:
        return "Acceptable agreement (10-15% difference) - consider local factors"
    else:
        return "Significant differences (> 15%) - verify location and data quality"
