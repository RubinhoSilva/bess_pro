/**
 * @fileoverview Mapper especializado para resultados financeiros do Grupo A
 * @description Converte respostas Python (snake_case) para DTOs TypeScript (camelCase)
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-16
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Conversão de respostas Python para ResultadosCodigoA
 * - Validação de estrutura específica do Grupo A
 * - Tratamento especial para dados de sensibilidade
 * - Criação de DTOs de resposta completos
 */

import { 
  ResultadosCodigoA, 
  isResultadosCodigoA
} from '@bess-pro/shared';
import { GrupoAFinancialResultDto } from '../dtos/output';
import { objectSnakeToCamel } from '@bess-pro/shared';

/**
 * Logger para debugging e monitoramento
 * @description Interface simples para logging de erros e informações
 */
interface Logger {
  error(message: string, error?: any): void;
  info(message: string): void;
  warn(message: string): void;
}

/**
 * Logger padrão do ambiente
 * @description Usa console.log em desenvolvimento, integraria com sistema de logs em produção
 */
const logger: Logger = {
  error: (message: string, error?: any) => {
    console.error(`[GrupoAFinancialMapper] ERROR: ${message}`, error);
  },
  info: (message: string) => {
    console.log(`[GrupoAFinancialMapper] INFO: ${message}`);
  },
  warn: (message: string) => {
    console.warn(`[GrupoAFinancialMapper] WARN: ${message}`);
  }
};

/**
 * Classe especializada para mapeamento de resultados financeiros do Grupo A
 * @description Responsável pela conversão entre formatos Python e TypeScript
 * @pattern Static methods para facilitar uso sem instanciação
 */
export class GrupoAFinancialMapper {

