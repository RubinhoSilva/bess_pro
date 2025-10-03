import { SimplePvlibServiceClient } from '@/infrastructure/external-apis/SimplePvlibServiceClient';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Result } from '@/application/common/Result';
import { Project } from '@/domain/entities/Project';
import { FinancialValidator } from '@/application/validation/FinancialValidator';
import { AppError } from '@/shared/errors/AppError';
import { ProjectId } from '@/domain/value-objects/ProjectId';
import { UserId } from '@/domain/value-objects/UserId';
import { UserPermissionService } from '@/domain/services/UserPermissionService';
// Tipos temporários até shared package estar disponível
interface FinancialInput {
  investimento_inicial: number;
  geracao_mensal: number[];
  consumo_mensal: number[];
  tarifa_energia: number;
  custo_fio_b: number;
  vida_util: number;
  taxa_desconto: number;
  inflacao_energia: number;
}

interface AdvancedFinancialResults {
  vpl: number;
  tir: number;
  payback_simples: number;
  payback_descontado: number;
  economia_total_25_anos: number;
  economia_anual_media: number;
  roi?: number;
  npv?: number;
  irr?: number;
  cash_flow: Array<{
    ano: number;
    geracao_anual: number;
    economia_energia: number;
    fluxo_liquido: number;
    fluxo_acumulado: number;
    valor_presente: number;
  }>;
  sensitivity_analysis?: any;
  scenario_analysis?: any;
}

export interface CalculateProjectFinancialsDTO {
  projectId: string;
  userId: string;
  input: FinancialInput;
  saveToProject?: boolean;
}

export interface CalculateProjectFinancialsResponse {
  success: boolean;
  data: AdvancedFinancialResults;
  message: string;
}

export class CalculateProjectFinancialsUseCase {
  constructor(
    private pvlibClient: SimplePvlibServiceClient,
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

      // 2. Verificar permissão
      const userIdVo = UserId.create(userId);
      const user = await this.userRepository.findById(userIdVo.getValue());

      if (!user || !UserPermissionService.canAccessProject(user, project)) {
        throw AppError.forbidden('Usuário não tem permissão para acessar este projeto');
      }

      // 3. Validar dados de entrada
      this.validateInput(input);

      // 4. Realizar cálculo financeiro usando Python service
      console.log('[CalculateProjectFinancials] Calling Python service...');
      const results = await this.pvlibClient.calculateFinancials(input);

      // 5. Salvar no projeto se solicitado
      if (saveToProject) {
        await this.saveResultsToProject(project, input, results, userId);
      }

      console.log('[CalculateProjectFinancials] Calculation completed successfully');

      return {
        success: true,
        data: results,
        message: 'Cálculo financeiro realizado com sucesso'
      };

    } catch (error) {
      console.error('[CalculateProjectFinancials] Error:', error);
      return {
        success: false,
        data: {} as AdvancedFinancialResults,
        message: error instanceof Error ? error.message : 'Erro desconhecido no cálculo financeiro'
      };
    }
  }

  private validateInput(input: FinancialInput): void {
    // Validações básicas
    if (input.investimento_inicial <= 0) {
      throw AppError.badRequest('Investimento inicial deve ser maior que zero');
    }

    if (!input.geracao_mensal || input.geracao_mensal.length !== 12) {
      throw AppError.badRequest('Dados de geração mensal incompletos');
    }

    if (!input.consumo_mensal || input.consumo_mensal.length !== 12) {
      throw AppError.badRequest('Dados de consumo mensal incompletos');
    }

    // Validações avançadas
    const validation = FinancialValidator.validateFinancialInput(input);
    if (!validation.isValid) {
      throw AppError.badRequest('Dados de entrada inválidos: ' + validation.errors.join(', '));
    }
  }

  private async saveResultsToProject(
    project: Project,
    input: FinancialInput,
    results: AdvancedFinancialResults,
    userId: string
  ): Promise<void> {
    try {
      // Obter dados atuais do projeto
      const currentData = project.getProjectData() || {};

      // Preparar dados atualizados
      const financialData = {
        ...currentData.financialData,
        lastCalculation: {
          timestamp: new Date().toISOString(),
          input: {
            investimento_inicial: input.investimento_inicial,
            geracao_mensal: input.geracao_mensal,
            consumo_mensal: input.consumo_mensal,
            tarifa_energia: input.tarifa_energia,
            custo_fio_b: input.custo_fio_b,
            vida_util: input.vida_util,
            taxa_desconto: input.taxa_desconto,
            inflacao_energia: input.inflacao_energia
          },
          results: {
            vpl: results.vpl,
            tir: results.tir,
            payback_simples: results.payback_simples,
            payback_descontado: results.payback_descontado,
            economia_total_25_anos: results.economia_total_25_anos,
            economia_anual_media: results.economia_anual_media,
            roi: results.roi,
            npv: results.npv,
            irr: results.irr,
            cash_flow: results.cash_flow,
            sensitivity_analysis: results.sensitivity_analysis,
            scenario_analysis: results.scenario_analysis
          }
        }
      };

      // Atualizar projeto
      project.updateProjectData({ financialData });
      await this.projectRepository.save(project);

      console.log(`[CalculateProjectFinancials] Results saved to project ${project.getId()}`);

    } catch (error) {
      console.error('[CalculateProjectFinancials] Error saving results:', error);
      throw AppError.internal('Erro ao salvar resultados no projeto');
    }
  }

  async getLastResults(projectId: string, userId: string): Promise<AdvancedFinancialResults | null> {
    try {
      const projectIdVo = ProjectId.create(projectId);
      const project = await this.projectRepository.findById(projectIdVo.getValue());

      if (!project) {
        throw AppError.notFound('Projeto');
      }

      const userIdVo = UserId.create(userId);
      const user = await this.userRepository.findById(userIdVo.getValue());

      if (!user || !UserPermissionService.canAccessProject(user, project)) {
        throw AppError.forbidden('Usuário não tem permissão para acessar este projeto');
      }

      const projectData = project.getProjectData();
      return projectData?.financialData?.lastCalculation?.results || null;

    } catch (error) {
      console.error('[CalculateProjectFinancials] Error getting last results:', error);
      return null;
    }
  }
}