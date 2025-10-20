import { ObjectId } from 'mongodb';

/**
 * UUIDs fixos para fabricantes de equipamentos solares
 * Garante consistência entre environments e elimina dependência de busca por nome
 */

export const MANUFACTURER_IDS = {
  // Fabricantes de Módulos Solares
  JINKO_SOLAR: new ObjectId('507f1f77bcf86cd799439011'),
  CANADIAN_SOLAR: new ObjectId('507f1f77bcf86cd799439012'),
  TRINA_SOLAR: new ObjectId('507f1f77bcf86cd799439013'),
  LONGI_SOLAR: new ObjectId('507f1f77bcf86cd799439014'),
  ODEX: new ObjectId('507f1f77bcf86cd799439015'),

  // Fabricantes de Inversores
  SMA_SOLAR_TECHNOLOGY: new ObjectId('507f1f77bcf86cd799439016'),
  FRONIUS: new ObjectId('507f1f77bcf86cd799439017'),
  HUAWEI: new ObjectId('507f1f77bcf86cd799439018'),
  SOLAREDGE: new ObjectId('507f1f77bcf86cd799439019'),

  // Fabricantes Híbridos (Ambos)
  GOODWE: new ObjectId('507f1f77bcf86cd799439020'),
  GROWATT: new ObjectId('507f1f77bcf86cd799439021'),
  CHINT: new ObjectId('507f1f77bcf86cd799439022')
} as const;

/**
 * Mapeamento de nome para ID para fácil referência
 */
export const MANUFACTURER_NAME_TO_ID = {
  'Jinko Solar': MANUFACTURER_IDS.JINKO_SOLAR,
  'Canadian Solar': MANUFACTURER_IDS.CANADIAN_SOLAR,
  'Trina Solar': MANUFACTURER_IDS.TRINA_SOLAR,
  'LONGi Solar': MANUFACTURER_IDS.LONGI_SOLAR,
  'SMA Solar Technology': MANUFACTURER_IDS.SMA_SOLAR_TECHNOLOGY,
  'Fronius': MANUFACTURER_IDS.FRONIUS,
  'Huawei': MANUFACTURER_IDS.HUAWEI,
  'SolarEdge': MANUFACTURER_IDS.SOLAREDGE,
  'GoodWe': MANUFACTURER_IDS.GOODWE,
  'Growatt': MANUFACTURER_IDS.GROWATT,
  'Chint': MANUFACTURER_IDS.CHINT,
  'Odex': MANUFACTURER_IDS.ODEX
} as const;

/**
 * Tipos para garantir consistência
 */
export type ManufacturerKey = keyof typeof MANUFACTURER_IDS;
export type ManufacturerName = keyof typeof MANUFACTURER_NAME_TO_ID;

/**
 * Função auxiliar para obter ID do fabricante
 */
export const getManufacturerId = (key: ManufacturerKey): ObjectId => {
  return MANUFACTURER_IDS[key];
};

/**
 * Função auxiliar para obter ID do fabricante pelo nome
 */
export const getManufacturerIdByName = (name: ManufacturerName): ObjectId => {
  return MANUFACTURER_NAME_TO_ID[name];
};

/**
 * Lista de todos os IDs para validação
 */
export const ALL_MANUFACTURER_IDS = Object.values(MANUFACTURER_IDS);