import { IProposalTemplateRepository } from '../../../domain/repositories/IProposalTemplateRepository';
import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { ProposalData } from '../../../domain/entities/ProposalTemplate';
import { ProjectId } from '../../../domain/value-objects/ProjectId';

export interface GenerateProposalCommand {
  templateId: string;
  projectId: string;
  variableValues: Record<string, any>;
  customSections?: any[];
}

export class GenerateProposalUseCase {
  constructor(
    private proposalTemplateRepository: IProposalTemplateRepository,
    private projectRepository: IProjectRepository,
    private clientRepository: IClientRepository
  ) {}

  async execute(command: GenerateProposalCommand): Promise<ProposalData> {
    // Validate template exists
    const template = await this.proposalTemplateRepository.findById(command.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Validate project exists
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Validate client exists - use leadId if available
    let client = null;
    if (project.getLeadId()) {
      // Try to find client by lead conversion or create a default client
      const clients = await this.clientRepository.getAll();
      client = clients.find((c: any) => c.getId().getValue() === project.getLeadId()) || null;
    }
    if (!client) {
      // Create a default client object for the proposal
      client = {
        getId: () => ({ getValue: () => 'default' }),
        getName: () => 'Cliente',
        getEmail: () => '',
        getPhone: () => '',
        getAddress: () => project.getAddress()
      };
    }

    // Validate required variables
    this.validateRequiredVariables(template.variables, command.variableValues);

    // Process calculated variables
    const processedValues = await this.processCalculatedVariables(
      template.variables,
      command.variableValues,
      project,
      client
    );

    // Save proposal data
    const clientId = (client as any).getId ? (client as any).getId().getValue() : (client as any).getId;
    const proposalData = await this.proposalTemplateRepository.saveProposalData({
      templateId: command.templateId,
      projectId: command.projectId,
      clientId: clientId || 'default',
      variableValues: processedValues,
      customSections: command.customSections
    });

    return proposalData;
  }

  private validateRequiredVariables(variables: any[], values: Record<string, any>): void {
    const requiredVariables = variables.filter(v => v.isRequired);
    
    for (const variable of requiredVariables) {
      if (values[variable.name] === undefined || values[variable.name] === null || values[variable.name] === '') {
        throw new Error(`Required variable '${variable.displayName}' is missing`);
      }

      // Validate specific types
      if (variable.validations) {
        for (const validation of variable.validations) {
          switch (validation.type) {
            case 'min':
              if (typeof values[variable.name] === 'number' && values[variable.name] < validation.value) {
                throw new Error(validation.message);
              }
              break;
            case 'max':
              if (typeof values[variable.name] === 'number' && values[variable.name] > validation.value) {
                throw new Error(validation.message);
              }
              break;
            case 'pattern':
              if (typeof values[variable.name] === 'string' && !new RegExp(validation.value).test(values[variable.name])) {
                throw new Error(validation.message);
              }
              break;
          }
        }
      }
    }
  }

  private async processCalculatedVariables(
    variables: any[],
    values: Record<string, any>,
    project: any,
    client: any
  ): Promise<Record<string, any>> {
    const processedValues = { ...values };

    // Add project and client data to context
    const context = {
      project,
      client,
      values: processedValues
    };

    const calculatedVariables = variables.filter(v => v.type === 'calculated');
    
    for (const variable of calculatedVariables) {
      try {
        processedValues[variable.name] = await this.executeCalculation(variable, context);
      } catch (error) {
        console.error(`Error calculating variable ${variable.name}:`, error);
        processedValues[variable.name] = variable.defaultValue || null;
      }
    }

    return processedValues;
  }

  private async executeCalculation(variable: any, context: any): Promise<any> {
    // This is a simplified calculation engine
    // In a real implementation, you might want to use a more sophisticated system
    // like a formula parser or scripting engine

    switch (variable.name) {
      case 'total_investment':
        return this.calculateTotalInvestment(context);
      case 'annual_savings':
        return this.calculateAnnualSavings(context);
      case 'payback_period':
        return this.calculatePaybackPeriod(context);
      case 'system_size':
        return this.getSystemSize(context);
      case 'generation_estimate':
        return this.calculateGenerationEstimate(context);
      default:
        return variable.defaultValue;
    }
  }

  private calculateTotalInvestment(context: any): number {
    const projectData = context.project.data;
    
    // Tentar múltiplas estruturas onde o investimento pode estar
    if (projectData?.budgetData?.totalInvestment) {
      return projectData.budgetData.totalInvestment;
    }
    
    if (projectData?.resultsData?.calculationResults?.valorInvestimento) {
      return projectData.resultsData.calculationResults.valorInvestimento;
    }
    
    if (projectData?.financialResults?.totalInvestment) {
      return projectData.financialResults.totalInvestment;
    }
    
    if (projectData?.resultsData?.calculationResults?.advancedFinancial?.economiaTotal25Anos) {
      // Calcular investimento baseado na economia e no payback
      const economiaAnual = projectData.resultsData.calculationResults.advancedFinancial.economiaTotal25Anos / 25;
      const payback = projectData.resultsData.calculationResults.advancedFinancial.paybackSimples || 5;
      return economiaAnual * payback;
    }
    
    return context.values.total_investment || 0;
  }

  private calculateAnnualSavings(context: any): number {
    const projectData = context.project.data;
    
    // Tentar múltiplas estruturas onde a economia pode estar
    if (projectData?.financialResults?.annualSavings) {
      return projectData.financialResults.annualSavings;
    }
    
    if (projectData?.resultsData?.calculationResults?.economiaAnualEstimada) {
      return projectData.resultsData.calculationResults.economiaAnualEstimada;
    }
    
    if (projectData?.resultsData?.calculationResults?.advancedFinancial?.economiaTotal25Anos) {
      return projectData.resultsData.calculationResults.advancedFinancial.economiaTotal25Anos / 25;
    }
    
    return context.values.annual_savings || 0;
  }

  private calculatePaybackPeriod(context: any): number {
    const totalInvestment = this.calculateTotalInvestment(context);
    const annualSavings = this.calculateAnnualSavings(context);
    
    if (annualSavings > 0) {
      return totalInvestment / annualSavings;
    }
    
    return 0;
  }

  private getSystemSize(context: any): number {
    const projectData = context.project.data;
    
    // Tentar múltiplas estruturas onde a potência pode estar
    if (projectData?.systemParameters?.totalPower) {
      return projectData.systemParameters.totalPower;
    }
    
    if (projectData?.systemData?.potenciaPico) {
      return projectData.systemData.potenciaPico;
    }
    
    if (projectData?.resultsData?.calculationResults?.potenciaPico) {
      return projectData.resultsData.calculationResults.potenciaPico;
    }
    
    if (projectData?.resultsData?.calculationResults?.potenciaSistema) {
      return projectData.resultsData.calculationResults.potenciaSistema;
    }
    
    return context.values.system_size || 0;
  }

  private calculateGenerationEstimate(context: any): number {
    const projectData = context.project.data;
    
    // Tentar múltiplas estruturas onde a geração pode estar
    if (projectData?.results?.annualGeneration) {
      return projectData.results.annualGeneration;
    }
    
    if (projectData?.resultsData?.calculationResults?.geracaoAnual) {
      return projectData.resultsData.calculationResults.geracaoAnual;
    }
    
    if (projectData?.resultsData?.calculationResults?.geracaoEstimadaAnual) {
      return projectData.resultsData.calculationResults.geracaoEstimadaAnual;
    }
    
    if (projectData?.systemData?.geracaoAnualCalculada) {
      return projectData.systemData.geracaoAnualCalculada;
    }
    
    return context.values.generation_estimate || 0;
  }
}