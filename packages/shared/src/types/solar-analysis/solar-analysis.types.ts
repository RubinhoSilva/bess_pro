/**
 * Core solar analysis types
 */

export interface SolarAnalysisRequest {
  lat: number;
  lon: number;
  origem_dados: DataSource;
  startyear?: number;
  endyear?: number;
  modelo_decomposicao?: DecompositionModel;
  modelo_transposicao?: TranspositionModel;
  mount_type?: MountType;
}

export interface SolarAnalysisResponse {
  success: boolean;
  data: any;
  timestamp: string;
  message?: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export type DataSource = 'PVGIS' | 'NASA' | 'pvgis' | 'nasa';

export type DecompositionModel = 'erbs' | 'louche' | 'orgill_hollands';

export type TranspositionModel = 'perez' | 'haydavies' | 'isotropic';

export type MountType = 'close_mount_glass_glass' | 'open_rack' | 'insulated_back';