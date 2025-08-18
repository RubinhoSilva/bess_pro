import { ProjectType } from "../entities/Project";
import { User } from "../entities/User";

export class ProjectDomainService {
  static canCreateProject(user: User, projectType: ProjectType): boolean {
    // Regras de negócio complexas que não pertencem a uma entidade específica
    return user.getRole().canCreateProjectType(projectType);
  }
}