import { IPvlibServiceClient, FinancialCalculationInput, FinancialCalculationResult } from '@/infrastructure/external-apis/PvlibServiceClient';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { AppError } from '@/shared/errors/AppError';
import { UserPermissionService } from '@/domain/services/UserPermissionService';
import { ProjectId } from '@/domain/value-objects/ProjectId';
import { UserId } from '@/domain/value-objects/UserId';
import { Project } from '@/domain/entities/Project';

export interface CalculateProjectFinancialsDTO {
  projectId: string;
  userId: string;
  input: FinancialCalculationInput;
  saveToProject?: boolean; // Se true, salva no projeto. Se false, apenas retorna o resultado
}

export interface CalculateProjectFinancialsResponse {
  success: boolean;
  data: FinancialCalculationResult;
  message: string;
}

export class CalculateProjectFinancialsUseCase {
  constructor(
    private pvlibClient: IPvlibServiceClient,
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: CalculateProjectFinancialsDTO): Promise<CalculateProjectFinancialsResponse> {
    const { projectId, userId, input, saveToProject = true } = dto;

    try {
      console.log(`[CalculateProjectFinancials] Starting calculation for project ${projectId}`);

      // 1. Buscar e validar projeto
      const projectIdVo = ProjectId.create(projectId);
      const project = await this.projectRepository.findById(projectIdVo.getValue());

      if (!project) {
        throw AppError.notFound('Projeto');
      }

      // 2. Verificar permissão (usuário deve ter acesso ao projeto)
      const userIdVo = UserId.create(userId);
      const user = await this.userRepository.findById(userIdVo.getValue());

      if (!user || !UserPermissionService.canAccessProject(user, project)) {
        throw AppError.forbidden('Usuário não tem permissão para acessar este projeto');
      }

      // 3. Validar dados de entrada
      this.validateInput(input);

      // 4. Chamar serviço Python para cálculo
      console.log(`[CalculateProjectFinancials] Calling Python service for project ${projectId}`, {
        investimento: input.investimento_inicial,
        geracao_anual: input.geracao_mensal.reduce((a, b) => a + b, 0),
        consumo_anual: input.consumo_mensal.reduce((a, b) => a + b, 0),
      });

      const results = await this.pvlibClient.calculateAdvancedFinancials(input);

      console.log(`[CalculateProjectFinancials] Calculation completed for project ${projectId}`, {
        vpl: results.vpl,
        tir: results.tir,
        payback: results.payback_simples,
      });

      // 5. Salvar resultados no projeto (se solicitado)
      if (saveToProject) {
        await this.saveResultsToProject(project, input, results, userId);
      }

      return {
        success: true,
        data: results,
        message: 'Análise financeira calculada com sucesso',
      };

    } catch (error: any) {
      console.error('[CalculateProjectFinancials] Error:', error);

      if (error instanceof AppError) {
        throw error;
      }

      // Se o erro veio do PvlibServiceClient, já tem mensagens adequadas
      if (error.name === 'PvlibServiceError' ||
          error.name === 'PvlibServiceUnavailableError' ||
          error.name === 'PvlibValidationError') {
        throw AppError.internal(error.message, error);
      }

      throw AppError.internal(
        'Erro ao calcular análise financeira. Por favor, tente novamente.',
        error
      );
    }
  }

