import axios, { AxiosInstance } from 'axios';
import { Result } from '../../application/common/Result';

// Simple logger implementation
class Logger {
  private static instance: Logger;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);
  }
  
  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

export interface GoogleSolarConfig {
  apiKey: string;
  baseUrl: string;
  cacheConfig?: {
    ttlMinutes: number;
    maxCacheSize: number;
  };
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: RoofSegmentSummary[];
}

export interface RoofSegmentSummary {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

export interface FinancialAnalysis {
  monthlyBill: Money;
  defaultBill: boolean;
  averageKwhPerMonth: number;
  panelConfigIndex: number;
}

export interface Money {
  currencyCode: string;
  units: string;
  nanos: number;
}

export interface SolarPotential {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  wholeRoofStats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  roofSegmentStats: RoofSegmentSummary[];
  solarPanelConfigs: SolarPanelConfig[];
  financialAnalyses: FinancialAnalysis[];
}

export interface DataLayerView {
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  imageryProcessedDate: {
    year: number;
    month: number;
    day: number;
  };
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;
  hourlyShadeUrls: string[];
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BuildingInsights {
  name: string;
  center: Location;
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: SolarPotential;
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  imageryProcessedDate: {
    year: number;
    month: number;
    day: number;
  };
}

export interface SolarAnalysisResult {
  viabilityScore: number;
  roofComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  optimalTilt: number;
  optimalAzimuth: number;
  annualGeneration: number;
  savings: {
    annual: number;
    monthly: number;
    paybackYears: number;
  };
  recommendations: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

type CacheKey = string;

export class GoogleSolarApiService {
  private client: AxiosInstance;
  private cache = new Map<CacheKey, CacheEntry<any>>();
  private logger = Logger.getInstance();
  
  constructor(private config: GoogleSolarConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://solar.googleapis.com/v1',
      timeout: 30000,
      params: {
        key: config.apiKey,
      },
    });
    
