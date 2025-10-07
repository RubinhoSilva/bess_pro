import axios from 'axios';
import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { IProjectRepository, IUserRepository } from "@/domain/repositories";
import { ReportGenerationService, ReportData } from "@/domain/services/ReportGenerationService";
import { UserPermissionService } from "@/domain/services";
import { ProjectId } from "@/domain/value-objects/ProjectId";
import { UserId } from "@/domain/value-objects/UserId";

export interface GenerateFinancialReportCommand {
  projectId: string;
  userId: string;
  reportParams: {
    totalInvestment: number;
    geracaoEstimadaMensal: number[];
    consumoMensal: number[];
    tarifaEnergiaB: number;
    custoFioB: number;
    vidaUtil?: number;
    inflacaoEnergia?: number;
    taxaDesconto?: number;
    technicalSpecs: {
      totalPower: number;
      moduleCount: number;
      moduleModel: string;
      inverterModel: string;
      estimatedGeneration: number;
      co2Savings: number;
    };
  };
}

export interface FinancialReportResponseDto {
  projectInfo: {
    name: string;
    location: string;
    clientName: string;
    date: Date;
  };
  executiveSummary: {
    totalInvestment: number;
    annualSavings: number;
    paybackPeriod: number;
    roi: number;
    co2ReductionEquivalent: string;
  };
  technicalSpecs: {
    totalPower: number;
    moduleCount: number;
    moduleModel: string;
    inverterModel: string;
    estimatedGeneration: number;
    co2Savings: number;
  };
  financialAnalysis: {
    economiaAnualEstimada: number;
    vpl: number;
    tir: number;
    payback: number;
    fluxoCaixa: Array<{
      ano: number;
      fluxoLiquido: number;
      economia: number;
      custoSemFV: number;
      custoComFV: number;
    }>;
  };
  performanceIndicators: {
    specificGeneration: number;
    performanceRatio: number;
    capacityFactor: number;
    economicEfficiency: number;
  };
  environmentalImpact: {
    annualCO2Reduction: number;
    lifetimeCO2Reduction: number;
    treesEquivalent: number;
    coalEquivalent: number;
    carKmEquivalent: number;
  };
  investmentRisk: {
    paybackRisk: string;
    tirRisk: string;
    vplRisk: string;
    overallRisk: string;
  };
  recommendations: {
    moduleOrientation: string;
    maintenanceSchedule: string;
    performanceMonitoring: string;
    safetyConsiderations: string[];
  };
  yearlySavings: Array<{
    year: number;
    savings: number;
    cumulativeSavings: number;
    costWithoutPV: number;
    costWithPV: number;
  }>;
}

export class GenerateFinancialReportUseCase implements IUseCase<GenerateFinancialReportCommand, Result<FinancialReportResponseDto>> {
  constructor(
    private projectRepository: IProjectRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: GenerateFinancialReportCommand): Promise<Result<FinancialReportResponseDto>> {
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

      // Preparar dados financeiros
      const financialData = {
        totalInvestment: command.reportParams.totalInvestment,
        geracaoEstimadaMensal: command.reportParams.geracaoEstimadaMensal,
        consumoMensal: command.reportParams.consumoMensal,
        tarifaEnergiaB: command.reportParams.tarifaEnergiaB,
        custoFioB: command.reportParams.custoFioB,
        vidaUtil: command.reportParams.vidaUtil || 25,
        inflacaoEnergia: command.reportParams.inflacaoEnergia || 8,
        taxaDesconto: command.reportParams.taxaDesconto || 10,
      };

      // Realizar análise financeira via API Python
      let financialAnalysis;
      try {
        const pythonApiInput = {
          investimento_inicial: financialData.totalInvestment,
          geracao_mensal: financialData.geracaoEstimadaMensal,
          consumo_mensal: financialData.consumoMensal,
          tarifa_energia: financialData.tarifaEnergiaB,
          custo_fio_b: financialData.custoFioB,
          vida_util: financialData.vidaUtil,
          taxa_desconto: financialData.taxaDesconto,
          inflacao_energia: financialData.inflacaoEnergia,
          degradacao_modulos: 0.5,
          custo_om: financialData.totalInvestment * 0.01,
          inflacao_om: 4.0,
          modalidade_tarifaria: 'convencional'
        };

        // 💾 SALVAR PAYLOAD EM ARQUIVO JSON para debug
        try {
          const fs = require('fs');
          const path = require('path');

          // Criar pasta para payloads se não existir
          const payloadsDir = path.join(process.cwd(), 'payloads');
          if (!fs.existsSync(payloadsDir)) {
            fs.mkdirSync(payloadsDir, { recursive: true });
          }

          // Nome do arquivo com timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `payload-financial-report-${timestamp}.json`;
          const filepath = path.join(payloadsDir, filename);

          // Salvar payload
          fs.writeFileSync(filepath, JSON.stringify(pythonApiInput, null, 2), 'utf8');
          console.log(`💾 [GenerateFinancialReportUseCase] Payload salvo em: ${filepath}`);
        } catch (error) {
          console.error('❌ [GenerateFinancialReportUseCase] Erro ao salvar payload:', error);
        }

        const response = await axios.post(
          `${process.env.PVLIB_SERVICE_URL || 'http://localhost:8110'}/financial/calculate-advanced`,
          pythonApiInput,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        
        financialAnalysis = response.data;
      } catch (error) {
        return Result.failure('Erro ao calcular análise financeira para o relatório');
      }

      // Preparar dados do relatório
      const reportData: ReportData = {
        projectInfo: {
          name: project.getProjectName().getValue(),
          location: project.getLocation()?.toString() || 'Não informado',
          clientName: project.getProjectData().clientName || 'Cliente',
          date: new Date()
        },
        technicalSpecs: command.reportParams.technicalSpecs,
        financialAnalysis,
        tariffParams: {
          energyTariff: command.reportParams.tarifaEnergiaB,
          fioBCost: command.reportParams.custoFioB,
          inflationRate: financialData.inflacaoEnergia,
          discountRate: financialData.taxaDesconto
        }
      };

      // Gerar componentes do relatório
      const executiveSummary = ReportGenerationService.generateExecutiveSummary(reportData);
      const performanceIndicators = ReportGenerationService.calculatePerformanceIndicators(reportData);
      const environmentalImpact = ReportGenerationService.calculateEnvironmentalImpact(reportData);
      const investmentRisk = ReportGenerationService.calculateInvestmentRisk(financialAnalysis);
      const recommendations = ReportGenerationService.generateTechnicalRecommendations(reportData);
      const yearlySavings = ReportGenerationService.generateYearlySavingsSummary(financialAnalysis);

      const response: FinancialReportResponseDto = {
        projectInfo: reportData.projectInfo,
        executiveSummary,
        technicalSpecs: reportData.technicalSpecs,
        financialAnalysis,
        performanceIndicators,
        environmentalImpact,
        investmentRisk,
        recommendations,
        yearlySavings
      };

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro ao gerar relatório: ${error.message}`);
    }
  }
}