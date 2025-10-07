# Geohash Cache Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
cd /path/to/pvlib-service
pip install -r requirements.txt
```

This will install `python-geohash==0.8.5` along with other dependencies.

### 2. Configure (Optional)

Add to `.env` file if you want to customize:

```bash
# Geohash Cache Configuration (all optional - uses sensible defaults)
GEOHASH_PRECISION=5          # Default: 5 (~4.9km cells)
CACHE_RADIUS_KM=15.0         # Default: 15km
PVGIS_CACHE_TTL_DAYS=30      # Default: 30 days
```

If you don't set these, the system uses the defaults shown above.

### 3. Verify Installation

```bash
# Check if geohash module is installed
python3 -c "import geohash; print('Geohash module installed successfully!')"

# Run test suite (optional)
python3 test_geohash_cache.py
```

## Usage

### Start the API

```bash
# Development mode
uvicorn main:app --reload --port 8000

# Or using the project scripts
npm run dev  # If using npm scripts
```

### Test the Cache

#### 1. First Request (Cache Miss - API Call)

```bash
curl -X POST "http://localhost:8000/api/v1/irradiation/monthly" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": -23.5505,
    "lon": -46.6333,
    "tilt": 20,
    "azimuth": 0
  }'
```

**Expected:** Takes 2-5 seconds (PVGIS API call)

**Log:** `"Geohash cache MISS para -23.5505, -46.6333"`

#### 2. Same Location (Cache Hit)

```bash
curl -X POST "http://localhost:8000/api/v1/irradiation/monthly" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": -23.5505,
    "lon": -46.6333,
    "tilt": 20,
    "azimuth": 0
  }'
```

**Expected:** Takes <100ms (cached)

**Log:** `"Geohash cache HIT para -23.5505, -46.6333"` + `"Cache HIT: Found data at 0.00km"`

#### 3. Nearby Location (Spatial Cache Hit)

```bash
curl -X POST "http://localhost:8000/api/v1/irradiation/monthly" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": -23.5520,
    "lon": -46.6350,
    "tilt": 20,
    "azimuth": 0
  }'
```

**Expected:** Takes <100ms (spatial cache hit)

**Log:** `"Cache HIT: Found data at 1.88km from target"`

### Check Cache Statistics

```bash
curl http://localhost:8000/api/v1/admin/cache/geohash/stats | json_pp
```

**Response:**
```json
{
  "total_files": 3,
  "total_size_mb": 15.47,
  "oldest_file": "2025-09-30T10:30:00",
  "newest_file": "2025-09-30T15:45:00",
  "cache_dir": "/tmp/cache_pvgis",
  "config": {
    "geohash_precision": 5,
    "cache_radius_km": 15.0,
    "ttl_days": 30
  }
}
```

## Monitoring

### Watch Logs for Cache Behavior

```bash
# Watch for cache hits/misses
tail -f /var/log/pvlib-service.log | grep -i "cache"

# Count cache hits
grep "cache HIT" /var/log/pvlib-service.log | wc -l

# Count cache misses
grep "cache MISS" /var/log/pvlib-service.log | wc -l
```

### Example Log Output

```
2025-09-30 15:45:01 - utils.geohash_cache - INFO - Geohash cache MISS para -23.5505, -46.6333
2025-09-30 15:45:05 - services.pvgis_service - INFO - Chamando API PVGIS para -23.5505, -46.6333 (cache miss)
2025-09-30 15:45:08 - utils.geohash_cache - INFO - Cache SET: Saved data for (-23.5505, -46.6333) with geohash 6gycf

