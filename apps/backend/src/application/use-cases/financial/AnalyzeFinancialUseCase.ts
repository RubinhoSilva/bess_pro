import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { AnalyzeFinancialCommand } from "@/application/dtos/input/financial/AnalyzeFinancialCommand";
import { FinancialAnalysisResponseDto } from "@/application/dtos/output/FinancialAnalysisResponseDto";
import { IProjectRepository, IUserRepository } from "@/domain/repositories";
import { UserPermissionService, FinancialAnalysisService } from "@/domain/services";
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

      // Realizar análise financeira
      const analysis = FinancialAnalysisService.analyzeProject(command.financialParams);

      return Result.success({
        vpl: analysis.vpl,
        tir: analysis.tir,
        payback: analysis.payback,
        economiaTotal: analysis.economiaTotal,
        fluxoCaixa: analysis.fluxoCaixa,
        isViable: analysis.vpl > 0 && analysis.payback <= command.financialParams.periodoAnalise,
      });
    } catch (error: any) {
      return Result.failure(`Erro na análise financeira: ${error.message}`);
    }
  }
}