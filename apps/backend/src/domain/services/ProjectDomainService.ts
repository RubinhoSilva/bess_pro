import { Lead } from "../entities/Lead";
import { ProjectType, Project } from "../entities/Project";
import { User } from "../entities/User";

export class ProjectDomainService {
  /**
   * Verifica se um usuário pode criar um projeto específico
   */
  static canUserCreateProject(user: User, projectType: ProjectType): boolean {
    if (!user.canCreateProject()) {
      return false;
    }

    // Todos os tipos de projeto são permitidos para usuários que podem criar projetos
    // Futuras restrições específicas podem ser adicionadas aqui se necessário

    return true;
  }

  /**
   * Valida se um projeto pode ser linkado a um lead
   */
  static canLinkProjectToLead(project: Project, lead: Lead): boolean {
    // Deve ser do mesmo usuário
    if (!project.isOwnedBy(lead.getUserId())) {
      return false;
    }

    // Projeto não pode já estar linkado a outro lead
    if (project.getLeadId() && project.getLeadId() !== lead.getId()) {
      return false;
    }

    return true;
  }

  /**
   * Calcula a prioridade de um projeto baseado em critérios de negócio
   */
  static calculateProjectPriority(project: Project): number {
    let priority = 0;

    // Projetos com lead têm mais prioridade
    if (project.getLeadId()) {
      priority += 10;
    }

    // Projetos com localização definida
    if (project.hasLocation()) {
      priority += 5;
    }

    // Projetos BESS e híbridos têm prioridade maior
    if (project.getProjectType() === ProjectType.BESS || project.getProjectType() === ProjectType.HYBRID) {
      priority += 15;
    }

    // Projetos modificados recentemente
    const daysSinceUpdate = (Date.now() - project.getSavedAt().getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) {
      priority += 5;
    }

    return priority;
  }

  /**
   * Valida se os dados do projeto estão completos para geração de proposta
   */
  static isProjectReadyForProposal(project: Project): { ready: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    const projectData = project.getProjectData();

    // Campos obrigatórios
    if (!project.hasLocation()) {
      missingFields.push('Localização do projeto');
    }

    if (!projectData.consumoMensal) {
      missingFields.push('Consumo mensal de energia');
    }

    if (!projectData.tipoInstalacao) {
      missingFields.push('Tipo de instalação');
    }

    if (!projectData.potenciaNominal) {
      missingFields.push('Potência nominal do sistema');
    }

    return {
      ready: missingFields.length === 0,
      missingFields
    };
  }
}