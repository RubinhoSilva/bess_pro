import { Profile } from "../entities/Profile";
import { UserId } from "../value-objects/UserId";
import { IBaseRepository } from "./IBaseRepository";

export interface IProfileRepository extends IBaseRepository<Profile, string> {
  /**
   * Busca perfil por usuário
   */
  findByUserId(userId: UserId): Promise<Profile | null>;

  /**
   * Busca perfis por empresa
   */
  findByCompany(company: string): Promise<Profile[]>;

  /**
   * Busca perfis por role
   */
  findByRole(role: string): Promise<Profile[]>;

  /**
   * Atualiza perfil por usuário
   */
  updateByUserId(userId: UserId, data: {
    name?: string;
    company?: string;
    role?: string;
    logoUrl?: string;
  }): Promise<void>;

  /**
   * Remove perfil por usuário
   */
  deleteByUserId(userId: UserId): Promise<void>;

  /**
   * Verifica se perfil existe para usuário
   */
  existsByUserId(userId: UserId): Promise<boolean>;

  /**
   * Lista todos os perfis (admin)
   */
  findAll(): Promise<Profile[]>;

  /**
   * Conta perfis por role
   */
  countByRole(): Promise<Record<string, number>>;

  /**
   * Busca perfis atualizados recentemente
   */
  findRecentlyUpdated(daysAgo: number): Promise<Profile[]>;

  /**
   * Busca perfis por termo de busca
   */
  searchProfiles(searchTerm: string): Promise<Profile[]>;
}
