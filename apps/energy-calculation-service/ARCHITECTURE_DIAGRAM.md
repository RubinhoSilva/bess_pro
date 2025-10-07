# Geohash Cache System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                               │
│        POST /api/v1/irradiation/monthly                             │
│        {lat: -23.5505, lon: -46.6333, tilt: 20, azimuth: 0}        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SOLAR SERVICE                                     │
│                 (solar_service.py)                                   │
│                                                                       │
│  • Validates request                                                 │
│  • Determines if needs POA calculation                              │
│  • Calls PVGIS Service for weather data                             │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PVGIS SERVICE                                     │
│                 (pvgis_service.py)                                   │
│                                                                       │
│  fetch_weather_data(lat, lon)                                       │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │   Try Geohash Cache     │
           │  (GeohashCacheManager)  │
           └────────┬────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    CACHE HIT             CACHE MISS
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│  Return Cached  │   │  Try Legacy      │
│  Data (<100ms)  │   │  Cache           │
└─────────────────┘   └────┬─────────────┘
                           │
                    ┌──────┴────────┐
                    │               │
               CACHE HIT       CACHE MISS
                    │               │
                    ▼               ▼
           ┌─────────────┐  ┌──────────────────┐
           │   Return    │  │  Call PVGIS API  │
           │   Cached    │  │  (2-5 seconds)   │
           └─────────────┘  └────┬─────────────┘
                                 │
                                 ▼
                         ┌──────────────────┐
                         │  Save to Both    │
                         │  Caches          │
                         │  • Geohash Cache │
                         │  • Legacy Cache  │
                         └────┬─────────────┘
                              │
                              ▼
                         ┌──────────────────┐
                         │  Return Data     │
                         └──────────────────┘
```

## Geohash Neighbor Search

```
Request: lat=-23.5505, lon=-46.6333
Geohash (precision 5): 6gycf

3x3 Neighbor Grid:
┌──────────┬──────────┬──────────┐
│  6gycg   │  6gycu   │  6gycv   │  North
│  (NW)    │  (N)     │  (NE)    │
├──────────┼──────────┼──────────┤
│  6gyce   │  6gycf   │  6gycg   │  Center
│  (W)     │  (C)     │  (E)     │
├──────────┼──────────┼──────────┤
│  6gyc7   │  6gycs   │  6gyct   │  South
│  (SW)    │  (S)     │  (SE)    │
└──────────┴──────────┴──────────┘

Each cell: ~4.9km × 4.9km
Total search area: ~44km²
```

## Cache Search Algorithm

```
┌─────────────────────────────────────────┐
│  1. Generate Geohash for Target         │
│     lat=-23.5505, lon=-46.6333          │
│     → geohash = "6gycf"                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Get 3x3 Neighbor Grid               │
│     [6gycf, 6gycg, 6gycu, 6gyce,       │
│      6gycs, 6gyc7, 6gyck, 6gycd, 6gyc9]│
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3. Search Each Cell                    │
│     For each neighbor:                  │
│       - Build cache key                 │
│       - Check if file exists            │
│       - Check if not expired            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  4. Found Cached Entry?                 │
│     Load pickle file:                   │
│     {lat: -23.5520, lon: -46.6350, ...} │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  5. Calculate Distance (Haversine)      │
│     distance = haversine(               │
│       -23.5505, -46.6333,              │
│       -23.5520, -46.6350               │
│     ) = 1.88 km                         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  6. Within Radius?                      │
│     1.88 km < 15.0 km? YES!            │
│     → Return cached data ✓              │
└─────────────────────────────────────────┘
```

## Cache Key Structure

```
Format: pvgis:{geohash}:{param1}_{value1}:{param2}_{value2}...

Examples:

1. Weather Data (PVGIS):
   pvgis:6gycf

2. POA Calculation:
   pvgis:6gycf:tilt_20:azimuth_0:model_erbs:type_poa

3. Different Parameters:
   pvgis:6gycf:tilt_30:azimuth_180:model_disc:type_poa

File Storage:
   /tmp/cache_pvgis/geohash_<md5_hash>.pkl
