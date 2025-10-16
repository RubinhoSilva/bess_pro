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
  FinancialInput,
  GrupoBConfig,
  GrupoAConfig
} from '@bess-pro/shared';

// Importar novos DTOs e mappers
import { GrupoFinancialResultDto } from '@/application/dtos/output/GrupoFinancialResultDto';
import { GrupoBFinancialResultDto } from '@/application/dtos/output/GrupoBFinancialResultDto';
import { GrupoAFinancialResultDto } from '@/application/dtos/output/GrupoAFinancialResultDto';
import { GrupoBFinancialMapper } from '@/application/mappers/GrupoBFinancialMapper';
import { GrupoAFinancialMapper } from '@/application/mappers/GrupoAFinancialMapper';

export interface CalculateProjectFinancialsDTO {
  projectId: string;
  userId: string;
  input: FinancialConfiguration; // Aceitar ambos os formatos
  saveToProject?: boolean;
}

export interface CalculateProjectFinancialsResponse {
  success: boolean;
  data: GrupoFinancialResultDto;
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

      // 4. Realizar cálculo especializado conforme o tipo de configuração
      let result: GrupoFinancialResultDto;
      if (isGrupoBConfig(input)) {
        result = await this.calculateGrupoB(input as GrupoBConfig, project, userId, saveToProject);
      } else if (isGrupoAConfig(input)) {
        result = await this.calculateGrupoA(input as GrupoAConfig, project, userId, saveToProject);
      } else {
        // Manter compatibilidade com formato legado
        result = await this.calculateLegacy(input as FinancialInput, project, userId, saveToProject);
      }

      // 5. Log de sucesso
      console.log('[CalculateProjectFinancials] Calculation completed successfully');

      return {
        success: true,
        data: result,
        message: 'Cálculo financeiro realizado com sucesso'
      };

    } catch (error) {
      console.error('[CalculateProjectFinancials] Error:', error);
      return {
        success: false,
        data: {} as GrupoFinancialResultDto,
        message: error instanceof Error ? error.message : 'Erro desconhecido no cálculo financeiro'
      };
    }
  }

  private async calculateGrupoB(
    input: GrupoBConfig,
    project: Project,
    userId: string,
    saveToProject: boolean
  ): Promise<GrupoBFinancialResultDto> {
    console.log('[CalculateProjectFinancials] Calculating Grupo B financials...');
    
    // 1. Chamar serviço especializado
    const pythonResults = await this.pvlibClient.calculateGrupoBFinancials(input);
    
    // 2. Mapear para DTO TypeScript
    const result = GrupoBFinancialMapper.toDto(pythonResults);
    
    // 3. Salvar no projeto se solicitado
    if (saveToProject) {
      await this.saveGrupoBResultsToProject(project, input, result, userId);
    }
    
    return result;
  }

  private async calculateGrupoA(
    input: GrupoAConfig,
    project: Project,
    userId: string,
    saveToProject: boolean
  ): Promise<GrupoAFinancialResultDto> {
    console.log('[CalculateProjectFinancials] Calculating Grupo A financials...');
    
    // 1. Chamar serviço especializado
    const pythonResults = await this.pvlibClient.calculateGrupoAFinancials(input);
    
    // 2. Mapear para DTO TypeScript
    const result = GrupoAFinancialMapper.toDto(pythonResults);
    
    // 3. Salvar no projeto se solicitado
    if (saveToProject) {
      await this.saveGrupoAResultsToProject(project, input, result, userId);
    }
    
    return result;
  }

  private async calculateLegacy(
    input: FinancialInput,
    project: Project,
    userId: string,
    saveToProject: boolean
  ): Promise<GrupoBFinancialResultDto> {
    console.log('[CalculateProjectFinancials] Using legacy calculation method...');
    
    // Manter compatibilidade com formato existente
    const results = await this.pvlibClient.calculateFinancials(input);
    
    // Converter para formato compatível (temporário)
    // Usar GrupoBFinancialResultDto como fallback para compatibilidade
    const legacyResult: GrupoBFinancialResultDto = {
      success: true,
      grupoTarifario: 'B', // Default para compatibilidade
      data: results as any,
      timestamp: new Date().toISOString(),
      projectId: project.getId()
    };
    
    if (saveToProject) {
      await this.saveResultsToProject(project, input, results, userId);
    }
    
    return legacyResult;
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

  private async saveGrupoBResultsToProject(
    project: Project,
    input: GrupoBConfig,
    result: GrupoBFinancialResultDto,
    userId: string
  ): Promise<void> {
    try {
      const currentData = project.getProjectData() || {};

      const financialData = {
        ...currentData.financialData,
        lastCalculation: {
          timestamp: new Date().toISOString(),
          tipo: 'Grupo B',
          input: input,
          results: result
        }
      };

      project.updateProjectData({ financialData });
      await this.projectRepository.save(project);

      console.log(`[CalculateProjectFinancials] Grupo B results saved to project ${project.getId()}`);

    } catch (error) {
      console.error('[CalculateProjectFinancials] Error saving Grupo B results:', error);
      throw AppError.internal('Erro ao salvar resultados Grupo B no projeto');
    }
  }

  private async saveGrupoAResultsToProject(
    project: Project,
    input: GrupoAConfig,
    result: GrupoAFinancialResultDto,
    userId: string
  ): Promise<void> {
    try {
      const currentData = project.getProjectData() || {};

      const financialData = {
        ...currentData.financialData,
        lastCalculation: {
          timestamp: new Date().toISOString(),
          tipo: 'Grupo A',
          input: input,
          results: result
        }
      };

      project.updateProjectData({ financialData });
      await this.projectRepository.save(project);

      console.log(`[CalculateProjectFinancials] Grupo A results saved to project ${project.getId()}`);

    } catch (error) {
      console.error('[CalculateProjectFinancials] Error saving Grupo A results:', error);
      throw AppError.internal('Erro ao salvar resultados Grupo A no projeto');
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
          tipo: 'Legacy',
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

      console.log(`[CalculateProjectFinancials] Legacy results saved to project ${project.getId()}`);

    } catch (error) {
      console.error('[CalculateProjectFinancials] Error saving legacy results:', error);
      throw AppError.internal('Erro ao salvar resultados legados no projeto');
    }
  }

  async getLastResults(projectId: string, userId: string): Promise<GrupoFinancialResultDto | null> {
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