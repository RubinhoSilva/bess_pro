import axios from 'axios';
import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { AnalyzeFinancialCommand } from "@/application/dtos/input/financial/AnalyzeFinancialCommand";
import { FinancialAnalysisResponseDto } from "@/application/dtos/output/FinancialAnalysisResponseDto";
import { IProjectRepository, IUserRepository } from "@/domain/repositories";
import { UserPermissionService } from "@/domain/services";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export class AnalyzeFinancialUseCase implements IUseCase<AnalyzeFinancialCommand, Result<FinancialAnalysisResponseDto>> {
  constructor(
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: AnalyzeFinancialCommand): Promise<Result<FinancialAnalysisResponseDto>> {
    try {
      // Buscar projeto
      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId.getValue());

      if (!project) {
        return Result.failure('Projeto não encontrado');
      }

      // Verificar permissões
      const userId = UserId.create(command.userId);
      const user = await this.userRepository.findById(userId.getValue());
      
      if (!user || !UserPermissionService.canAccessProject(user, project)) {
        return Result.failure('Sem permissão para acessar este projeto');
      }

      // Verificar se usuário tem acesso à análise financeira
      if (!UserPermissionService.hasFeatureAccess(user, 'advanced_analysis')) {
        return Result.failure('Usuário não tem acesso à análise financeira avançada');
      }

      // Realizar análise financeira via API Python
      try {
        const pythonApiInput = {
          investimento_inicial: command.financialParams.investimentoInicial,
          geracao_mensal: Array(12).fill(command.financialParams.economiaMensal),
          consumo_mensal: Array(12).fill(0),
          tarifa_energia: command.financialParams.tarifaEnergia,
          custo_fio_b: command.financialParams.tarifaEnergia * 0.3,
          vida_util: command.financialParams.periodoAnalise,
          taxa_desconto: command.financialParams.taxaDesconto,
          inflacao_energia: command.financialParams.aumentoTarifa,
          degradacao_modulos: 0.5,
          custo_om: command.financialParams.investimentoInicial * (command.financialParams.custoManutencao / 100),
          inflacao_om: 4.0,
          modalidade_tarifaria: 'convencional'
        };

        const response = await axios.post(
          `${process.env.PVLIB_SERVICE_URL || 'http://localhost:8110'}/financial/calculate-advanced`,
          pythonApiInput,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        
        const analysis = response.data;

        return Result.success({
          vpl: analysis.vpl,
          tir: analysis.tir,
          payback: analysis.payback_simples || analysis.payback || 0,
          economiaTotal: analysis.economia_total_25_anos || 0,
          fluxoCaixa: analysis.cash_flow || [],
          isViable: analysis.vpl > 0 && (analysis.payback_simples || analysis.payback || 0) <= command.financialParams.periodoAnalise,
        });
      } catch (error) {
        return Result.failure('Erro ao calcular análise financeira');
      }
    } catch (error: any) {
      return Result.failure(`Erro na análise financeira: ${error.message}`);
    }
  }
}