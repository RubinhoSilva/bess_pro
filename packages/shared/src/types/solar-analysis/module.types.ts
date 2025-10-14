/**
 * Module-related types for solar analysis
 */

export interface ModuleWithSandiaParams {
  fabricante: string;
  modelo: string;
  potencia_nominal_w: number;
  largura_mm?: number;
  altura_mm?: number;
  peso_kg?: number;
  vmpp?: number;
  impp?: number;
  voc_stc?: number;
  isc_stc?: number;
  eficiencia?: number;
  temp_coef_pmax: number;
  // Parâmetros Sandia adicionais
  alpha_sc?: number;
  beta_oc?: number;
  gamma_r?: number;
  cells_in_series?: number;
  a_ref?: number;
  il_ref?: number;
  io_ref?: number;
  rs?: number;
  rsh_ref?: number;
}

export interface TemperatureCoefficients {
  tempCoeffPmax: number;
  alphaSc?: number;
  betaOc?: number;
  gammaR?: number;
}

export interface SandiaParameters {
  aRef?: number;
  ilRef?: number;
  ioRef?: number;
  rs?: number;
  rshRef?: number;
  cellsInSeries?: number;
}

export interface DiodeParameters {
  aRef?: number;
  ilRef?: number;
  ioRef?: number;
  rs?: number;
  rshRef?: number;
}