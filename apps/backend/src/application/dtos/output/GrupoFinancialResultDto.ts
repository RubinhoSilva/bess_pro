/**
 * @fileoverview Union type para resultados financeiros de ambos os grupos
 * @description Tipo unificado que pode ser Grupo A ou Grupo B
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-16
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Union type para polimorfismo entre grupos
 * - Type guards para validação unificada
 * - Utilitários para discriminação de tipos
 */

import { GrupoBFinancialResultDto } from './GrupoBFinancialResultDto';
import { GrupoAFinancialResultDto } from './GrupoAFinancialResultDto';

/**
 * Union type para resultados financeiros de ambos os grupos
 * @description Permite polimorfismo entre Grupo A e Grupo B
 * @usage Para funções que podem retornar qualquer tipo de resultado
 */
export type GrupoFinancialResultDto = GrupoBFinancialResultDto | GrupoAFinancialResultDto;

/**
 * Type guard para validar qualquer resultado de grupo
 * @description Verifica se objeto é GrupoBFinancialResultDto ou GrupoAFinancialResultDto
 * @param data Objeto a ser validado
 * @returns true se for resultado válido de qualquer grupo
 */
export function isGrupoFinancialResultDto(data: any): data is GrupoFinancialResultDto {
  // Importações dinâmicas para evitar dependência circular
  const { isGrupoBFinancialResultDto } = require('./GrupoBFinancialResultDto');
  const { isGrupoAFinancialResultDto } = require('./GrupoAFinancialResultDto');
  
  return isGrupoBFinancialResultDto(data) || isGrupoAFinancialResultDto(data);
}

/**
 * Obtém o grupo tarifário a partir do DTO
 * @description Extrai o tipo de grupo (A ou B) do DTO
 * @param dto Objeto de resultado financeiro
 * @returns 'A' para Grupo A, 'B' para Grupo B
 * @throws Error se DTO não for válido
 */
export function getGrupoFromDto(dto: GrupoFinancialResultDto): 'A' | 'B' {
  return dto.grupoTarifario;
}