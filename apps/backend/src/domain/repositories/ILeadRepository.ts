import { Lead, LeadStage, LeadSource } from "../entities/Lead";
import { Email } from "../value-objects/Email";
import { UserId } from "../value-objects/UserId";
import { ISoftDeleteRepository } from "./IBaseRepository";

export interface ILeadRepository extends ISoftDeleteRepository<Lead, string> {
  /**
   * Busca leads de um usuário específico
   */
  findByUserId(userId: UserId): Promise<Lead[]>;

  /**
   * Busca lead por email
   */
  findByEmail(email: Email, userId: UserId): Promise<Lead | null>;

  /**
   * Busca leads por empresa
   */
  findByCompany(company: string, userId: UserId): Promise<Lead[]>;

  /**
   * Busca leads criados em um período
   */
  findCreatedBetween(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<Lead[]>;

  /**
   * Busca leads por termo (nome, email, empresa)
   */
  searchByTerm(userId: UserId, searchTerm: string): Promise<Lead[]>;

  /**
   * Conta leads por usuário
   */
  countByUserId(userId: UserId): Promise<number>;

  /**
   * Busca leads sem projeto associado
   */
  findLeadsWithoutProject(userId: UserId): Promise<Lead[]>;

  /**
   * Busca leads por região (baseado no endereço)
   */
  findByRegion(userId: UserId, region: string): Promise<Lead[]>;

  /**
   * Lista leads ordenados por data de criação
   */
  findByUserIdOrderedByDate(
    userId: UserId,
    ascending?: boolean
  ): Promise<Lead[]>;

  /**
   * Busca leads por estágio (stage)
   */
  findByStage(userId: UserId, stage: LeadStage): Promise<Lead[]>;

  /**
   * Busca leads por fonte (source)
   */
  findBySource(userId: UserId, source: LeadSource): Promise<Lead[]>;

  /**
   * Busca leads por múltiplos estágios
   */
  findByStages(userId: UserId, stages: LeadStage[]): Promise<Lead[]>;

  /**
   * Conta leads por estágio
   */
  countByStage(userId: UserId): Promise<Record<LeadStage, number>>;

  /**
   * Atualiza estágio de um lead
   */
  updateStage(leadId: string, stage: LeadStage): Promise<void>;

  /**
   * Atualiza cor de destaque do lead
   */
  updateColorHighlight(leadId: string, color: string): Promise<void>;

  /**
   * Busca leads com valor estimado em um range
   */
  findByEstimatedValueRange(
    userId: UserId,
    minValue: number,
    maxValue: number
  ): Promise<Lead[]>;

  /**
   * Busca leads com data esperada de fechamento próxima
   */
  findByExpectedCloseDateRange(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<Lead[]>;

  /**
   * Lista leads ordenados por valor estimado
   */
  findByUserIdOrderedByValue(
    userId: UserId,
    ascending?: boolean
  ): Promise<Lead[]>;

  /**
   * Lista leads ordenados por data de atualização
   */
  findByUserIdOrderedByUpdatedDate(
    userId: UserId,
    ascending?: boolean
  ): Promise<Lead[]>;

  /**
   * Busca leads de um usuário incluindo os deletados
   */
  findByUserIdIncludingDeleted(userId: UserId): Promise<Lead[]>;

  /**
   * Busca leads deletados de um usuário
   */
  findDeletedByUserId(userId: UserId): Promise<Lead[]>;

  /**
   * Conta leads deletados por usuário
   */
  countDeletedByUserId(userId: UserId): Promise<number>;
}