/**
 * @fileoverview Mapper especializado para resultados financeiros do Grupo B
 * @description Converte respostas Python (snake_case) para DTOs TypeScript (camelCase)
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-16
 * 
 * ESTE ARQUIVO CONTÉM:
 * - Conversão de respostas Python para ResultadosCodigoB
 * - Validação de estrutura de dados
 * - Criação de DTOs de resposta completos
 * - Tratamento de erros robusto
 */

import { 
  ResultadosCodigoB, 
  isResultadosCodigoB
} from '@bess-pro/shared';
import { GrupoBFinancialResultDto } from '../dtos/output';
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
    console.error(`[GrupoBFinancialMapper] ERROR: ${message}`, error);
  },
  info: (message: string) => {
    console.log(`[GrupoBFinancialMapper] INFO: ${message}`);
  },
  warn: (message: string) => {
    console.warn(`[GrupoBFinancialMapper] WARN: ${message}`);
  }
};

/**
 * Classe especializada para mapeamento de resultados financeiros do Grupo B
 * @description Responsável pela conversão entre formatos Python e TypeScript
 * @pattern Static methods para facilitar uso sem instanciação
 */
export class GrupoBFinancialMapper {

  /**
   * Converte resposta Python (snake_case) para ResultadosCodigoB
   * @description Transforma dados do serviço Python para estrutura TypeScript tipada
   * @param pythonData Resposta do serviço Python em formato snake_case
   * @returns ResultadosCodigoB com estrutura validada
   * @throws Error se estrutura for inválida ou conversão falhar
   */
  static fromPythonResponse(pythonData: any): ResultadosCodigoB {
    try {
      logger.info('Iniciando conversão de resposta Python para Grupo B');

      // Validar estrutura básica antes da conversão
      if (!this.validatePythonResponse(pythonData)) {
        throw new Error('Estrutura da resposta Python é inválida para Grupo B');
      }

      // Converter objeto principal de snake_case para camelCase
      const camelCaseData = objectSnakeToCamel(pythonData);

      // Log detalhado para debug
      logger.info('Estrutura convertida para camelCase:');
      logger.info('Campos principais: ' + Object.keys(camelCaseData).join(', '));
      if (camelCaseData.somasIniciais) {
        logger.info('somasIniciais: ' + Object.keys(camelCaseData.somasIniciais).join(', '));
      }
      if (camelCaseData.comparativoCustoAbatimento) {
        logger.info('comparativoCustoAbatimento: ' + Object.keys(camelCaseData.comparativoCustoAbatimento).join(', '));
      }
      if (camelCaseData.consumoAno1) {
        logger.info('consumoAno1: ' + Object.keys(camelCaseData.consumoAno1).join(', '));
      }
      if (camelCaseData.tabelaResumoAnual && camelCaseData.tabelaResumoAnual.length > 0) {
        logger.info('tabelaResumoAnual[0]: ' + Object.keys(camelCaseData.tabelaResumoAnual[0]).join(', '));
      }
      if (camelCaseData.tabelaFluxoCaixa && camelCaseData.tabelaFluxoCaixa.length > 0) {
        logger.info('tabelaFluxoCaixa[0]: ' + Object.keys(camelCaseData.tabelaFluxoCaixa[0]).join(', '));
      }

      // Validação adicional após conversão
      if (!isResultadosCodigoB(camelCaseData)) {
        // Análise detalhada da falha
        const requiredFields = ['somasIniciais', 'comparativoCustoAbatimento', 'financeiro', 'consumoAno1', 'tabelaResumoAnual', 'tabelaFluxoCaixa'];
        const missingFields = requiredFields.filter(field => !(field in camelCaseData));
        if (missingFields.length > 0) {
          logger.error('Campos obrigatórios ausentes: ' + missingFields.join(', '));
        }

        if (camelCaseData.comparativoCustoAbatimento) {
          const grupoBFields = ['custoSemSistema', 'custoComSistema', 'economiaAnual'];
          const missingGrupoBFields = grupoBFields.filter(field => !(field in camelCaseData.comparativoCustoAbatimento));
          if (missingGrupoBFields.length > 0) {
            logger.error('Campos do comparativoCustoAbatimento ausentes: ' + missingGrupoBFields.join(', '));
            logger.error('Disponíveis: ' + Object.keys(camelCaseData.comparativoCustoAbatimento).join(', '));
          }
        }

        throw new Error('Dados convertidos não correspondem à estrutura esperada de ResultadosCodigoB');
      }

      logger.info('Conversão concluída com sucesso');
      return camelCaseData as ResultadosCodigoB;

    } catch (error) {
      logger.error('Erro durante conversão de resposta Python', error);
      throw new Error(`Falha na conversão de dados do Grupo B: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Cria DTO de resposta completo a partir dos dados convertidos
   * @description Adiciona metadados padrão à resposta para API
   * @param data Dados já convertidos para ResultadosCodigoB
   * @param projectId ID do projeto para rastreamento
   * @returns GrupoBFinancialResultDto completo com metadados
   */
  static toResponseDto(data: ResultadosCodigoB, projectId: string): GrupoBFinancialResultDto {
    try {
      logger.info(`Criando DTO de resposta para projeto ${projectId}`);

      // Validar projectId
      if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
        throw new Error('ProjectId inválido ou não fornecido');
      }

      // Gerar timestamp ISO
      const timestamp = new Date().toISOString();

      const responseDto: GrupoBFinancialResultDto = {
        success: true,
        grupoTarifario: 'B',
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
   * @returns GrupoBFinancialResultDto completo
   */
  static toDto(pythonData: any, projectId: string = 'unknown'): GrupoBFinancialResultDto {
    const convertedData = this.fromPythonResponse(pythonData);
    return this.toResponseDto(convertedData, projectId);
  }

  /**
   * Valida se resposta Python tem estrutura esperada para Grupo B
   * @description Verifica campos obrigatórios antes da conversão
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

      // Campos obrigatórios em snake_case (formato Python)
      const requiredFields = [
        'somas_iniciais',
        'comparativo_custo_abatimento', 
        'financeiro',
        'consumo_ano1',
        'tabela_resumo_anual',
        'tabela_fluxo_caixa'
      ];

      // Verificar presença dos campos obrigatórios
      for (const field of requiredFields) {
        if (!(field in data)) {
          logger.warn(`Campo obrigatório ausente: ${field}`);
          return false;
        }
      }

      // Validar estrutura de somas_iniciais
      const somasIniciais = data.somas_iniciais;
      if (!somasIniciais || typeof somasIniciais !== 'object') {
        logger.warn('Estrutura de somas_iniciais inválida');
        return false;
      }

      const somasIniciaisFields = ['geracao_anual', 'consumo_anual', 'capex'];
      for (const field of somasIniciaisFields) {
        if (!(field in somasIniciais)) {
          logger.warn(`Campo ausente em somas_iniciais: ${field}`);
          return false;
        }
      }

      // Validar estrutura de comparativo_custo_abatimento (específico Grupo B)
      const comparativoCusto = data.comparativo_custo_abatimento;
      if (!comparativoCusto || typeof comparativoCusto !== 'object') {
        logger.warn('Estrutura de comparativo_custo_abatimento inválida');
        return false;
      }

      const comparativoFields = ['custo_sem_sistema', 'custo_com_sistema', 'economia_anual'];
      for (const field of comparativoFields) {
        if (!(field in comparativoCusto)) {
          logger.warn(`Campo ausente em comparativo_custo_abatimento: ${field}`);
          return false;
        }
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

      // Validar arrays (devem ser arrays e não vazios)
      if (!Array.isArray(data.tabela_resumo_anual) || data.tabela_resumo_anual.length === 0) {
        logger.warn('tabela_resumo_anual inválida ou vazia');
        return false;
      }

      if (!Array.isArray(data.tabela_fluxo_caixa) || data.tabela_fluxo_caixa.length === 0) {
        logger.warn('tabela_fluxo_caixa inválida ou vazia');
        return false;
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
   * @returns ResultadosCodigoB ou null se falhar
   */
  static safeFromPythonResponse(pythonData: any): ResultadosCodigoB | null {
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
   * @returns GrupoBFinancialResultDto ou null se falhar
   */
  static safeToResponseDto(data: ResultadosCodigoB, projectId: string): GrupoBFinancialResultDto | null {
    try {
      return this.toResponseDto(data, projectId);
    } catch (error) {
      logger.error('Falha na criação segura do DTO (safeToResponseDto)', error);
      return null;
    }
  }
}