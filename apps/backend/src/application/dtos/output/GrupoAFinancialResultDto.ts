/**
 * @fileoverview DTO para resultados financeiros do Grupo A
 * @description Interface para resposta de cálculos financeiros de consumidores do Grupo A
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-16
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Interface para resposta de resultados financeiros do Grupo A
 * - Metadados padrão para todas as respostas financeiras
 * - Type safety para comunicação frontend-backend
 */

import { ResultadosCodigoA } from '@bess-pro/shared';

/**
 * Interface para DTO de resultado financeiro do Grupo A
 * @description Estrutura padrão para resposta de cálculos financeiros do Grupo A
 * @usage Para comunicação entre backend e frontend
 * @pattern Resposta padronizada com metadados
 */
export interface GrupoAFinancialResultDto {
  /** 
   * Flag de sucesso da operação
   * @description true se cálculo foi executado com sucesso
   * @pattern Sempre true para respostas bem-sucedidas
   */
  success: true;

  /** 
   * Identificador do grupo tarifário
   * @description Fixo como 'A' para este DTO
   * @usage Para discriminação de tipo no frontend
   */
  grupoTarifario: 'A';

  /** 
   * Dados do resultado financeiro
   * @description Contém todos os resultados do cálculo financeiro
   * @type ResultadosCodigoA com estrutura completa
   */
  data: ResultadosCodigoA;

  /** 
   * Timestamp da resposta
   * @description Data e hora de geração do resultado em formato ISO
   * @example '2025-10-16T10:30:00.000Z'
   * @usage Para controle de versão e cache
   */
  timestamp: string;

  /** 
   * Identificador do projeto
   * @description ID único do projeto associado ao cálculo
   * @usage Para rastreamento e persistência
   */
  projectId: string;
}

/**
 * Type guard para validar GrupoAFinancialResultDto
 * @description Verifica se objeto contém estrutura válida de DTO do Grupo A
 * @param data Objeto a ser validado
 * @returns true se for GrupoAFinancialResultDto válido
 */
export function isGrupoAFinancialResultDto(data: any): data is GrupoAFinancialResultDto {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Verificar campos obrigatórios
  const requiredFields = ['success', 'grupoTarifario', 'data', 'timestamp', 'projectId'];
  if (!requiredFields.every(field => field in data)) {
    return false;
  }

  // Verificar valores específicos
  if (data.success !== true || data.grupoTarifario !== 'A') {
    return false;
  }

  // Verificar formato do timestamp
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!timestampRegex.test(data.timestamp)) {
    return false;
  }

  // Verificar projectId
  if (typeof data.projectId !== 'string' || data.projectId.length === 0) {
    return false;
  }

  return true;
}