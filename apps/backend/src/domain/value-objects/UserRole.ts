export enum UserRoleEnum {
  SUPER_ADMIN = 'super_admin',  // Admin global do sistema
  TEAM_OWNER = 'team_owner',    // Dono do team
  ADMIN = 'admin',              // Admin do team
  VENDEDOR = 'vendedor',        // Vendedor do team
  VIEWER = 'viewer'             // Apenas visualização
}

export class UserRole {
  private constructor(private readonly value: UserRoleEnum) {}

  static create(role: string): UserRole {
    if (!Object.values(UserRoleEnum).includes(role as UserRoleEnum)) {
      throw new Error('Role de usuário inválido');
    }
    return new UserRole(role as UserRoleEnum);
  }

  getValue(): UserRoleEnum {
    return this.value;
  }

  canCreateProject(): boolean {
    return [UserRoleEnum.SUPER_ADMIN, UserRoleEnum.TEAM_OWNER, UserRoleEnum.ADMIN, UserRoleEnum.VENDEDOR].includes(this.value);
  }

  canCreateProjectType(projectType: string): boolean {
    if ([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.TEAM_OWNER, UserRoleEnum.ADMIN].includes(this.value)) return true;
    if (this.value === UserRoleEnum.VENDEDOR && projectType === 'pv') return true;
    return false;
  }

  canManageTeam(): boolean {
    return [UserRoleEnum.SUPER_ADMIN, UserRoleEnum.TEAM_OWNER].includes(this.value);
  }

  canManageUsers(): boolean {
    return [UserRoleEnum.SUPER_ADMIN, UserRoleEnum.TEAM_OWNER, UserRoleEnum.ADMIN].includes(this.value);
  }

  isSuperAdmin(): boolean {
    return this.value === UserRoleEnum.SUPER_ADMIN;
  }

  equals(other: UserRole): boolean {
    return this.value === other.getValue();
  }
}