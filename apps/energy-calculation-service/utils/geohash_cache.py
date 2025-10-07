"""
Geohashing-based cache system for PVGIS API optimization.

This module implements a spatial cache using geohashing to reduce redundant API calls
for nearby locations. The cache uses a 3x3 neighbor grid search to find cached data
within a configurable radius.
"""

import geohash as gh
import pickle
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta
from pathlib import Path
from math import radians, cos, sin, asin, sqrt

from core.config import settings
from core.exceptions import CacheError

logger = logging.getLogger(__name__)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth using Haversine formula.

    Args:
        lat1: Latitude of point 1 in decimal degrees
        lon1: Longitude of point 1 in decimal degrees
        lat2: Latitude of point 2 in decimal degrees
        lon2: Longitude of point 2 in decimal degrees

    Returns:
        Distance in kilometers

    Example:
        >>> haversine_distance(-23.5505, -46.6333, -23.5520, -46.6350)
        1.88  # approximately 1.88 km
    """
    # Convert decimal degrees to radians
    lon1_rad, lat1_rad, lon2_rad, lat2_rad = map(radians, [lon1, lat1, lon2, lat2])

    # Haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))

    # Radius of Earth in kilometers
    r = 6371.0

    return c * r


def encode_geohash(lat: float, lon: float, precision: int = None) -> str:
    """
    Generate geohash from latitude and longitude.

    Args:
        lat: Latitude in decimal degrees
        lon: Longitude in decimal degrees
        precision: Geohash precision (default from settings)

    Returns:
        Geohash string

    Precision guide:
        - 5 chars: ±2.4km (area ~4.9km × 4.9km) - Default
        - 6 chars: ±0.61km (area ~1.2km × 0.6km)
        - 7 chars: ±0.076km (area ~153m × 153m)

    Example:
        >>> encode_geohash(-23.5505, -46.6333, precision=5)
        '6gycf'
    """
    if precision is None:
        precision = settings.GEOHASH_PRECISION

    geohash_str = gh.encode(lat, lon, precision=precision)
    logger.debug(f"Encoded geohash for ({lat}, {lon}): {geohash_str} (precision={precision})")

    return geohash_str


def get_neighbors(geohash_str: str) -> List[str]:
    """
    Get all 8 neighboring geohash cells plus the center cell (3x3 grid).

    Args:
        geohash_str: The center geohash

    Returns:
        List of 9 geohashes (center + 8 neighbors)

    Grid layout:
        NW | N | NE
        ---+---+---
        W  | C | E
        ---+---+---
        SW | S | SE

    Example:
        >>> get_neighbors('6gycf')
        ['6gycf', '6gycg', '6gycu', '6gyce', '6gycs', '6gyc7', '6gyck', '6gycd', '6gyc9']
    """
    try:
        neighbors = gh.neighbors(geohash_str)

        # Return center + all 8 neighbors
        # Check if neighbors is a dict or list
        if isinstance(neighbors, dict):
            all_cells = [geohash_str] + list(neighbors.values())
        elif isinstance(neighbors, (list, tuple)):
            all_cells = [geohash_str] + list(neighbors)
        else:
            # Unknown type, convert to list
            all_cells = [geohash_str] + list(neighbors)

        logger.debug(f"Generated {len(all_cells)} cells for geohash {geohash_str}")
        return all_cells

    except Exception as e:
        logger.error(f"Error getting neighbors for {geohash_str}: {e}")
        # Fallback: return only the center cell
        return [geohash_str]


def decode_geohash(geohash_str: str) -> Tuple[float, float]:
    """
    Decode geohash to latitude and longitude.

    Args:
        geohash_str: Geohash string

    Returns:
        Tuple of (latitude, longitude)

    Example:
        >>> decode_geohash('6gycf')
        (-23.5498, -46.6357)
    """
    lat, lon = gh.decode(geohash_str)
    return lat, lon


class GeohashCacheManager:
    """
    Geohashing-based cache manager for PVGIS data.

    This cache system uses geohashing to efficiently store and retrieve weather data
    for nearby locations, significantly reducing API calls for projects in the same region.

    Key features:
    - Spatial indexing using geohashes (precision 5 = ~4.9km cells)
    - 3x3 neighbor search (covers ~44km² area)
    - Distance verification using haversine formula
    - Configurable cache radius (default 15km)
    - TTL support (default 30 days)
    """

    def __init__(self, cache_dir: Path = None):
        """
        Initialize the geohash cache manager.

        Args:
            cache_dir: Directory for cache storage (default from settings)
        """
        self.cache_dir = cache_dir or settings.CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Cache configuration
        self.geohash_precision = getattr(settings, 'GEOHASH_PRECISION', 5)
        self.cache_radius_km = getattr(settings, 'CACHE_RADIUS_KM', 15.0)
        self.ttl_days = getattr(settings, 'PVGIS_CACHE_TTL_DAYS', 30)

        logger.info(f"GeohashCacheManager initialized: precision={self.geohash_precision}, "
                   f"radius={self.cache_radius_km}km, ttl={self.ttl_days}days")

    def _create_cache_key(self, geohash_str: str, **params) -> str:
        """
        Create cache key combining geohash and parameters.

        Format: pvgis:{geohash}:{tilt}:{azimuth}:{technology}

        Args:
            geohash_str: Geohash for the location
            **params: Additional parameters (tilt, azimuth, technology, etc.)

        Returns:
            Cache key string

        Example:
            >>> _create_cache_key('6gycf', tilt=20, azimuth=0, technology='crystSi')
            'pvgis:6gycf:tilt_20:azimuth_0:technology_crystSi'
        """
        key_parts = ['pvgis', geohash_str]

        # Sort parameters for consistent keys
        for key, value in sorted(params.items()):
            if value is not None:
                key_parts.append(f"{key}_{value}")

        cache_key = ':'.join(str(p) for p in key_parts)
        return cache_key

    def _get_cache_filepath(self, cache_key: str) -> Path:
        """Get full path for cache file."""
        # Use hash to avoid filesystem issues with long keys
        import hashlib
        key_hash = hashlib.md5(cache_key.encode()).hexdigest()
        filename = f"geohash_{key_hash}.pkl"
        return self.cache_dir / filename

    def _is_cache_valid(self, filepath: Path) -> bool:
        """
        Check if cache file exists and has not expired.

        Args:
            filepath: Path to cache file

        Returns:
            True if cache is valid and not expired
        """
        if not filepath.exists():
            return False

        # Check TTL
        file_age = datetime.now() - datetime.fromtimestamp(filepath.stat().st_mtime)
        ttl_seconds = self.ttl_days * 24 * 3600

        if file_age.total_seconds() > ttl_seconds:
            logger.debug(f"Cache expired: {filepath} (age: {file_age.days} days)")
            try:
                filepath.unlink()  # Remove expired file
            except Exception as e:
                logger.warning(f"Could not remove expired cache: {e}")
            return False

        return True

    def get(self, lat: float, lon: float, **params) -> Optional[Any]:
        """
        Retrieve data from cache using geohash-based neighbor search.

        Search strategy:
        1. Generate geohash for target location
        2. Get current cell + 8 neighbors (3x3 grid)
        3. Search each cell for cached data
        4. Verify distance is within radius using haversine
        5. Return closest match if found

        Args:
            lat: Target latitude
            lon: Target longitude
            **params: Additional cache parameters (tilt, azimuth, etc.)

        Returns:
            Cached data if found within radius, None otherwise

        Example:
            >>> cache.get(-23.5505, -46.6333, tilt=20, azimuth=0)
            <cached_data>  # If found within 15km
        """
        try:
            # Generate geohash for target location
            target_geohash = encode_geohash(lat, lon, precision=self.geohash_precision)

            # Get all neighbor cells (3x3 grid)
            neighbor_cells = get_neighbors(target_geohash)

            logger.debug(f"Searching cache in {len(neighbor_cells)} cells for ({lat}, {lon})")

            closest_match = None
            closest_distance = float('inf')

            # Search in all neighbor cells
            for cell_geohash in neighbor_cells:
                cache_key = self._create_cache_key(cell_geohash, **params)
                cache_file = self._get_cache_filepath(cache_key)

                # Check if cache file is valid
                if not self._is_cache_valid(cache_file):
                    continue

                # Load cached data
                try:
                    with open(cache_file, 'rb') as f:
                        cached_entry = pickle.load(f)

                    cached_lat = cached_entry['lat']
                    cached_lon = cached_entry['lon']

                    # Calculate distance to cached location
                    distance = haversine_distance(lat, lon, cached_lat, cached_lon)

                    logger.debug(f"Found cache in cell {cell_geohash}: distance={distance:.2f}km")

                    # Check if within radius and closer than previous matches
                    if distance <= self.cache_radius_km and distance < closest_distance:
                        closest_match = cached_entry
                        closest_distance = distance

                except Exception as e:
                    logger.warning(f"Error reading cache file {cache_file}: {e}")
                    continue

            # Return closest match if found
            if closest_match is not None:
                logger.info(f"Cache HIT: Found data at {closest_distance:.2f}km from target "
                           f"({lat}, {lon}) in cell {encode_geohash(closest_match['lat'], closest_match['lon'])}")
                return closest_match['data']

            logger.debug(f"Cache MISS: No data found within {self.cache_radius_km}km of ({lat}, {lon})")
            return None

        except Exception as e:
            logger.error(f"Error in geohash cache get: {e}")
            # Fallback gracefully - don't break the application
            return None

    def set(self, lat: float, lon: float, data: Any, **params) -> bool:
        """
        Store data in cache with geohash key.

        The cached entry includes:
        - Original latitude/longitude (for distance verification)
        - Timestamp (for TTL)
        - Actual data

        Args:
            lat: Latitude of the data
            lon: Longitude of the data
            data: Data to cache
            **params: Additional parameters for cache key

        Returns:
            True if successfully cached, False otherwise

        Example:
            >>> cache.set(-23.5505, -46.6333, pvgis_data, tilt=20, azimuth=0)
            True
        """
        try:
            # Generate geohash for this location
            geohash_str = encode_geohash(lat, lon, precision=self.geohash_precision)

            # Create cache key
            cache_key = self._create_cache_key(geohash_str, **params)
            cache_file = self._get_cache_filepath(cache_key)

            # Create cache entry with metadata
            cache_entry = {
                'lat': lat,
                'lon': lon,
                'geohash': geohash_str,
                'timestamp': datetime.now().isoformat(),
                'params': params,
                'data': data
            }

            # Save to disk
            with open(cache_file, 'wb') as f:
                pickle.dump(cache_entry, f)

            logger.info(f"Cache SET: Saved data for ({lat}, {lon}) with geohash {geohash_str}")
            logger.debug(f"Cache file: {cache_file}")

            return True

        except Exception as e:
            logger.error(f"Error in geohash cache set: {e}")
            # Don't raise - cache failures shouldn't break the application
            return False

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the geohash cache.

        Returns:
            Dictionary with cache statistics including:
            - total_files: Number of cache files
            - total_size_mb: Total cache size in MB
            - oldest_file: Date of oldest cache entry
            - newest_file: Date of newest cache entry
            - cache_dir: Cache directory path
            - config: Cache configuration
        """
        try:
            files = list(self.cache_dir.glob("geohash_*.pkl"))
            total_files = len(files)

            if total_files == 0:
                return {
                    "total_files": 0,
                    "total_size_mb": 0.0,
                    "oldest_file": None,
                    "newest_file": None,
                    "cache_dir": str(self.cache_dir),
                    "config": {
                        "geohash_precision": self.geohash_precision,
                        "cache_radius_km": self.cache_radius_km,
                        "ttl_days": self.ttl_days
                    }
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
                "cache_dir": str(self.cache_dir),
                "config": {
                    "geohash_precision": self.geohash_precision,
                    "cache_radius_km": self.cache_radius_km,
                    "ttl_days": self.ttl_days
                }
            }

        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"error": str(e)}

    def clear_expired(self) -> int:
        """
        Remove expired cache files.

        Returns:
            Number of files removed
        """
        try:
            removed_count = 0
            files = list(self.cache_dir.glob("geohash_*.pkl"))

            for cache_file in files:
                if not self._is_cache_valid(cache_file):
                    removed_count += 1

            if removed_count > 0:
                logger.info(f"Cleared {removed_count} expired cache files")

            return removed_count

        except Exception as e:
            logger.error(f"Error clearing expired cache: {e}")
            return 0

    def clear_all(self) -> int:
        """
        Remove all geohash cache files.

        Returns:
            Number of files removed
        """
        try:
            removed_count = 0
            files = list(self.cache_dir.glob("geohash_*.pkl"))

            for cache_file in files:
                try:
                    cache_file.unlink()
                    removed_count += 1
                except Exception as e:
                    logger.warning(f"Could not remove {cache_file}: {e}")

            logger.info(f"Cleared all geohash cache: {removed_count} files removed")
            return removed_count

        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return 0


# Global instance
geohash_cache_manager = GeohashCacheManager()