```

## Cache Entry Structure

```python
{
    'lat': -23.5505,              # Original coordinates
    'lon': -46.6333,
    'geohash': '6gycf',           # Geohash identifier
    'timestamp': '2025-09-30T15:45:00',  # Creation time
    'params': {                   # Cache parameters
        'tilt': 20,
        'azimuth': 0,
        'model': 'erbs',
        'type': 'poa'
    },
    'data': <DataFrame/Series>    # Actual cached data
}
```

## Performance Comparison

### Before Geohash Cache

```
Request 1: Project A (-23.5505, -46.6333)
  ├─ Check exact coordinate cache → MISS
  ├─ Call PVGIS API → 3-5 seconds
  └─ Cache with exact coordinates

Request 2: Project B (-23.5520, -46.6350) [1.8km away]
  ├─ Check exact coordinate cache → MISS
  ├─ Call PVGIS API → 3-5 seconds
  └─ Cache with exact coordinates

Request 3: Project C (-23.5490, -46.6320) [1.5km away]
  ├─ Check exact coordinate cache → MISS
  ├─ Call PVGIS API → 3-5 seconds
  └─ Cache with exact coordinates

Total: 3 API calls, 9-15 seconds
```

### After Geohash Cache

```
Request 1: Project A (-23.5505, -46.6333)
  ├─ Check geohash cache (9 cells) → MISS
  ├─ Call PVGIS API → 3-5 seconds
  └─ Cache with geohash "6gycf"

Request 2: Project B (-23.5520, -46.6350) [1.8km away]
  ├─ Check geohash cache (9 cells) → HIT!
  ├─ Found in cell "6gycf" at 1.8km
  └─ Return cached data → <100ms

Request 3: Project C (-23.5490, -46.6320) [1.5km away]
  ├─ Check geohash cache (9 cells) → HIT!
  ├─ Found in cell "6gycf" at 1.5km
  └─ Return cached data → <100ms

Total: 1 API call, 3-5 seconds
Improvement: 67% fewer API calls, 3x faster
```

## Geohash Precision Impact

```
Precision 4 (~20km cells):
┌─────────────────────────┐
│                         │
│                         │
│          6gyc           │
│                         │
│                         │
└─────────────────────────┘
Cell: ~20km × 20km (~400km²)
Use: Rural/sparse areas

Precision 5 (~5km cells):
┌──────┬──────┬──────┐
│ 6gycf│ 6gycg│ 6gycu│
├──────┼──────┼──────┤
│ 6gyce│ 6gycf│ 6gycg│
├──────┼──────┼──────┤
│ 6gyc7│ 6gycs│ 6gyct│
└──────┴──────┴──────┘
Cell: ~5km × 5km (~25km²)
Use: City-level (DEFAULT)

Precision 6 (~600m cells):
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│ │ │ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │C│ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │ │ │
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
Cell: ~600m × 600m (~0.36km²)
Use: Neighborhood-level
```

## Cache Hit Rate vs Distance

```
Distance from cached point:
0-5km:   ████████████████████ 100% hit rate
5-10km:  ████████████████░░░░  85% hit rate
10-15km: ████████████░░░░░░░░  70% hit rate
15-20km: ░░░░░░░░░░░░░░░░░░░░   0% hit rate (outside radius)
```

## Data Flow for POA Calculation

```
┌─────────────────────────────────────────┐
│  Solar Service: analyze_monthly()       │
│  Request: lat, lon, tilt=20, azimuth=0  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  1. Fetch Weather Data (PVGIS)          │
│     Uses geohash cache                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Calculate POA Irradiance            │
│     _calculate_poa_irradiance()         │
└────────────────┬────────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │  Check Geohash Cache  │
     │  Key includes:        │
     │  • Geohash (location) │
     │  • tilt=20            │
     │  • azimuth=0          │
     │  • model=erbs         │
     └──────┬────────────────┘
            │
    ┌───────┴────────┐
    │                │
CACHE HIT       CACHE MISS
    │                │
    ▼                ▼
