import { Lead } from "../entities/Lead";
import { Project } from "../entities/Project";
import { User } from "../entities/User";
import { UserId } from "../value-objects/UserId";

export class UserPermissionService {
  /**
   * Verifica se um usuário pode acessar um projeto
   */
  static canAccessProject(user: User, project: Project): boolean {
    // Proprietário sempre pode acessar
    if (project.isOwnedBy(UserId.create(user.getId()))) {
      return true;
    }

    // Admins podem acessar qualquer projeto
    if (user.getRole().getValue() === 'admin') {
      return true;
    }

    return false;
  }

  /**
   * Verifica se um usuário pode editar um projeto
   */
  static canEditProject(user: User, project: Project): boolean {
    // Apenas o proprietário ou admin pode editar
    return project.isOwnedBy(UserId.create(user.getId())) || user.getRole().getValue() === 'admin';
  }

  /**
   * Verifica se um usuário pode deletar um projeto
   */
  static canDeleteProject(user: User, project: Project): boolean {
    // Apenas o proprietário pode deletar
    return project.isOwnedBy(UserId.create(user.getId()));
  }

  /**
   * Verifica se um usuário pode acessar um lead
   */
  static canAccessLead(user: User, lead: Lead): boolean {
    return lead.isOwnedBy(UserId.create(user.getId())) || user.getRole().getValue() === 'admin';
  }

  /**
   * Verifica se um usuário pode criar outros usuários
   */
  static canCreateUser(user: User): boolean {
    return user.getRole().getValue() === 'admin';
  }

  /**
   * Verifica permissões para funcionalidades específicas
   */
  static hasFeatureAccess(user: User, feature: string): boolean {
    const role = user.getRole().getValue();

    switch (feature) {
      case 'advanced_analysis':
        return role === 'admin' || role === 'vendedor';
      case 'export_reports':
        return role === 'admin' || role === 'vendedor';
      case 'user_management':
        return role === 'admin';
      case 'system_settings':
        return role === 'admin';
      case 'view_all_projects':
        return role === 'admin';
      default:
        return true; // Funcionalidades básicas para todos
    }
  }
}