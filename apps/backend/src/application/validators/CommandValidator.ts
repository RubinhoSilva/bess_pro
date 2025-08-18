import { Email } from "@/domain/value-objects/Email";
import { CreateLeadCommand } from "../dtos/input/lead/CreateLeadCommand";
import { CreateProjectCommand } from "../dtos/input/project/CreateProjectCommand";

export class CommandValidator {
  static validateCreateProject(command: CreateProjectCommand): string[] {
    const errors: string[] = [];

    if (!command.projectName || command.projectName.trim().length < 3) {
      errors.push('Nome do projeto deve ter pelo menos 3 caracteres');
    }

    if (!command.userId) {
      errors.push('ID do usuário é obrigatório');
    }

    if (!['pv', 'bess', 'hybrid'].includes(command.projectType)) {
      errors.push('Tipo de projeto deve ser "pv", "bess" ou "hybrid"');
    }

    return errors;
  }

  static validateCreateLead(command: CreateLeadCommand): string[] {
    const errors: string[] = [];

    if (!command.name || command.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!command.email || !Email.isValid(command.email)) {
      errors.push('Email é obrigatório e deve ser válido');
    }

    if (!command.userId) {
      errors.push('ID do usuário é obrigatório');
    }

    return errors;
  }
}