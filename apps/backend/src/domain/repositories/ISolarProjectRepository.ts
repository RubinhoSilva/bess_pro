import { SolarProject } from "../entities/SolarProject";
import { Coordinates } from "../value-objects/Coordinates";
import { UserId } from "../value-objects/UserId";
import { IBaseRepository } from "./IBaseRepository";

export interface ISolarProjectRepository extends IBaseRepository<SolarProject, string> {
  /**
   * Busca projetos solares de um usuário
   */
  findByUserId(userId: UserId): Promise<SolarProject[]>;

  /**
   * Busca projeto por endereço
   */
  findByAddress(address: string, userId: UserId): Promise<SolarProject[]>;

  /**
   * Busca projetos próximos a uma coordenada
   */
  findNearCoordinates(
    coordinates: Coordinates,
    radiusKm: number,
    userId?: UserId
  ): Promise<SolarProject[]>;

  /**
   * Busca projetos com dados da API Solar
   */
  findWithSolarData(userId: UserId): Promise<SolarProject[]>;

  /**
   * Busca projetos sem dados da API Solar
   */
  findWithoutSolarData(userId: UserId): Promise<SolarProject[]>;

  /**
   * Busca projetos por região
   */
  findByRegion(userId: UserId, region: string): Promise<SolarProject[]>;

  /**
   * Verifica se endereço já tem projeto
   */
  addressHasProject(
    address: string,
    userId: UserId,
    excludeProjectId?: string
  ): Promise<boolean>;

  /**
   * Conta projetos por usuário
   */
  countByUserId(userId: UserId): Promise<number>;

  /**
   * Busca projetos ordenados por potencial solar
   */
  findOrderedBySolarPotential(userId: UserId): Promise<SolarProject[]>;

  /**
   * Estatísticas dos projetos solares
   */
  getSolarProjectStats(userId: UserId): Promise<{
    total: number;
    withCoordinates: number;
    withSolarData: number;
    avgSolarPotential: number;
    totalEstimatedGeneration: number;
  }>;
}