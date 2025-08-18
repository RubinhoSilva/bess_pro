export class Coordinates {
  private constructor(
    private readonly latitude: number,
    private readonly longitude: number
  ) {}

  static create(lat: number, lng: number): Coordinates {
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude deve estar entre -90 e 90');
    }
    if (lng < -180 || lng > 180) {
      throw new Error('Longitude deve estar entre -180 e 180');
    }
    return new Coordinates(lat, lng);
  }

  getLatitude(): number {
    return this.latitude;
  }

  getLongitude(): number {
    return this.longitude;
  }

  equals(other: Coordinates): boolean {
    return this.latitude === other.getLatitude() && 
           this.longitude === other.getLongitude();
  }

  distanceTo(other: Coordinates): number {
    // Cálculo da distância usando fórmula de Haversine
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(other.latitude - this.latitude);
    const dLon = this.toRadians(other.longitude - this.longitude);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(other.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }
}