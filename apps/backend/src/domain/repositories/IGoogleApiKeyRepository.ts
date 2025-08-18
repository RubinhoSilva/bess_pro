import { GoogleApiKey } from "../entities/GoogleApiKey";
import { UserId } from "../value-objects/UserId";
import { IBaseRepository } from "./IBaseRepository";

export interface IGoogleApiKeyRepository extends IBaseRepository<GoogleApiKey, string> {
  /**
   * Busca chave API de um usuário
   */
  findByUserId(userId: UserId): Promise<GoogleApiKey | null>;

  /**
   * Verifica se usuário tem chave API válida
   */
  hasValidApiKey(userId: UserId): Promise<boolean>;

  /**
   * Remove chave API de um usuário
   */
  deleteByUserId(userId: UserId): Promise<void>;

  /**
   * Lista usuários com chave API
   */
  findUsersWithApiKey(): Promise<UserId[]>;

  /**
   * Verifica se uma chave API já está sendo usada
   */
  isApiKeyInUse(apiKey: string, excludeUserId?: UserId): Promise<boolean>;

  /**
   * Conta usuários com chave API configurada
   */
  countUsersWithApiKey(): Promise<number>;

  /**
   * Busca chaves criadas em um período
   */
  findCreatedBetween(startDate: Date, endDate: Date): Promise<GoogleApiKey[]>;

  /**
   * Atualiza chave API de um usuário
   */
  updateApiKeyByUserId(userId: UserId, newApiKey: string): Promise<void>;
}
