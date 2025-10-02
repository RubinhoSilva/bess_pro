# Geohash-Based Cache System

## Overview

This document describes the geohashing-based cache system implemented to optimize PVGIS API calls in the pvlib-service. The system uses spatial indexing to efficiently reuse weather data for nearby locations, significantly reducing API calls and improving response times.

## Problem Statement

The original cache system used exact coordinate matching, which meant:
- Each unique coordinate required a separate API call
- Projects in the same city/region made redundant API calls
- Weather data from 2km away couldn't be reused
- Cache efficiency was low for similar locations

## Solution: Geohash-Based Spatial Cache

### What is Geohashing?

Geohashing is a geocoding system that divides the world into a grid of cells. Each cell is identified by a short alphanumeric string. Nearby locations share geohash prefixes.

**Example:**
- São Paulo Center: `6gycf`
- 1.8km away: `6gycf` (same cell)
- 5km away: `6gycg` (neighbor cell)

### How It Works

1. **Encode Location**: Convert lat/lon to geohash (precision 5 = ~4.9km cells)
2. **Search Neighbors**: Check current cell + 8 neighbors (3x3 grid = ~44km² area)
3. **Verify Distance**: Use Haversine formula to verify actual distance
4. **Return if Close**: If cached data is within 15km, reuse it
5. **Cache if Miss**: Store new data with geohash key

### Architecture

```
Request (lat, lon, params)
        ↓
Generate Geohash (precision 5)
        ↓
Get 3x3 Neighbor Grid (9 cells)
        ↓
Search Each Cell for Matching Params
        ↓
Found? → Calculate Distance (Haversine)
        ↓
Within 15km? → Return Cached Data ✓
        ↓
Not Found? → Call PVGIS API → Cache with Geohash
```

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Geohash Cache Configuration
GEOHASH_PRECISION=5          # Grid precision (5 = ~4.9km cells)
CACHE_RADIUS_KM=15.0         # Maximum distance for cache hits (km)
PVGIS_CACHE_TTL_DAYS=30      # Cache expiration time (days)
```

### Precision Guide

| Precision | Cell Size | Use Case |
|-----------|-----------|----------|
| 4 | ±20km | Country/region level |
| 5 | ±2.4km | City level (Default) |
| 6 | ±0.61km | Neighborhood level |
| 7 | ±0.076km | Street level |

**Recommendation:** Keep precision 5 for optimal balance between cache hits and accuracy.

## Implementation Details

### Files Modified

1. **`requirements.txt`** - Added `python-geohash==0.8.5`
2. **`utils/geohash_cache.py`** - New geohash cache manager (550+ lines)
3. **`core/config.py`** - Added configuration variables
4. **`services/pvgis_service.py`** - Integrated geohash cache
5. **`services/solar_service.py`** - Integrated for POA calculations
6. **`api/v1/endpoints/admin.py`** - Added cache management endpoints

### Key Functions

#### `utils/geohash_cache.py`

```python
# Core functions
encode_geohash(lat, lon, precision=5) -> str
get_neighbors(geohash) -> List[str]  # Returns 9 cells (3x3 grid)
haversine_distance(lat1, lon1, lat2, lon2) -> float  # km