    // Configure request interceptors for logging
    this.client.interceptors.request.use((config) => {
      this.logger.info(`Google Solar API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    
    this.client.interceptors.response.use(
      (response) => {
        this.logger.info(`Google Solar API Success: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error(`Google Solar API Error: ${error.message}`, error);
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get building insights with solar potential data
   */
  async getBuildingInsights(
    latitude: number, 
    longitude: number,
    requiredQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
  ): Promise<Result<BuildingInsights>> {
    try {
      const cacheKey = `building-${latitude}-${longitude}-${requiredQuality}`;
      const cached = this.getFromCache<BuildingInsights>(cacheKey);
      
      if (cached) {
        this.logger.debug('Returning cached building insights');
        return Result.success(cached);
      }
      
      const response = await this.client.get('/solar/buildingInsights:findClosest', {
        params: {
          'location.latitude': latitude,
          'location.longitude': longitude,
          requiredQuality,
        },
      });
      
      const insights: BuildingInsights = response.data;
      this.setCache(cacheKey, insights);
      
      return Result.success(insights);
    } catch (error: any) {
      const message = `Erro ao buscar building insights: ${error.response?.data?.error?.message || error.message}`;
      this.logger.error(message, error);
      return Result.failure(message);
    }
  }
  
  /**
   * Get solar potential data for a location
   */
  async getSolarPotential(
    latitude: number, 
    longitude: number
  ): Promise<Result<SolarPotential>> {
    try {
      const buildingResult = await this.getBuildingInsights(latitude, longitude);
      
      if (!buildingResult.isSuccess) {
        return Result.failure(buildingResult.error!);
      }
      
      return Result.success(buildingResult.value!.solarPotential);
    } catch (error: any) {
      const message = `Erro ao buscar potencial solar: ${error.message}`;
      this.logger.error(message, error);
      return Result.failure(message);
    }
  }
  
  /**
   * Get data layers (imagery, DSM, flux, etc.)
   */
  async getDataLayers(
    latitude: number, 
    longitude: number, 
    radiusMeters: number = 100,
    view: 'FULL_LAYERS' | 'DSM_LAYER' | 'IMAGERY_LAYER' = 'FULL_LAYERS'
  ): Promise<Result<DataLayerView>> {
    try {
      const cacheKey = `layers-${latitude}-${longitude}-${radiusMeters}-${view}`;
      const cached = this.getFromCache<DataLayerView>(cacheKey);
      
      if (cached) {
        this.logger.debug('Returning cached data layers');
        return Result.success(cached);
      }
      
      const response = await this.client.get('/solar/dataLayers:get', {
        params: {
          'location.latitude': latitude,
          'location.longitude': longitude,
          radiusMeters,
          view,
        },
      });
      
      const layers: DataLayerView = response.data;
      this.setCache(cacheKey, layers);
      
      return Result.success(layers);
    } catch (error: any) {
      const message = `Erro ao buscar camadas de dados: ${error.response?.data?.error?.message || error.message}`;
      this.logger.error(message, error);
      return Result.failure(message);
    }
  }
  
  /**
   * Perform comprehensive solar analysis
   */
  async performSolarAnalysis(
    latitude: number,
    longitude: number,
    options: {
      monthlyBill?: number;
      panelWattage?: number;
      systemEfficiency?: number;
    } = {}
  ): Promise<Result<SolarAnalysisResult>> {
    try {
      const buildingResult = await this.getBuildingInsights(latitude, longitude);
      
      if (!buildingResult.isSuccess) {
        return Result.failure(buildingResult.error!);
      }
      
      const insights = buildingResult.value!;
      const solarPotential = insights.solarPotential;
      
      // Calculate viability score
      const viabilityScore = this.calculateViabilityScore(solarPotential, insights.imageryQuality);
      
      // Analyze roof complexity
      const roofComplexity = this.analyzeRoofComplexity(solarPotential.roofSegmentStats || []);
      
      // Calculate optimal orientation
      const { optimalTilt, optimalAzimuth } = this.calculateOptimalOrientation(
        solarPotential.roofSegmentStats || [],
        latitude
      );
      
      // Estimate annual generation
      const annualGeneration = this.calculateAnnualGeneration(
        solarPotential,
        options.panelWattage || 550,
        options.systemEfficiency || 0.85
      );
      
      // Calculate financial savings
      const savings = this.calculateSavings(
        annualGeneration,
        options.monthlyBill || 200,
        solarPotential.maxArrayPanelsCount
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        solarPotential,
        viabilityScore,
        roofComplexity,
        insights.imageryQuality
      );
      
      const analysis: SolarAnalysisResult = {
        viabilityScore,
        roofComplexity,
        optimalTilt,
        optimalAzimuth,
        annualGeneration,
        savings,
        recommendations
      };
      
      return Result.success(analysis);
    } catch (error: any) {
      const message = `Erro na análise solar: ${error.message}`;
      this.logger.error(message, error);
      return Result.failure(message);
    }
  }
  
  /**
   * Calculate viability score (0-100)
   */
  private calculateViabilityScore(
    solarPotential: SolarPotential,
    imageQuality: 'HIGH' | 'MEDIUM' | 'LOW'
  ): number {
    let score = 0;
    
    // Base score from solar potential (40 points)
    const maxSunshineScore = Math.min((solarPotential.maxSunshineHoursPerYear / 3000) * 40, 40);
    score += maxSunshineScore;
    
    // Roof area score (30 points)
    const roofAreaScore = Math.min((solarPotential.maxArrayAreaMeters2 / 200) * 30, 30);
    score += roofAreaScore;
    
    // Panel capacity score (20 points)
    const panelScore = Math.min((solarPotential.maxArrayPanelsCount / 50) * 20, 20);
    score += panelScore;
    
    // Image quality bonus/penalty (10 points)
    const qualityScore = imageQuality === 'HIGH' ? 10 : imageQuality === 'MEDIUM' ? 5 : 0;
    score += qualityScore;
    
    // Apply roof stats bonus
    if (solarPotential.wholeRoofStats.areaMeters2 > 100) {
      score += 5;
    }
    
    return Math.min(Math.round(score), 100);
  }
  
  /**
   * Analyze roof complexity based on segments
   */
  private analyzeRoofComplexity(roofSegments: RoofSegmentSummary[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (roofSegments.length <= 1) return 'LOW';
    if (roofSegments.length <= 3) return 'MEDIUM';
    return 'HIGH';
  }
  
  /**
   * Calculate optimal panel orientation
   */
  private calculateOptimalOrientation(
    roofSegments: RoofSegmentSummary[],
    latitude: number
  ): { optimalTilt: number; optimalAzimuth: number } {
    if (roofSegments.length === 0) {
      // Default optimal values for latitude
      return {
        optimalTilt: Math.abs(latitude) > 25 ? Math.abs(latitude) : 25,
        optimalAzimuth: latitude >= 0 ? 180 : 0 // South for Northern hemisphere, North for Southern
      };
    }
    
    // Find the segment with highest energy production
    const bestSegment = roofSegments.reduce((best, current) => 
      current.yearlyEnergyDcKwh > best.yearlyEnergyDcKwh ? current : best
    );
    
    return {
      optimalTilt: bestSegment.pitchDegrees,
      optimalAzimuth: bestSegment.azimuthDegrees
    };
  }
  
  /**
   * Calculate estimated annual generation
   */
  private calculateAnnualGeneration(
    solarPotential: SolarPotential,
    panelWattage: number,
    systemEfficiency: number
  ): number {
    const totalPanels = solarPotential.maxArrayPanelsCount;
    const totalWattage = totalPanels * panelWattage;
    const peakSunHours = solarPotential.maxSunshineHoursPerYear / 365;
    
    // Annual generation in kWh
    return (totalWattage / 1000) * peakSunHours * 365 * systemEfficiency;
  }
  
  /**
   * Calculate financial savings
   */
  private calculateSavings(
    annualGeneration: number,
    monthlyBill: number,
    panelCount: number
  ): { annual: number; monthly: number; paybackYears: number } {
    const electricityRate = 0.65; // R$ per kWh (average Brazil rate)
    const annualSavings = annualGeneration * electricityRate;
    const monthlySavings = annualSavings / 12;
    
    // Estimated system cost (R$ 4.50 per watt installed)
    const systemCost = panelCount * 550 * 4.5;
    const paybackYears = systemCost / annualSavings;
    
    return {
      annual: annualSavings,
      monthly: monthlySavings,
      paybackYears: Math.round(paybackYears * 10) / 10
    };
  }
  
  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    solarPotential: SolarPotential,
    viabilityScore: number,
    roofComplexity: 'LOW' | 'MEDIUM' | 'HIGH',
    imageQuality: 'HIGH' | 'MEDIUM' | 'LOW'
  ): string[] {
    const recommendations: string[] = [];
    
    if (viabilityScore >= 80) {
      recommendations.push('Excelente potencial solar - altamente recomendado');
    } else if (viabilityScore >= 60) {
      recommendations.push('Bom potencial solar - recomendado com análise detalhada');
    } else if (viabilityScore >= 40) {
      recommendations.push('Potencial moderado - avaliar viabilidade econômica');
    } else {
      recommendations.push('Potencial limitado - considerar alternativas');
    }
    
    if (roofComplexity === 'HIGH') {
      recommendations.push('Telhado complexo - pode requerer estruturas especiais');
    }
    
    if (imageQuality === 'LOW') {
      recommendations.push('Qualidade de imagem baixa - verificar dados in loco');
    }
    
    if (solarPotential.maxArrayAreaMeters2 < 20) {
      recommendations.push('Área disponível limitada - considerar painéis de alta eficiência');
    }
    
    if (solarPotential.maxSunshineHoursPerYear > 2500) {
      recommendations.push('Excelente irradiação solar na região');
    }
    
    if (solarPotential.carbonOffsetFactorKgPerMwh > 500) {
      recommendations.push('Alto potencial de redução de emissões de carbono');
    }
    
    return recommendations;
  }
  
  /**
   * Cache management methods
   */
  private getFromCache<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  private setCache<T>(key: CacheKey, data: T): void {
    const ttlMinutes = this.config.cacheConfig?.ttlMinutes || 60;
    const maxCacheSize = this.config.cacheConfig?.maxCacheSize || 100;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (ttlMinutes * 60 * 1000)
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info('Google Solar API cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheConfig?.maxCacheSize || 100,
      hitRate: 0 // Would need request tracking for accurate hit rate
    };
  }
}