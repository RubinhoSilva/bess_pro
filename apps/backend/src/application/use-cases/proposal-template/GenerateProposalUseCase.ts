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
    if (projectData?.financialResults?.totalInvestment) {
      return projectData.financialResults.totalInvestment;
    }
    return context.values.total_investment || 0;
  }

  private calculateAnnualSavings(context: any): number {
    const projectData = context.project.data;
    if (projectData?.financialResults?.annualSavings) {
      return projectData.financialResults.annualSavings;
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
    if (projectData?.systemParameters?.totalPower) {
      return projectData.systemParameters.totalPower;
    }
    return context.values.system_size || 0;
  }

  private calculateGenerationEstimate(context: any): number {
    const projectData = context.project.data;
    if (projectData?.results?.annualGeneration) {
      return projectData.results.annualGeneration;
    }
    return context.values.generation_estimate || 0;
  }
}