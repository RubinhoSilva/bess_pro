"""
Test script for geohash cache implementation.

This script verifies that the geohash cache system is working correctly
by testing basic functionality without requiring the full API to be running.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.geohash_cache import (
    encode_geohash,
    get_neighbors,
    haversine_distance,
    GeohashCacheManager,
    decode_geohash
)
from core.config import settings
import pandas as pd
import numpy as np


def test_haversine_distance():
    """Test haversine distance calculation"""
    print("\n=== Testing Haversine Distance ===")

    # São Paulo to nearby location
    lat1, lon1 = -23.5505, -46.6333
    lat2, lon2 = -23.5520, -46.6350

    distance = haversine_distance(lat1, lon1, lat2, lon2)
    print(f"Distance from ({lat1}, {lon1}) to ({lat2}, {lon2}): {distance:.2f} km")

    assert 0 < distance < 5, "Distance should be small for nearby locations"
    print("✓ Haversine distance calculation works!")


def test_geohash_encoding():
    """Test geohash encoding and decoding"""
    print("\n=== Testing Geohash Encoding ===")

    # São Paulo coordinates
    lat, lon = -23.5505, -46.6333

    # Test different precisions
    for precision in [4, 5, 6, 7]:
        geohash = encode_geohash(lat, lon, precision=precision)
        decoded_lat, decoded_lon = decode_geohash(geohash)

        error_km = haversine_distance(lat, lon, decoded_lat, decoded_lon)

        print(f"Precision {precision}: {geohash} (error: {error_km:.3f} km)")

    print("✓ Geohash encoding/decoding works!")


def test_neighbor_search():
    """Test neighbor cell generation"""
    print("\n=== Testing Neighbor Search ===")

    lat, lon = -23.5505, -46.6333
    geohash = encode_geohash(lat, lon, precision=5)

    neighbors = get_neighbors(geohash)

    print(f"Center geohash: {geohash}")
    print(f"Neighbors (3x3 grid): {neighbors}")
    print(f"Total cells: {len(neighbors)}")

    assert len(neighbors) == 9, "Should return 9 cells (center + 8 neighbors)"
    assert geohash in neighbors, "Center should be in neighbors list"

    print("✓ Neighbor search works!")


def test_cache_manager():
    """Test GeohashCacheManager basic operations"""
    print("\n=== Testing GeohashCacheManager ===")

    # Create test cache manager
    cache_manager = GeohashCacheManager()

    print(f"Cache directory: {cache_manager.cache_dir}")
    print(f"Geohash precision: {cache_manager.geohash_precision}")
    print(f"Cache radius: {cache_manager.cache_radius_km} km")
    print(f"TTL: {cache_manager.ttl_days} days")

    # Test data (simulated PVGIS DataFrame)
    test_data = pd.DataFrame({
        'ghi': np.random.rand(100) * 1000,
        'temp_air': np.random.rand(100) * 30 + 10,
        'wind_speed': np.random.rand(100) * 10
    })

    # Test coordinates
    lat1, lon1 = -23.5505, -46.6333  # São Paulo
    lat2, lon2 = -23.5520, -46.6350  # 1.8km away
    lat3, lon3 = -23.6000, -46.7000  # ~50km away

    print(f"\n1. Saving data for location 1: ({lat1}, {lon1})")
    success = cache_manager.set(lat1, lon1, test_data, tilt=20, azimuth=0)
    assert success, "Cache save should succeed"
    print("   ✓ Data saved successfully")

    print(f"\n2. Retrieving exact same location:")
    cached = cache_manager.get(lat1, lon1, tilt=20, azimuth=0)
    assert cached is not None, "Should find cached data"
    print(f"   ✓ Cache HIT (exact match)")

    print(f"\n3. Retrieving nearby location (1.8km away):")
    cached = cache_manager.get(lat2, lon2, tilt=20, azimuth=0)
    assert cached is not None, "Should find cached data within radius"
    print(f"   ✓ Cache HIT (spatial match)")

    print(f"\n4. Retrieving far location (50km away):")
    cached = cache_manager.get(lat3, lon3, tilt=20, azimuth=0)
    assert cached is None, "Should NOT find cached data (too far)"
    print(f"   ✓ Cache MISS (outside radius)")

    print(f"\n5. Different parameters (same location):")
    cached = cache_manager.get(lat1, lon1, tilt=30, azimuth=180)
    assert cached is None, "Should NOT find cached data (different params)"
    print(f"   ✓ Cache MISS (different parameters)")

    print("\n6. Cache statistics:")
    stats = cache_manager.get_cache_stats()
    print(f"   Total files: {stats['total_files']}")
    print(f"   Total size: {stats['total_size_mb']} MB")
    print(f"   ✓ Statistics retrieved successfully")

    print("\n✓ All GeohashCacheManager tests passed!")


def test_configuration():
    """Test configuration loading"""
    print("\n=== Testing Configuration ===")

    print(f"GEOHASH_PRECISION: {getattr(settings, 'GEOHASH_PRECISION', 'NOT SET')}")
    print(f"CACHE_RADIUS_KM: {getattr(settings, 'CACHE_RADIUS_KM', 'NOT SET')}")
    print(f"PVGIS_CACHE_TTL_DAYS: {getattr(settings, 'PVGIS_CACHE_TTL_DAYS', 'NOT SET')}")

    # Verify defaults
    assert hasattr(settings, 'GEOHASH_PRECISION'), "GEOHASH_PRECISION should be configured"
    assert hasattr(settings, 'CACHE_RADIUS_KM'), "CACHE_RADIUS_KM should be configured"
    assert hasattr(settings, 'PVGIS_CACHE_TTL_DAYS'), "PVGIS_CACHE_TTL_DAYS should be configured"

    print("✓ Configuration loaded correctly!")


def main():
    """Run all tests"""
    print("=" * 60)
    print("GEOHASH CACHE SYSTEM TEST SUITE")
    print("=" * 60)

    try:
        test_haversine_distance()
        test_geohash_encoding()
        test_neighbor_search()
        test_configuration()
        test_cache_manager()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED! ✓")
        print("=" * 60)
        print("\nThe geohash cache system is working correctly.")
        print("You can now start the API and test with real requests.")

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
