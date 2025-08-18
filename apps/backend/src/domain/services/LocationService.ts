import { Project } from "../entities/Project";
import { Coordinates } from "../value-objects/Coordinates";

export class LocationService {
  /**
   * Valida se coordenadas estão no território brasileiro
   */
  static isInBrazil(coordinates: Coordinates): boolean {
    const lat = coordinates.getLatitude();
    const lng = coordinates.getLongitude();

    // Limites aproximados do Brasil
    return lat >= -34 && lat <= 5.5 && lng >= -74 && lng <= -34;
  }

  /**
   * Calcula a região do Brasil baseada nas coordenadas
   */
  static getBrazilianRegion(coordinates: Coordinates): string {
    const lat = coordinates.getLatitude();
    const lng = coordinates.getLongitude();

    if (lat >= -15 && lng >= -50) return 'Norte';
    if (lat >= -15 && lat <= -5 && lng >= -50 && lng <= -40) return 'Nordeste';
    if (lat >= -25 && lat <= -5 && lng >= -55 && lng <= -40) return 'Centro-Oeste';
    if (lat >= -25 && lng >= -55 && lng <= -40) return 'Sudeste';
    if (lat <= -25) return 'Sul';

    return 'Indeterminada';
  }

  /**
   * Calcula a distância entre dois projetos
   */
  static calculateProjectDistance(project1: Project, project2: Project): number | null {
    const location1 = project1.getLocation();
    const location2 = project2.getLocation();

    if (!location1 || !location2) {
      return null;
    }

    return location1.distanceTo(location2);
  }

  /**
   * Encontra projetos próximos dentro de um raio
   */
  static areProjectsNearby(
    project1: Project,
    project2: Project,
    maxDistanceKm: number
  ): boolean {
    const distance = this.calculateProjectDistance(project1, project2);
    return distance !== null && distance <= maxDistanceKm;
  }

  /**
   * Calcula a orientação ideal para painéis solares baseada na localização
   */
  static getOptimalPanelOrientation(coordinates: Coordinates): {
    inclination: number;
    azimuth: number;
  } {
    const latitude = coordinates.getLatitude();

    // Inclinação ideal = latitude (simplificado)
    let inclination = Math.abs(latitude);

    // No hemisfério sul (Brasil), painéis devem apontar para o norte
    const azimuth = 0; // Norte = 0°

    // Ajustes para maximizar a geração
    if (inclination < 5) inclination = 5; // Mínimo para limpeza
    if (inclination > 60) inclination = 60; // Máximo prático

    return { inclination, azimuth };
  }
}