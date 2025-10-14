/**
 * Losses-related types for solar analysis
 */

export interface LossesBreakdown {
  sujeira: number;
  sombreamento: number;
  incompatibilidade: number;
  fiacao: number;
  outras: number;
}

export interface DetailedLosses {
  perdaTemperatura: number;
  perdaSombreamento: number;
  perdaMismatch: number;
  perdaCabeamento: number;
  perdaSujeira: number;
  perdaOutras: number;
  perdaClipping?: number;
}

export interface SystemLosses {
  temperatureLoss: number;
  shadingLoss: number;
  mismatchLoss: number;
  cablingLoss: number;
  soilingLoss: number;
  otherLosses: number;
  clippingLoss?: number;
}