# GeohashCacheManager class
.get(lat, lon, **params) -> Optional[Any]  # Search with neighbor grid
.set(lat, lon, data, **params) -> bool     # Store with metadata
.get_cache_stats() -> Dict                  # Statistics
.clear_expired() -> int                     # Remove expired files
.clear_all() -> int                         # Remove all files
```

#### Cache Key Format

```
pvgis:{geohash}:{tilt}:{azimuth}:{model}:{type}
```

Example:
```
pvgis:6gycf:tilt_20:azimuth_0:model_erbs:type_poa
```

### Cache Strategy

#### PVGIS Weather Data (services/pvgis_service.py)

```python
1. Try geohash cache (searches 9 cells)
2. If found within 15km → Return cached data
3. If not found → Call PVGIS API
4. Save to both geohash cache + legacy cache
5. Fallback to legacy cache if geohash fails
```

#### POA Calculations (services/solar_service.py)

```python
1. Try geohash cache with params (tilt, azimuth, model)
2. If found within 15km → Return cached POA
3. If not found → Calculate POA
4. Save to both caches
5. Fallback to legacy cache if needed
```

### Error Handling

The system is designed to **fail gracefully**:
- Cache failures don't break the application
- Always falls back to API calls
- Legacy cache as secondary fallback
- Comprehensive error logging

## API Endpoints

### Geohash Cache Statistics

```bash
GET /api/v1/admin/cache/geohash/stats
```

**Response:**
```json
{
  "total_files": 145,
  "total_size_mb": 892.34,
  "oldest_file": "2025-09-01T10:30:00",
  "newest_file": "2025-09-30T15:45:00",
  "cache_dir": "/tmp/cache_pvgis",
  "config": {
    "geohash_precision": 5,
    "cache_radius_km": 15.0,
    "ttl_days": 30
  }
}
```

### Clear Geohash Cache

```bash
DELETE /api/v1/admin/cache/geohash/clear
```

**Warning:** Removes all geohash cache files!

### Cleanup Expired Cache

```bash
DELETE /api/v1/admin/cache/geohash/cleanup
```

Removes only expired files (safer than clear).

## Performance Metrics

### Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Calls | 100/day | 10-30/day | 70-90% reduction |
| Cache Hit Rate | ~5% | 70-90% | 14-18x increase |
| Response Time (hit) | 2-5s | <50ms | 40-100x faster |
| Response Time (miss) | 2-5s | 2-5s | Same |

### Real-World Example

**Scenario:** 20 projects in São Paulo within 10km radius

**Without Geohash Cache:**
- 20 PVGIS API calls = ~60-100 seconds
- Each project waits 3-5 seconds

**With Geohash Cache:**
- 1 PVGIS API call (first project) = 3-5 seconds
- 19 cache hits = ~19 × 50ms = ~1 second
- Total: ~4-6 seconds (10-17x faster)

## Monitoring

### Check Cache Performance

```bash
# Get statistics
curl http://localhost:8000/api/v1/admin/cache/geohash/stats

# Check logs for cache hits
grep "Geohash cache HIT" /var/log/pvlib-service.log

# Count API calls saved
grep "cache HIT" /var/log/pvlib-service.log | wc -l
```

### Log Messages

```python
# Cache Hit
"Geohash cache HIT para {lat}, {lon}"
"Cache HIT: Found data at 3.45km from target"

# Cache Miss
"Geohash cache MISS para {lat}, {lon}"
"Chamando API PVGIS para {lat}, {lon} (cache miss)"

# Cache Operations
"Cache SET: Saved data for ({lat}, {lon}) with geohash {geohash}"
"Searching cache in 9 cells for ({lat}, {lon})"
```

## Testing

### Manual Testing

```bash
# Install dependencies
cd /path/to/pvlib-service
pip install -r requirements.txt

# Test 1: First request (cache miss, API call)
curl -X POST "http://localhost:8000/api/v1/irradiation/monthly" \
  -H "Content-Type: application/json" \
  -d '{"lat": -23.5505, "lon": -46.6333, "tilt": 20, "azimuth": 0}'

# Test 2: Same location (cache hit, fast)
curl -X POST "http://localhost:8000/api/v1/irradiation/monthly" \
  -H "Content-Type: application/json" \
  -d '{"lat": -23.5505, "lon": -46.6333, "tilt": 20, "azimuth": 0}'

# Test 3: Nearby location 5km away (cache hit, fast)
curl -X POST "http://localhost:8000/api/v1/irradiation/monthly" \
  -H "Content-Type: application/json" \
  -d '{"lat": -23.5550, "lon": -46.6400, "tilt": 20, "azimuth": 0}'

