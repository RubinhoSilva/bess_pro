/**
 * Filter types for calculation queries
 * 
 * This module defines the filter interfaces for searching and filtering
 * calculations in the solar and BESS system.
 */

import { CalculationType, SystemType, CalculationStatus } from './calculation.types';

// ============= BASE FILTERS =============

/**
 * Base calculation filters
 * 
 * @example
 * ```typescript
 * const filters: CalculationFilters = {
 *   projectId: 'proj-123',
 *   type: CalculationType.SOLAR,
 *   status: CalculationStatus.COMPLETED,
 *   dateRange: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-12-31')
 *   },
 *   pagination: {
 *     page: 1,
 *     limit: 20
 *   }
 * };
 * ```
 */
export interface CalculationFilters {
  readonly projectId?: string;
  readonly userId?: string;
  readonly teamId?: string;
  readonly type?: CalculationType;
  readonly systemType?: SystemType;
  readonly status?: CalculationStatus;
  readonly dateRange?: DateRange;
  readonly createdDateRange?: DateRange;
  readonly updatedDateRange?: DateRange;
  readonly tags?: string[];
  readonly search?: string;
  readonly sortBy?: CalculationSortField;
  readonly sortOrder?: 'asc' | 'desc';
  readonly pagination?: PaginationParams;
}

/**
 * Solar calculation specific filters
 * 
 * @example
 * ```typescript
 * const filters: SolarCalculationFilters = {
 *   baseFilters: {
 *     projectId: 'proj-123',
 *     type: CalculationType.SOLAR
 *   },
 *   systemSizeRange: { min: 1000, max: 10000 },
 *   performanceRatioRange: { min: 0.7, max: 0.9 },
 *   location: {
 *     latitude: { min: -25, max: -20 },
 *     longitude: { min: -50, max: -45 }
 *   }
 * };
 * ```
 */
export interface SolarCalculationFilters {
  readonly baseFilters?: CalculationFilters;
  readonly systemSizeRange?: NumericRange;
  readonly performanceRatioRange?: NumericRange;
  readonly capacityFactorRange?: NumericRange;
  readonly location?: GeographicFilter;
  readonly mountingType?: string[];
  readonly trackingSystem?: boolean;
  readonly moduleManufacturer?: string[];
  readonly inverterManufacturer?: string[];
  readonly irradiationRange?: NumericRange;
  readonly temperatureRange?: NumericRange;
}

/**
 * BESS calculation specific filters
 * 
 * @example
 * ```typescript
 * const filters: BessCalculationFilters = {
 *   baseFilters: {
 *     projectId: 'proj-123',
 *     type: CalculationType.BESS
 *   },
 *   batteryCapacityRange: { min: 5000, max: 50000 },
 *   batteryType: [BatteryType.LITHIUM_ION, BatteryType.LFP],
 *   strategy: [BessStrategy.SELF_CONSUMPTION, BessStrategy.PEAK_SHAVING]
 * };
 * ```
 */
export interface BessCalculationFilters {
  readonly baseFilters?: CalculationFilters;
  readonly batteryCapacityRange?: NumericRange;
  readonly batteryPowerRange?: NumericRange;
  readonly batteryType?: string[];
  readonly depthOfDischargeRange?: NumericRange;
  readonly roundTripEfficiencyRange?: NumericRange;
  readonly cycleLifeRange?: NumericRange;
  readonly strategy?: string[];
  readonly gridConnected?: boolean;
  readonly backupPower?: boolean;
}

/**
 * Financial calculation specific filters
 * 
 * @example
 * ```typescript
 * const filters: FinancialCalculationFilters = {
 *   baseFilters: {
 *     projectId: 'proj-123',
 *     type: CalculationType.FINANCIAL
 *   },
 *   investmentRange: { min: 10000, max: 100000 },
 *   npvRange: { min: 0, max: 50000 },
 *   paybackRange: { min: 0, max: 10 }
 * };
 * ```
 */
export interface FinancialCalculationFilters {
  readonly baseFilters?: CalculationFilters;
  readonly investmentRange?: NumericRange;
  readonly npvRange?: NumericRange;
  readonly irrRange?: NumericRange;
  readonly paybackRange?: NumericRange;
  readonly lcoeRange?: NumericRange;
  readonly roiRange?: NumericRange;
  readonly electricityRateRange?: NumericRange;
  readonly currency?: string[];
  readonly financingType?: string[];
}

// ============= SUPPORTING INTERFACES =============

/**
 * Date range filter
 */
export interface DateRange {
  readonly start?: Date;
  readonly end?: Date;
}

/**
 * Numeric range filter
 */
export interface NumericRange {
  readonly min?: number;
  readonly max?: number;
}

/**
 * Geographic location filter
 */
