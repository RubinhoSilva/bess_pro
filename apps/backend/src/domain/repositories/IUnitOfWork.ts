import { IAreaMontagemRepository } from "./IAreaMontagemRepository";
import { IGoogleApiKeyRepository } from "./IGoogleApiKeyRepository";
import { ILeadRepository } from "./ILeadRepository";
import { IModel3DRepository } from "./IModel3DRepository";
import { IProfileRepository } from "./IProfileRepository";
import { IProjectRepository } from "./IProjectRepository";
import { ISolarProjectRepository } from "./ISolarProjectRepository";
import { IUserRepository } from "./IUserRepository";

export interface IUnitOfWork {
  /**
   * Inicia uma transação
   */
  beginTransaction(): Promise<void>;

  /**
   * Confirma a transação
   */
  commit(): Promise<void>;

  /**
   * Desfaz a transação
   */
  rollback(): Promise<void>;

  /**
   * Executa operações em uma transação
   */
  executeInTransaction<T>(operation: () => Promise<T>): Promise<T>;

  // Repositórios disponíveis na transação
  users: IUserRepository;
  leads: ILeadRepository;
  projects: IProjectRepository;
  models3D: IModel3DRepository;
  areasMontagem: IAreaMontagemRepository;
  googleApiKeys: IGoogleApiKeyRepository;
  solarProjects: ISolarProjectRepository;
  profiles: IProfileRepository;
}