2025-09-30 15:46:12 - utils.geohash_cache - INFO - Searching cache in 9 cells for (-23.5520, -46.6350)
2025-09-30 15:46:12 - utils.geohash_cache - DEBUG - Found cache in cell 6gycf: distance=1.88km
2025-09-30 15:46:12 - utils.geohash_cache - INFO - Cache HIT: Found data at 1.88km from target
2025-09-30 15:46:12 - services.pvgis_service - INFO - Geohash cache HIT para -23.5520, -46.6350
```

## Maintenance

### Clear Expired Cache

```bash
# Remove only expired files (recommended)
curl -X DELETE http://localhost:8000/api/v1/admin/cache/geohash/cleanup
```

### Clear All Cache

```bash
# Remove all cache files (use with caution!)
curl -X DELETE http://localhost:8000/api/v1/admin/cache/geohash/clear
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'geohash'"

**Solution:**
```bash
pip install python-geohash==0.8.5
```

### Issue: Cache Not Working

**Check:**
1. Verify geohash module is installed:
   ```bash
   python3 -c "import geohash; print('OK')"
   ```

2. Check cache directory exists and is writable:
   ```bash
   ls -la /tmp/cache_pvgis
   ```

3. Review logs:
   ```bash
   tail -100 /var/log/pvlib-service.log | grep -i "cache"
   ```

### Issue: Low Cache Hit Rate

**Possible causes:**

1. **Different parameters**: Each combination of tilt/azimuth needs separate cache
   - Solution: Common configurations get cached over time

2. **Locations too far apart**: Projects >15km apart don't share cache
   - Solution: Increase `CACHE_RADIUS_KM` in `.env`

3. **Precision too high**: Precision 6-7 creates smaller cells
   - Solution: Use precision 5 (default)

### Issue: Cache Directory Full

**Solution:**
```bash
# Check size
du -sh /tmp/cache_pvgis

# Clear expired
curl -X DELETE http://localhost:8000/api/v1/admin/cache/geohash/cleanup

# Or clear all (if needed)
curl -X DELETE http://localhost:8000/api/v1/admin/cache/geohash/clear
```

## Performance Tips

### 1. Increase TTL for Stable Regions

For regions with stable weather patterns:

```bash
# .env
PVGIS_CACHE_TTL_DAYS=90  # 3 months instead of 30
```

### 2. Increase Radius for Sparse Projects

For rural/sparse areas:

```bash
# .env
CACHE_RADIUS_KM=25.0  # Allow 25km instead of 15km
```

### 3. Monitor Cache Effectiveness

Check cache stats regularly:

```bash
# Create a monitoring script
#!/bin/bash
while true; do
  curl -s http://localhost:8000/api/v1/admin/cache/geohash/stats | \
    jq '.total_files, .total_size_mb'
  sleep 60
done
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/cache/geohash/stats` | Get cache statistics |
| DELETE | `/api/v1/admin/cache/geohash/clear` | Clear all cache |
| DELETE | `/api/v1/admin/cache/geohash/cleanup` | Clear expired cache |

## Expected Performance

### Before Geohash Cache
- 100 projects → 100 API calls
- Average response: 3-5 seconds
- Total time: 5-8 minutes

### After Geohash Cache
- 100 projects in same region → 10-15 API calls
- Cache hits: <100ms
- Cache misses: 3-5 seconds
- Total time: 1-2 minutes
- **70-90% reduction in API calls**

## Next Steps

1. ✓ Install dependencies
2. ✓ Test with sample requests
3. ✓ Monitor cache performance
4. Configure for your use case (optional)
5. Review full documentation: `GEOHASH_CACHE.md`

## Support

- Full documentation: `GEOHASH_CACHE.md`
- Test suite: `python3 test_geohash_cache.py`
- API docs: http://localhost:8000/docs

---

**Quick Reference Card**

```bash
# Install
pip install -r requirements.txt

# Test
python3 test_geohash_cache.py

# Run API
uvicorn main:app --reload --port 8000

# Check stats
curl http://localhost:8000/api/v1/admin/cache/geohash/stats

# Clear cache
curl -X DELETE http://localhost:8000/api/v1/admin/cache/geohash/cleanup
```
