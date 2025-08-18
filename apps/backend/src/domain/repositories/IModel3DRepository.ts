import { Model3D } from "../entities/Model3D";
import { ProjectId } from "../value-objects/ProjectId";
import { UserId } from "../value-objects/UserId";
import { IBaseRepository } from "./IBaseRepository";

export interface IModel3DRepository extends IBaseRepository<Model3D, string> {
  /**
   * Busca modelos de um usuário específico
   */
  findByUserId(userId: UserId): Promise<Model3D[]>;

  /**
   * Busca modelos de um projeto específico
   */
  findByProjectId(projectId: ProjectId, userId: UserId): Promise<Model3D[]>;

  /**
   * Busca modelo por nome
   */
  findByName(name: string, userId: UserId): Promise<Model3D[]>;

  /**
   * Busca modelos por formato de arquivo
   */
  findByFileExtension(
    extension: string,
    userId: UserId
  ): Promise<Model3D[]>;

  /**
   * Busca modelos criados em um período
   */
  findCreatedBetween(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<Model3D[]>;

  /**
   * Busca modelos compartilháveis (biblioteca)
   */
  findLibraryModels(userId: UserId): Promise<Model3D[]>;

  /**
   * Verifica se modelo está sendo usado em algum projeto
   */
  isModelInUse(modelId: string): Promise<boolean>;

  /**
   * Conta modelos por usuário
   */
  countByUserId(userId: UserId): Promise<number>;

  /**
   * Busca modelos por termo de busca
   */
  searchByTerm(userId: UserId, searchTerm: string): Promise<Model3D[]>;

  /**
   * Lista modelos ordenados por data de criação
   */
  findByUserIdOrderedByDate(
    userId: UserId,
    ascending?: boolean
  ): Promise<Model3D[]>;

  /**
   * Remove modelo e seus arquivos associados
   */
  deleteWithFiles(modelId: string): Promise<void>;

  /**
   * Estatísticas dos modelos
   */
  getModelStats(userId: UserId): Promise<{
    total: number;
    byFormat: Record<string, number>;
    totalSizeGB: number;
    mostUsed: Model3D[];
  }>;
}
