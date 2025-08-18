import { ProjectType, Project } from "../entities/Project";
import { Coordinates } from "../value-objects/Coordinates";
import { ProjectId } from "../value-objects/ProjectId";
import { UserId } from "../value-objects/UserId";
import { ISoftDeleteRepository } from "./IBaseRepository";

export interface ProjectSearchFilters {
  projectType?: ProjectType;
  hasLocation?: boolean;
  hasLead?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  searchTerm?: string;
}

export interface ProjectSummary {
  id: string;
  projectName: string;
  projectType: ProjectType;
  address: string;
  savedAt: Date;
  hasLocation: boolean;
  leadId?: string;
}

export interface IProjectRepository extends ISoftDeleteRepository<Project, string> {
  /**
   * Busca projetos de um usuário específico
   */
  findByUserId(userId: UserId): Promise<Project[]>;

  /**
   * Busca projetos por tipo
   */
  findByTypeAndUserId(
    projectType: ProjectType,
    userId: UserId
  ): Promise<Project[]>;

  /**
   * Busca projeto por lead
   */
  findByLeadId(leadId: string, userId: UserId): Promise<Project | null>;

  /**
   * Busca projetos com filtros
   */
  findWithFilters(
    userId: UserId,
    filters: ProjectSearchFilters
  ): Promise<Project[]>;

  /**
   * Busca resumo dos projetos (sem dados completos)
   */
  findSummariesByUserId(userId: UserId): Promise<ProjectSummary[]>;

  /**
   * Busca projetos próximos a uma coordenada
   */
  findNearLocation(
    coordinates: Coordinates,
    radiusKm: number,
    userId?: UserId
  ): Promise<Project[]>;

  /**
   * Busca projetos modificados recentemente
   */
  findRecentlyModified(
    userId: UserId,
    daysAgo: number
  ): Promise<Project[]>;

  /**
   * Conta projetos por tipo
   */
  countByType(userId: UserId): Promise<Record<ProjectType, number>>;

  /**
   * Busca projetos ordenados por prioridade
   */
  findByUserIdOrderedByPriority(userId: UserId): Promise<Project[]>;

  /**
   * Verifica se nome do projeto já existe para o usuário
   */
  projectNameExists(
    projectName: string,
    userId: UserId,
    excludeProjectId?: ProjectId
  ): Promise<boolean>;

  /**
   * Busca projetos por região brasileira
   */
  findByRegion(userId: UserId, region: string): Promise<Project[]>;

  /**
   * Estatísticas dos projetos do usuário
   */
  getProjectStats(userId: UserId): Promise<{
    total: number;
    byType: Record<ProjectType, number>;
    withLocation: number;
    withLead: number;
    avgPowerKWp: number;
    totalPowerKWp: number;
  }>;
}