  /**
   * Valida os dados de entrada antes de enviar ao serviço Python
   */
  private validateInput(input: FinancialCalculationInput): void {
    const errors: string[] = [];

    // Validar investimento
    if (!input.investimento_inicial || input.investimento_inicial <= 0) {
      errors.push('Investimento inicial deve ser maior que zero');
    }

    // Validar geração mensal
    if (!input.geracao_mensal || input.geracao_mensal.length !== 12) {
      errors.push('Geração mensal deve ter 12 valores');
    } else if (input.geracao_mensal.some(v => v < 0)) {
      errors.push('Valores de geração mensal não podem ser negativos');
    }

    // Validar consumo mensal
    if (!input.consumo_mensal || input.consumo_mensal.length !== 12) {
      errors.push('Consumo mensal deve ter 12 valores');
    } else if (input.consumo_mensal.some(v => v < 0)) {
      errors.push('Valores de consumo mensal não podem ser negativos');
    }

    // Validar tarifa
    if (!input.tarifa_energia || input.tarifa_energia <= 0) {
      errors.push('Tarifa de energia deve ser maior que zero');
    }

    // Validar vida útil
    if (!input.vida_util || input.vida_util <= 0 || input.vida_util > 50) {
      errors.push('Vida útil deve estar entre 1 e 50 anos');
    }

    // Validar taxa de desconto
    if (input.taxa_desconto == null || input.taxa_desconto < 0) {
      errors.push('Taxa de desconto deve ser maior ou igual a zero');
    }

    // Validar percentuais de créditos remotos (se habilitados)
    if (input.autoconsumo_remoto_b || input.autoconsumo_remoto_a_verde || input.autoconsumo_remoto_a_azul) {
      const percB = input.perc_creditos_b || 0;
      const percVerde = input.perc_creditos_a_verde || 0;
      const percAzul = input.perc_creditos_a_azul || 0;
      const total = percB + percVerde + percAzul;

      if (Math.abs(total - 1.0) > 0.01) {
        errors.push(`Percentuais de créditos devem somar 100% (atual: ${(total * 100).toFixed(1)}%)`);
      }
    }

    if (errors.length > 0) {
      throw AppError.badRequest(
        `Dados de entrada inválidos: ${errors.join('; ')}`
      );
    }
  }

  /**
   * Salva os resultados financeiros no projeto
   */
  private async saveResultsToProject(
    project: Project,
    input: FinancialCalculationInput,
    results: FinancialCalculationResult,
    userId: string
  ): Promise<void> {
    try {
      // Obter projectData atual
      const currentData = project.getProjectData();

      // Atualizar cálculos do projeto via projectData
      const updatedData = {
        ...currentData,
        calculations: {
          ...currentData.calculations,
          financial: {
            results: {
              vpl: results.vpl,
              tir: results.tir,
              payback_simples: results.payback_simples,
              payback_descontado: results.payback_descontado,
              economia_total_25_anos: results.economia_total_25_anos,
              economia_anual_media: results.economia_anual_media,
              lucratividade_index: results.lucratividade_index,
              cash_flow: results.cash_flow,
              indicadores: results.indicadores,
              sensibilidade: results.sensibilidade,
              cenarios: results.cenarios,
            },
            inputs: {
              investimento_inicial: input.investimento_inicial,
              vida_util: input.vida_util,
              taxa_desconto: input.taxa_desconto,
              inflacao_energia: input.inflacao_energia,
              tarifa_energia: input.tarifa_energia,
              custo_fio_b: input.custo_fio_b,
              fator_simultaneidade: input.fator_simultaneidade,
              // Não salvar arrays grandes para não inflar o documento
            },
            metadata: {
              calculatedAt: new Date(),
              calculatedBy: userId,
              version: '2.1.0', // Versão do serviço de cálculo
            },
          },
        },
      };

      // Atualizar projectData
      project.setProjectData(updatedData);
      await this.projectRepository.update(project);

      console.log(`[CalculateProjectFinancials] Results saved to project ${project.getId()}`);
    } catch (error: any) {
      console.error('[CalculateProjectFinancials] Error saving results:', error);
      // Não falhar a operação se não conseguir salvar
      // O usuário já tem os resultados, apenas não foram persistidos
    }
  }

  /**
   * Obtém os últimos resultados financeiros salvos no projeto
   */
  async getLastResults(projectId: string, userId: string): Promise<FinancialCalculationResult | null> {
    try {
      const projectIdVo = ProjectId.create(projectId);
      const project = await this.projectRepository.findById(projectIdVo.getValue());

      if (!project) {
        throw AppError.notFound('Projeto');
      }

      // Verificar permissão
      const userIdVo = UserId.create(userId);
      const user = await this.userRepository.findById(userIdVo.getValue());

      if (!user || !UserPermissionService.canAccessProject(user, project)) {
        throw AppError.forbidden('Usuário não tem permissão para acessar este projeto');
      }

      const projectData = project.getProjectData();
      return projectData.calculations?.financial?.results || null;
    } catch (error: any) {
      console.error('[CalculateProjectFinancials] Error getting last results:', error);
      throw error;
    }
  }
}