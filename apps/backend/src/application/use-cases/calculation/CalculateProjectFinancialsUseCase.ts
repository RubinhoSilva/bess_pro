import { SimplePvlibServiceClient } from '@/infrastructure/external-apis/SimplePvlibServiceClient';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Result } from '@/application/common/Result';
import { Project } from '@/domain/entities/Project';

import { AppError } from '../../../shared/errors/AppError';
import { ProjectId } from '@/domain/value-objects/ProjectId';
import { UserId } from '@/domain/value-objects/UserId';
import { UserPermissionService } from '@/domain/services/UserPermissionService';
import { CalculationConstants } from '@/domain/constants/CalculationConstants';
// Importar tipos do pacote shared
import {
  GrupoConfig,
  FinancialConfiguration,
  isGrupoBConfig,
  isGrupoAConfig,
  validateGrupoBConfig,
  validateGrupoAConfig,
  AdvancedFinancialResults,
  FinancialInput
} from '@bess-pro/shared';

export interface CalculateProjectFinancialsDTO {
  projectId: string;
  userId: string;
  input: FinancialConfiguration; // Aceitar ambos os formatos
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

      // 4. Adaptar input para formato compatível com Python service
      let adaptedInput: FinancialInput;
      if (isGrupoBConfig(input)) {
        // Converter GrupoBConfig para FinancialInput
        adaptedInput = {
          investimento_inicial: input.financeiros.capex,
          geracao_mensal: Object.values(input.geracao),
          consumo_mensal: Object.values(input.consumoLocal),
          tarifa_energia: input.tarifaBase,
          custo_fio_b: input.fioB.schedule[input.fioB.baseYear] || 0.45,
          vida_util: input.financeiros.anos,
          taxa_desconto: input.financeiros.taxaDesconto,
          inflacao_energia: input.financeiros.inflacaoEnergia,
          degradacao_modulos: input.financeiros.degradacao,
          custo_om: input.financeiros.capex * input.financeiros.omaFirstPct,
          inflacao_om: input.financeiros.omaInflacao
        };
      } else if (isGrupoAConfig(input)) {
        // Converter GrupoAConfig para FinancialInput
        adaptedInput = {
          investimento_inicial: input.financeiros.capex,
          geracao_mensal: Object.values(input.geracao),
          consumo_mensal: [
            ...Object.values(input.consumoLocal.foraPonta),
            ...Object.values(input.consumoLocal.ponta)
          ],
          tarifa_energia: input.tarifas.foraPonta,
          custo_fio_b: input.fioB.schedule[input.fioB.baseYear] || 0.45,
          vida_util: input.financeiros.anos,
          taxa_desconto: input.financeiros.taxaDesconto,
          inflacao_energia: input.financeiros.inflacaoEnergia,
          degradacao_modulos: input.financeiros.degradacao,
          custo_om: input.financeiros.capex * input.financeiros.omaFirstPct,
          inflacao_om: input.financeiros.omaInflacao
        };
      } else {
        // Já é FinancialInput
        adaptedInput = input as FinancialInput;
      }

      // 5. Realizar cálculo financeiro usando Python service
      console.log('[CalculateProjectFinancials] Calling Python service...');
      const results = await this.pvlibClient.calculateFinancials(adaptedInput);

      // 6. Salvar no projeto se solicitado
      if (saveToProject) {
        await this.saveResultsToProject(project, adaptedInput, results, userId);
      }

      // 7. Log de sucesso
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

  private validateInput(input: FinancialConfiguration): void {
    // Verificar tipo de configuração e validar conforme o formato
    if (isGrupoBConfig(input)) {
      const validation = validateGrupoBConfig(input);
      if (!validation.isValid) {
        throw AppError.badRequest('Erros de validação Grupo B: ' + validation.errors.join(', '));
      }
    } else if (isGrupoAConfig(input)) {
      const validation = validateGrupoAConfig(input);
      if (!validation.isValid) {
        throw AppError.badRequest('Erros de validação Grupo A: ' + validation.errors.join(', '));
      }
    } else {
      // Validação legada para FinancialInput
      if (input.investimento_inicial <= 0) {
        throw AppError.badRequest('Investimento inicial deve ser maior que zero');
      }

      if (!input.geracao_mensal || input.geracao_mensal.length !== 12) {
        throw AppError.badRequest('Dados de geração mensal incompletos');
      }

      if (!input.consumo_mensal || input.consumo_mensal.length !== 12) {
        throw AppError.badRequest('Dados de consumo mensal incompletos');
      }
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