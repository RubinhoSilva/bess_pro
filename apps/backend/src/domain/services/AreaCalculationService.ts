import { AreaMontagem } from "../entities/AreaMontagem";
import { Coordinates } from "../value-objects/Coordinates";
import { LocationService } from "./LocationService";

export interface ModuleSpecs {
  width: number; // metros
  height: number; // metros
  power: number; // Wp
}

export interface LayoutResult {
  rows: number;
  columns: number;
  totalModules: number;
  usedArea: number;
  efficiency: number; // % da área utilizada
}

export class AreaCalculationService {
  /**
   * Calcula o layout otimizado de módulos em uma área
   */
  static calculateOptimalLayout(
    area: AreaMontagem,
    moduleSpecs: ModuleSpecs,
    spacing: { row: number; column: number } = { row: 0.5, column: 0.02 }
  ): LayoutResult {
    const coordinates = area.getCoordinates();
    
    // Assumindo área retangular (simplificado)
    const areaWidth = coordinates.width || 10;
    const areaHeight = coordinates.height || 10;
    const areaTotal = areaWidth * areaHeight;

    // Calcular número de módulos que cabem
    const moduleWithSpacingWidth = moduleSpecs.width + spacing.column;
    const moduleWithSpacingHeight = moduleSpecs.height + spacing.row;

    const columns = Math.floor(areaWidth / moduleWithSpacingWidth);
    const rows = Math.floor(areaHeight / moduleWithSpacingHeight);

    const totalModules = rows * columns;
    const usedArea = totalModules * (moduleSpecs.width * moduleSpecs.height);
    const efficiency = (usedArea / areaTotal) * 100;

    return {
      rows,
      columns,
      totalModules,
      usedArea,
      efficiency
    };
  }

  /**
   * Calcula a potência total instalada na área
   */
  static calculateInstalledPower(
    layoutResult: LayoutResult,
    moduleSpecs: ModuleSpecs
  ): number {
    return (layoutResult.totalModules * moduleSpecs.power) / 1000; // kWp
  }

  /**
   * Calcula perdas por inclinação e orientação
   */
  static calculateOrientationLosses(
    inclination: number, // graus
    azimuth: number, // graus (0 = Norte)
    coordinates: Coordinates
  ): number {
    const optimalOrientation = LocationService.getOptimalPanelOrientation(coordinates);
    
    // Perda por inclinação
    const inclinationLoss = Math.abs(inclination - optimalOrientation.inclination) * 0.5;
    
    // Perda por orientação (azimute)
    const azimuthLoss = Math.abs(azimuth - optimalOrientation.azimuth) * 0.3;
    
    // Perda total (não linear)
    const totalLoss = Math.min(inclinationLoss + azimuthLoss, 30); // Máximo 30%
    
    return totalLoss;
  }

  /**
   * Verifica se uma área tem tamanho mínimo viável
   */
  static isViableArea(area: AreaMontagem, minModules: number = 4): boolean {
    const coordinates = area.getCoordinates();
    const areaSize = (coordinates.width || 0) * (coordinates.height || 0);
    
    // Área mínima para pelo menos 4 módulos (2x2m cada + espaçamentos)
    const minAreaRequired = minModules * 4; // 4m² por módulo + espaçamentos
    
    return areaSize >= minAreaRequired;
  }

  /**
   * Calcula o sombreamento entre fileiras de módulos
   */
  static calculateRowShading(
    moduleHeight: number,
    inclination: number,
    rowSpacing: number,
    coordinates: Coordinates
  ): number {
    const latitude = Math.abs(coordinates.getLatitude());
    
    // Altura da sombra ao meio-dia no solstício de inverno
    const shadowHeight = moduleHeight * Math.sin(inclination * Math.PI / 180);
    const shadowLength = shadowHeight / Math.tan((90 - latitude - 23.5) * Math.PI / 180);
    
    // Percentual de sombreamento
    const shadingPercentage = Math.max(0, (shadowLength - rowSpacing) / moduleHeight * 100);
    
    return Math.min(shadingPercentage, 50); // Máximo 50% de sombreamento
  }
}