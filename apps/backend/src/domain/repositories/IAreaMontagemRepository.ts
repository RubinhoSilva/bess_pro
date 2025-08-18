import { AreaMontagem } from "../entities/AreaMontagem";
import { ProjectId } from "../value-objects/ProjectId";
import { UserId } from "../value-objects/UserId";
import { IBaseRepository } from "./IBaseRepository";

export interface IAreaMontagemRepository extends IBaseRepository<AreaMontagem, string> {
  /**
   * Busca áreas de um projeto específico
   */
  findByProjectId(projectId: ProjectId, userId: UserId): Promise<AreaMontagem[]>;

  /**
   * Busca áreas de um usuário específico
   */
  findByUserId(userId: UserId): Promise<AreaMontagem[]>;

  /**
   * Busca áreas com layout de módulos definido
   */
  findWithModuleLayout(
    projectId: ProjectId,
    userId: UserId
  ): Promise<AreaMontagem[]>;

  /**
   * Busca áreas por nome
   */
  findByName(
    name: string,
    projectId: ProjectId,
    userId: UserId
  ): Promise<AreaMontagem[]>;

  /**
   * Verifica se nome da área já existe no projeto
   */
  areaNameExists(
    name: string,
    projectId: ProjectId,
    excludeAreaId?: string
  ): Promise<boolean>;

  /**
   * Remove todas as áreas de um projeto
   */
  deleteByProjectId(projectId: ProjectId): Promise<void>;

  /**
   * Conta áreas por projeto
   */
  countByProjectId(projectId: ProjectId): Promise<number>;

  /**
   * Calcula área total de instalação do projeto
   */
  calculateTotalInstallationArea(projectId: ProjectId): Promise<number>;

  /**
   * Busca áreas com mais de X módulos
   */
  findAreasWithMinModules(
    projectId: ProjectId,
    minModules: number
  ): Promise<AreaMontagem[]>;

  /**
   * Estatísticas das áreas
   */
  getAreaStats(projectId: ProjectId): Promise<{
    totalAreas: number;
    totalModules: number;
    totalAreaM2: number;
    averageModulesPerArea: number;
    largestArea: AreaMontagem | null;
  }>;

  /**
   * Clona áreas de um projeto para outro
   */
  cloneAreasToProject(
    sourceProjectId: ProjectId,
    targetProjectId: ProjectId,
    userId: UserId
  ): Promise<AreaMontagem[]>;
}