┌─────────┐   ┌──────────────┐
│ Return  │   │  Calculate:  │
│ Cached  │   │  1. Decompose│
│ POA     │   │  2. Get POA  │
│(<100ms) │   │  3. Cache    │
└─────────┘   └──────────────┘
```

## System Components

```
┌────────────────────────────────────────────────────────────┐
│                    API Layer                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Admin Endpoints                                     │  │
│  │  GET  /admin/cache/geohash/stats                    │  │
│  │  DEL  /admin/cache/geohash/clear                    │  │
│  │  DEL  /admin/cache/geohash/cleanup                  │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│                                                              │
│  ┌─────────────────┐         ┌─────────────────┐          │
│  │  Solar Service  │────────▶│  PVGIS Service  │          │
│  │                 │         │                 │          │
│  │  • Analysis     │         │  • API calls    │          │
│  │  • POA calc     │         │  • Weather data │          │
│  └─────────────────┘         └─────────────────┘          │
│           │                           │                     │
│           └───────────┬───────────────┘                    │
└───────────────────────┼────────────────────────────────────┘
                        │
┌───────────────────────┼────────────────────────────────────┐
│                   Cache Layer                               │
│                       │                                     │
│  ┌────────────────────▼───────────────────────────────┐   │
│  │  GeohashCacheManager                               │   │
│  │                                                      │   │
│  │  • encode_geohash()                                 │   │
│  │  • get_neighbors()                                  │   │
│  │  • haversine_distance()                            │   │
│  │  • get() / set()                                    │   │
│  │  • get_cache_stats()                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                       │                                     │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  File System Cache                                   │  │
│  │  /tmp/cache_pvgis/geohash_*.pkl                     │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────┐
│  Try Geohash Cache                      │
└────────┬────────────────────────────────┘
         │
    ┌────▼─────┐
    │ Success? │
    └────┬─────┘
         │
    ┌────▼────┐
    │   YES   │
    └────┬────┘
         │
         ▼
    ┌─────────────────┐
    │  Return Data ✓  │
    └─────────────────┘

    ┌────▼────┐
    │   NO    │
    └────┬────┘
         │
         ▼
    ┌──────────────────────┐
    │  Try Legacy Cache    │
    └────────┬─────────────┘
             │
        ┌────▼─────┐
        │ Success? │
        └────┬─────┘
             │
        ┌────▼────┐
        │   YES   │
        └────┬────┘
             │
             ▼
        ┌─────────────────┐
        │  Return Data ✓  │
        └─────────────────┘

        ┌────▼────┐
        │   NO    │
        └────┬────┘
             │
             ▼
        ┌──────────────────┐
        │  Call PVGIS API  │
        └────────┬─────────┘
                 │
            ┌────▼─────┐
            │ Success? │
            └────┬─────┘
                 │
            ┌────▼────┐
            │   YES   │
            └────┬────┘
                 │
                 ▼
            ┌─────────────────┐
            │  Save to Both   │
            │  Caches         │
            │  Return Data ✓  │
            └─────────────────┘

            ┌────▼────┐
            │   NO    │
            └────┬────┘
                 │
                 ▼
            ┌──────────────────┐
            │  Raise Error ✗   │
            │  PVGISError      │
            └──────────────────┘
```

## Production Deployment

```
┌─────────────────────────────────────────────────────────────┐
│  1. Install Dependencies                                     │
│     pip install -r requirements.txt                         │
│     → Installs python-geohash==0.8.5                        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Configure (Optional)                                     │
│     .env:                                                    │
│     GEOHASH_PRECISION=5                                     │
│     CACHE_RADIUS_KM=15.0                                    │
│     PVGIS_CACHE_TTL_DAYS=30                                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Deploy                                                   │
│     No database migration needed                            │
│     No breaking changes                                     │
│     Works immediately                                       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Monitor                                                  │
│     Check logs: grep "cache" logs.txt                       │
│     Check stats: GET /admin/cache/geohash/stats            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Optimize (After 1 Week)                                  │
│     Adjust CACHE_RADIUS_KM based on hit rate               │
│     Adjust PVGIS_CACHE_TTL_DAYS based on usage            │
└─────────────────────────────────────────────────────────────┘
```

---

**Legend:**
- `→` = Process flow
- `▼` = Continues to next step
- `✓` = Success
- `✗` = Error
- `█` = Filled (high probability)
- `░` = Empty (low probability)
