/**
 * @fileoverview DTO para resultados financeiros do Grupo B
 * @description Interface para resposta de cálculos financeiros de consumidores do Grupo B
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-16
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Interface para resposta de resultados financeiros do Grupo B
 * - Metadados padrão para todas as respostas financeiras
 * - Type safety para comunicação frontend-backend
 */

import { ResultadosCodigoB } from '@bess-pro/shared';

/**
 * Interface para DTO de resultado financeiro do Grupo B
 * @description Estrutura padrão para resposta de cálculos financeiros do Grupo B
 * @usage Para comunicação entre backend e frontend
 * @pattern Resposta padronizada com metadados
 */
export interface GrupoBFinancialResultDto {
  /** 
   * Flag de sucesso da operação
   * @description true se cálculo foi executado com sucesso
   * @pattern Sempre true para respostas bem-sucedidas
   */
  success: true;

  /** 
   * Identificador do grupo tarifário
   * @description Fixo como 'B' para este DTO
   * @usage Para discriminação de tipo no frontend
   */
  grupoTarifario: 'B';

  /** 
   * Dados do resultado financeiro
   * @description Contém todos os resultados do cálculo financeiro
   * @type ResultadosCodigoB com estrutura completa
   */
  data: ResultadosCodigoB;

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
 * Type guard para validar GrupoBFinancialResultDto
 * @description Verifica se objeto contém estrutura válida de DTO do Grupo B
 * @param data Objeto a ser validado
 * @returns true se for GrupoBFinancialResultDto válido
 */
export function isGrupoBFinancialResultDto(data: any): data is GrupoBFinancialResultDto {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Verificar campos obrigatórios
  const requiredFields = ['success', 'grupoTarifario', 'data', 'timestamp', 'projectId'];
  if (!requiredFields.every(field => field in data)) {
    return false;
  }

  // Verificar valores específicos
  if (data.success !== true || data.grupoTarifario !== 'B') {
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