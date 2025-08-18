import { Email } from "../value-objects/Email";
import { Name } from "../value-objects/Name";
import { UserId } from "../value-objects/UserId";
import { UserRole } from "../value-objects/UserRole";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface UserProps extends SoftDeleteProps {
  id?: string;
  email: string;
  name: string;
  company?: string;
  role: string;
  logoUrl?: string;
  teamId?: string;
  lastTeamId?: string;
  status?: 'active' | 'pending' | 'inactive' | 'removed';
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends BaseEntity {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private name: Name,
    private company: string,
    private role: UserRole,
    private teamId: string | null,
    private lastTeamId: string | null,
    private status: 'active' | 'pending' | 'inactive' | 'removed',
    private logoUrl?: string,
    private lastLoginAt: Date | null = null,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: UserProps): User {
    const id = props.id ? UserId.create(props.id) : UserId.generate();
    const email = Email.create(props.email);
    const name = Name.create(props.name);
    const role = UserRole.create(props.role);

    return new User(
      id,
      email,
      name,
      props.company || '',
      role,
      props.teamId || null,
      props.lastTeamId || null,
      props.status || 'pending',
      props.logoUrl,
      null,
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt
      }
    );
  }

  changeName(newName: string): void {
    this.name = Name.create(newName);
  }

  changeCompany(newCompany: string): void {
    this.company = newCompany;
  }

  changeRole(newRole: string): void {
    this.role = UserRole.create(newRole);
  }

  changeLogo(newLogoUrl: string): void {
    this.logoUrl = newLogoUrl;
  }

  changeTeam(newTeamId: string | null): void {
    this.teamId = newTeamId;
  }

  changeStatus(newStatus: 'active' | 'pending' | 'inactive' | 'removed'): void {
    this.status = newStatus;
  }

  activate(): void {
    this.status = 'active';
  }

  removeFromTeam(): void {
    this.lastTeamId = this.teamId; // Salvar histórico
    this.teamId = null;
    this.status = 'removed';
    this.role = UserRole.create('viewer'); // Downgrade para viewer quando sair do team
  }

  canCreateProject(): boolean {
    return this.role.canCreateProject();
  }

  canCreateProjectType(projectType: string): boolean {
    return this.role.canCreateProjectType(projectType);
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  updateLastLoginAt(): void {
    this.lastLoginAt = new Date();
  }

  getLastLoginAt(): Date | null {
    return this.lastLoginAt;
  }

  // Getters
  getId(): string { return this.id.getValue(); }
  getUserId(): UserId { return this.id; }
  getEmail(): Email { return this.email; }
  getName(): Name { return this.name; }
  getCompany(): string { return this.company; }
  getRole(): UserRole { return this.role; }
  getTeamId(): string | null { return this.teamId; }
  getLastTeamId(): string | null { return this.lastTeamId; }
  getStatus(): 'active' | 'pending' | 'inactive' | 'removed' { return this.status; }
  getLogoUrl(): string | undefined { return this.logoUrl; }
  getCreatedAt(): Date { return this._createdAt; }
  
  // Para compatibilidade com toString() em alguns contextos
  toString(): string {
    return this.role.getValue();
  }
}