export interface GeographicFilter {
  readonly latitude?: NumericRange;
  readonly longitude?: NumericRange;
  readonly radius?: {
    readonly center: {
      readonly latitude: number;
      readonly longitude: number;
    };
    readonly radiusKm: number;
  };
  readonly country?: string[];
  readonly state?: string[];
  readonly city?: string[];
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
}

/**
 * Sort fields for calculations
 */
export enum CalculationSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  CALCULATED_AT = 'calculatedAt',
  PROJECT_ID = 'projectId',
  TYPE = 'type',
  STATUS = 'status',
  SYSTEM_SIZE = 'systemSize',
  ANNUAL_GENERATION = 'annualGeneration',
  PERFORMANCE_RATIO = 'performanceRatio',
  PAYBACK_PERIOD = 'paybackPeriod',
  NPV = 'npv',
  IRR = 'irr',
  ROI = 'roi'
}

// ============= ADVANCED FILTERS =============

/**
 * Advanced calculation filters with complex conditions
 */
export interface AdvancedCalculationFilters extends CalculationFilters {
  readonly conditions?: FilterCondition[];
  readonly logic?: 'AND' | 'OR';
  readonly aggregations?: AggregationFilter[];
}

/**
 * Filter condition for complex queries
 */
export interface FilterCondition {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: any;
  readonly caseSensitive?: boolean;
}

/**
 * Filter operators
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  REGEX = 'regex',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists'
}

/**
 * Aggregation filter for summary queries
 */
export interface AggregationFilter {
  readonly field: string;
  readonly operation: AggregationOperation;
  readonly groupBy?: string[];
  readonly having?: FilterCondition[];
}

/**
 * Aggregation operations
 */
export enum AggregationOperation {
  SUM = 'sum',
  AVERAGE = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  DISTINCT_COUNT = 'distinct'
}

// ============= SPECIALIZED FILTERS =============

/**
 * Performance comparison filters
 */
export interface PerformanceComparisonFilters {
  readonly baseCalculationId: string;
  readonly comparisonType: 'baseline' | 'scenario' | 'optimization';
  readonly comparisonMetrics: string[];
  readonly tolerancePercentage?: number;
}

/**
 * Template filters
 */
export interface TemplateFilters {
  readonly isTemplate?: boolean;
  readonly templateCategory?: string[];
  readonly templateComplexity?: 'simple' | 'moderate' | 'complex';
  readonly sharedPublicly?: boolean;
}

/**
 * Validation filters
 */
export interface ValidationFilters {
  readonly isValid?: boolean;
  readonly validationErrors?: boolean;
  readonly validationWarnings?: boolean;
  readonly completenessScore?: NumericRange;
}

/**
 * Export filters
 */
export interface ExportFilters {
  readonly format: 'json' | 'csv' | 'xlsx' | 'pdf';
  readonly includeDetails?: boolean;
  readonly includeMetadata?: boolean;
  readonly includeRawData?: boolean;
  readonly language?: string;
  readonly timezone?: string;
}

// ============= QUERY BUILDERS =============

/**
 * Query builder interface for dynamic filter construction
 */
export interface CalculationQueryBuilder {
  where(field: string, operator: FilterOperator, value: any): CalculationQueryBuilder;
  and(condition: FilterCondition): CalculationQueryBuilder;
  or(condition: FilterCondition): CalculationQueryBuilder;
  orderBy(field: CalculationSortField, direction?: 'asc' | 'desc'): CalculationQueryBuilder;
  limit(count: number): CalculationQueryBuilder;
  offset(count: number): CalculationQueryBuilder;
  include(fields: string[]): CalculationQueryBuilder;
  exclude(fields: string[]): CalculationQueryBuilder;
  build(): CalculationFilters;
}

/**
 * Search query interface
 */
export interface SearchQuery {
  readonly query: string;
  readonly fields?: string[];
  readonly fuzzy?: boolean;
  readonly boost?: Record<string, number>;
  readonly filters?: CalculationFilters;
}

// ============= RESULT TYPES =============

/**
 * Filtered result with metadata
 */
export interface FilteredCalculationResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
  readonly filters: CalculationFilters;
  readonly executionTime: number;
  readonly cacheHit?: boolean;
}

/**
 * Aggregated result
 */
export interface AggregatedCalculationResult {
  readonly aggregations: Record<string, any>;
  readonly groups: Array<{
    readonly key: any;
    readonly count: number;
    readonly aggregations: Record<string, any>;
  }>;
  readonly total: number;
  readonly filters: CalculationFilters;
}

/**
 * Search result
 */
export interface CalculationSearchResult {
  readonly results: Array<{
    readonly calculation: any;
    readonly score: number;
    readonly highlights: Record<string, string[]>;
  }>;
  readonly total: number;
  readonly query: SearchQuery;
  readonly suggestions?: string[];
  readonly facets?: Record<string, Array<{ value: any; count: number }>>;
}