  /**
   * Converte resposta Python (snake_case) para ResultadosCodigoA
   * @description Transforma dados do serviço Python para estrutura TypeScript tipada
   * @param pythonData Resposta do serviço Python em formato snake_case
   * @returns ResultadosCodigoA com estrutura validada
   * @throws Error se estrutura for inválida ou conversão falhar
   */
  static fromPythonResponse(pythonData: any): ResultadosCodigoA {
    try {
      logger.info('Iniciando conversão de resposta Python para Grupo A');

      // Validar estrutura básica antes da conversão
      if (!this.validatePythonResponse(pythonData)) {
        throw new Error('Estrutura da resposta Python é inválida para Grupo A');
      }

      // Converter objeto principal de snake_case para camelCase
      const camelCaseData = objectSnakeToCamel(pythonData);

      // Validação adicional após conversão
      if (!isResultadosCodigoA(camelCaseData)) {
        throw new Error('Dados convertidos não correspondem à estrutura esperada de ResultadosCodigoA');
      }

      logger.info('Conversão concluída com sucesso');
      return camelCaseData as ResultadosCodigoA;

    } catch (error) {
      logger.error('Erro durante conversão de resposta Python', error);
      throw new Error(`Falha na conversão de dados do Grupo A: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Cria DTO de resposta completo a partir dos dados convertidos
   * @description Adiciona metadados padrão à resposta para API
   * @param data Dados já convertidos para ResultadosCodigoA
   * @param projectId ID do projeto para rastreamento
   * @returns GrupoAFinancialResultDto completo com metadados
   */
  static toResponseDto(data: ResultadosCodigoA, projectId: string): GrupoAFinancialResultDto {
    try {
      logger.info(`Criando DTO de resposta para projeto ${projectId}`);

      // Validar projectId
      if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
        throw new Error('ProjectId inválido ou não fornecido');
      }

      // Gerar timestamp ISO
      const timestamp = new Date().toISOString();

      const responseDto: GrupoAFinancialResultDto = {
        success: true,
        grupoTarifario: 'A',
        data,
        timestamp,
        projectId: projectId.trim()
      };

      logger.info('DTO de resposta criado com sucesso');
      return responseDto;

    } catch (error) {
      logger.error('Erro durante criação do DTO de resposta', error);
      throw new Error(`Falha na criação do DTO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Converte resposta Python diretamente para DTO (método de conveniência)
   * @description Combina fromPythonResponse + toResponseDto em uma única chamada
   * @param pythonData Resposta do serviço Python
   * @param projectId ID do projeto para metadados
   * @returns GrupoAFinancialResultDto completo
   */
  static toDto(pythonData: any, projectId: string = 'unknown'): GrupoAFinancialResultDto {
    const convertedData = this.fromPythonResponse(pythonData);
    return this.toResponseDto(convertedData, projectId);
  }

  /**
   * Valida se resposta Python tem estrutura esperada para Grupo A
   * @description Verifica campos obrigatórios específicos do Grupo A antes da conversão
   * @param data Resposta Python a ser validada
   * @returns true se estrutura for válida, false caso contrário
   */
  static validatePythonResponse(data: any): boolean {
    try {
      // Verificar se objeto existe e é do tipo correto
      if (!data || typeof data !== 'object') {
        logger.warn('Dados inválidos: não é um objeto');
        return false;
      }

      // Campos obrigatórios em snake_case (formato Python) - Grupo A
      const requiredFields = [
        'somas_iniciais',
        'financeiro',
        'consumo_ano1',
        'tabela_resumo_anual',
        'tabela_fluxo_caixa',
        'dados_sensibilidade' // Específico do Grupo A
      ];

      // Verificar presença dos campos obrigatórios
      for (const field of requiredFields) {
        if (!(field in data)) {
          logger.warn(`Campo obrigatório ausente: ${field}`);
          return false;
        }
      }

      // Validar estrutura de somas_iniciais (Grupo A tem campos diferentes)
      const somasIniciais = data.somas_iniciais;
      if (!somasIniciais || typeof somasIniciais !== 'object') {
        logger.warn('Estrutura de somas_iniciais inválida');
        return false;
      }

      const somasIniciaisFields = ['geracao_anual', 'consumo_fora_ponta', 'consumo_ponta', 'capex'];
      for (const field of somasIniciaisFields) {
        if (!(field in somasIniciais)) {
          logger.warn(`Campo ausente em somas_iniciais: ${field}`);
          return false;
        }
      }

      // Validar estrutura de dados_sensibilidade (específico Grupo A)
      const dadosSensibilidade = data.dados_sensibilidade;
      if (!dadosSensibilidade || typeof dadosSensibilidade !== 'object') {
        logger.warn('Estrutura de dados_sensibilidade inválida');
        return false;
      }

      const sensibilidadeFields = ['multiplicadores_tarifa', 'vpl_matrix'];
      for (const field of sensibilidadeFields) {
        if (!(field in dadosSensibilidade)) {
          logger.warn(`Campo ausente em dados_sensibilidade: ${field}`);
          return false;
        }
      }

      // Validar que são arrays
      if (!Array.isArray(dadosSensibilidade.multiplicadores_tarifa)) {
        logger.warn('multiplicadores_tarifa não é um array');
        return false;
      }

      if (!Array.isArray(dadosSensibilidade.vpl_matrix)) {
        logger.warn('vpl_matrix não é um array');
        return false;
      }

      // Validar que arrays têm mesmo tamanho
      if (dadosSensibilidade.multiplicadores_tarifa.length !== dadosSensibilidade.vpl_matrix.length) {
        logger.warn('Arrays de sensibilidade têm tamanhos diferentes');
        return false;
      }

      // Validar estrutura financeira
      const financeiro = data.financeiro;
      if (!financeiro || typeof financeiro !== 'object') {
        logger.warn('Estrutura financeira inválida');
        return false;
      }

      const financeiroFields = [
        'vpl', 'tir', 'pi', 'payback_simples', 'payback_descontado',
        'lcoe', 'roi_simples', 'economia_total_nominal', 'economia_total_valor_presente'
      ];
      for (const field of financeiroFields) {
        if (!(field in financeiro)) {
          logger.warn(`Campo ausente em financeiro: ${field}`);
          return false;
        }
      }

      // Validar estrutura de consumo_ano1 (Grupo A tem separação ponta/fora-ponta)
      const consumoAno1 = data.consumo_ano1;
      if (!consumoAno1 || typeof consumoAno1 !== 'object') {
        logger.warn('Estrutura de consumo_ano1 inválida');
        return false;
      }

      const consumoFields = ['geracao', 'local_fora_ponta', 'local_ponta', 'remoto_fora_ponta', 'remoto_ponta'];
      for (const field of consumoFields) {
        if (!(field in consumoAno1)) {
          logger.warn(`Campo ausente em consumo_ano1: ${field}`);
          return false;
        }
      }

      // Validar arrays (devem ser arrays e não vazios)
      if (!Array.isArray(data.tabela_resumo_anual) || data.tabela_resumo_anual.length === 0) {
        logger.warn('tabela_resumo_anual inválida ou vazia');
        return false;
      }

      if (!Array.isArray(data.tabela_fluxo_caixa) || data.tabela_fluxo_caixa.length === 0) {
        logger.warn('tabela_fluxo_caixa inválida ou vazia');
        return false;
      }

      // Validar estrutura da tabela_resumo_anual (Grupo A tem campos específicos)
      const tabelaResumo = data.tabela_resumo_anual[0]; // Verificar primeiro item
      if (tabelaResumo && typeof tabelaResumo === 'object') {
        const tabelaFields = ['consumo_fora_ponta', 'consumo_ponta'];
        for (const field of tabelaFields) {
          if (!(field in tabelaResumo)) {
            logger.warn(`Campo ausente em tabela_resumo_anual: ${field}`);
            return false;
          }
        }
      }

      logger.info('Validação da resposta Python concluída com sucesso');
      return true;

    } catch (error) {
      logger.error('Erro durante validação da resposta Python', error);
      return false;
    }
  }

  /**
   * Método utilitário para conversão segura com fallback
   * @description Tenta converter, retorna null em caso de erro em vez de lançar exceção
   * @param pythonData Resposta Python
   * @returns ResultadosCodigoA ou null se falhar
   */
  static safeFromPythonResponse(pythonData: any): ResultadosCodigoA | null {
    try {
      return this.fromPythonResponse(pythonData);
    } catch (error) {
      logger.error('Falha na conversão segura (safeFromPythonResponse)', error);
      return null;
    }
  }

  /**
   * Método utilitário para criação segura de DTO com fallback
   * @description Tenta criar DTO, retorna null em caso de erro
   * @param data Dados convertidos
   * @param projectId ID do projeto
   * @returns GrupoAFinancialResultDto ou null se falhar
   */
  static safeToResponseDto(data: ResultadosCodigoA, projectId: string): GrupoAFinancialResultDto | null {
    try {
      return this.toResponseDto(data, projectId);
    } catch (error) {
      logger.error('Falha na criação segura do DTO (safeToResponseDto)', error);
      return null;
    }
  }

  /**
   * Valida e processa especificamente dados de sensibilidade
   * @description Método especializado para tratamento dos dados de sensibilidade do Grupo A
   * @param dadosSensibilidade Dados de sensibilidade em formato Python
   * @returns Dados processados ou null se inválido
   */
  static processDadosSensibilidade(dadosSensibilidade: any): any {
    try {
      if (!dadosSensibilidade || typeof dadosSensibilidade !== 'object') {
        return null;
      }

      const multiplicadores = dadosSensibilidade.multiplicadores_tarifa;
      const vplMatrix = dadosSensibilidade.vpl_matrix;

      if (!Array.isArray(multiplicadores) || !Array.isArray(vplMatrix)) {
        return null;
      }

      if (multiplicadores.length !== vplMatrix.length) {
        return null;
      }

      // Validar que todos os valores são números
      const allNumbers = multiplicadores.every(val => typeof val === 'number') &&
                        vplMatrix.every(val => typeof val === 'number');

      if (!allNumbers) {
        return null;
      }

      return {
        multiplicadoresTarifa: multiplicadores,
        vplMatrix: vplMatrix
      };

    } catch (error) {
      logger.error('Erro no processamento de dados de sensibilidade', error);
      return null;
    }
  }
}