# Check cache stats
curl http://localhost:8000/api/v1/admin/cache/geohash/stats
```

### Expected Behavior

1. **First request**: Takes 2-5 seconds (API call), logs "cache MISS"
2. **Second request**: Takes <100ms, logs "cache HIT at 0.00km"
3. **Nearby request**: Takes <100ms, logs "cache HIT at 5.23km"

## Troubleshooting

### Issue: Cache Not Working

**Check:**
1. Redis connection (if using Redis)
2. Cache directory permissions: `ls -la /tmp/cache_pvgis`
3. Geohash module: `python -c "import geohash; print(geohash.encode(-23.5505, -46.6333))"`
4. Logs: `grep "geohash" /var/log/pvlib-service.log`

### Issue: Low Cache Hit Rate

**Possible causes:**
1. Precision too high (6-7): Reduce to 5
2. Radius too small: Increase `CACHE_RADIUS_KM` to 20-25km
3. Varying parameters: Each tilt/azimuth combination needs separate cache
4. TTL too short: Increase `PVGIS_CACHE_TTL_DAYS`

### Issue: Large Cache Size

**Solutions:**
```bash
# Check size
curl http://localhost:8000/api/v1/admin/cache/geohash/stats

# Remove expired files
curl -X DELETE http://localhost:8000/api/v1/admin/cache/geohash/cleanup

# Clear all (if needed)
curl -X DELETE http://localhost:8000/api/v1/admin/cache/geohash/clear
```

## Advanced Configuration

### Increase Cache Radius

For regions with sparse projects, increase radius:

```bash
# .env
CACHE_RADIUS_KM=25.0  # Allow 25km radius
```

**Trade-off:** Larger radius = more reuse but less accuracy

### Decrease Precision for Rural Areas

For rural/sparse regions:

```bash
# .env
GEOHASH_PRECISION=4  # ~20km cells
CACHE_RADIUS_KM=30.0
```

### Production Optimization

```bash
# .env
GEOHASH_PRECISION=5
CACHE_RADIUS_KM=15.0
PVGIS_CACHE_TTL_DAYS=90  # 3 months (weather patterns stable)
```

## Migration from Legacy Cache

The geohash cache **coexists** with the legacy cache:

1. Geohash cache is tried first
2. Legacy cache is fallback
3. New data is saved to both caches
4. No migration needed - just deploy and run

**Gradual transition:**
- Day 1-7: Both caches populated
- Week 2+: Geohash cache primary
- Month 2: Consider removing legacy cache files

## Security Considerations

1. **Cache poisoning**: Validate all cached data before use
2. **Disk space**: Monitor cache size, implement limits
3. **Rate limiting**: Still needed for first-time requests
4. **Access control**: Admin endpoints should require authentication

## Future Enhancements

### Possible Improvements

1. **Redis backend**: Replace file cache with Redis for faster lookups
2. **Compression**: Gzip pickle files to reduce storage
3. **Warming**: Pre-cache major cities on startup
4. **Analytics**: Track cache hit rates, popular locations
5. **Adaptive precision**: Auto-adjust based on project density

### Redis Implementation (Future)

```python
# Potential Redis keys
redis.set(f"geohash:{hash}:pvgis", pickle.dumps(data), ex=2592000)
redis.get(f"geohash:{hash}:pvgis")

# Benefits: faster, distributed, automatic expiration
```

## References

- **Geohash**: https://en.wikipedia.org/wiki/Geohash
- **python-geohash**: https://pypi.org/project/python-geohash/
- **Haversine Formula**: https://en.wikipedia.org/wiki/Haversine_formula
- **PVGIS API**: https://joint-research-centre.ec.europa.eu/pvgis-online-tool

## Support

For issues or questions:
1. Check logs: `/var/log/pvlib-service.log`
2. Check cache stats: `GET /api/v1/admin/cache/geohash/stats`
3. Review this documentation
4. Contact the development team

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0
**Author:** FastAPI Expert with 15+ years experience
