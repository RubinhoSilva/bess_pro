import { User } from "../entities/User";
import { Email } from "../value-objects/Email";
import { UserId } from "../value-objects/UserId";
import { ISoftDeleteRepository } from "./IBaseRepository";

export interface IUserRepository extends ISoftDeleteRepository<User, string> {
  /**
   * Busca usuário por email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Cria um novo usuário com senha hash
   */
  createWithPassword(user: User, passwordHash: string): Promise<User>;

  /**
   * Busca usuário por email com senha hash (para login)
   */
  findByEmailWithPassword(email: Email): Promise<{ user: User; passwordHash: string } | null>;

  /**
   * Verifica se email já existe
   */
  emailExists(email: Email): Promise<boolean>;

  /**
   * Lista todos os usuários (apenas para admin)
   */
  findAll(): Promise<User[]>;

  /**
   * Busca usuários por role
   */
  findByRole(role: string): Promise<User[]>;

  /**
   * Busca usuários por empresa
   */
  findByCompany(company: string): Promise<User[]>;

  /**
   * Atualiza dados básicos do usuário
   */
  updateProfile(userId: UserId, data: {
    name?: string;
    company?: string;
    logoUrl?: string;
  }): Promise<void>;

  /**
   * Conta total de usuários por role
   */
  countByRole(): Promise<Record<string, number>>;

  /**
   * Busca usuários criados em um período
   */
  findCreatedBetween(startDate: Date, endDate: Date): Promise<User[]>;

  /**
   * Busca usuários por team
   */
  findByTeamId(teamId: string): Promise<User[]>;

  /**
   * Atualiza a senha do usuário
   */
  updatePassword(userId: UserId, passwordHash: string): Promise<void>;
}