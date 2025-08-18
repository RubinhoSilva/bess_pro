import { Name } from "../value-objects/Name";
import { UserId } from "../value-objects/UserId";
import { UserRole } from "../value-objects/UserRole";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface ProfileProps extends SoftDeleteProps {
  id?: string;
  userId: string;
  name: string;
  company: string;
  role: string;
  logoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Profile extends BaseEntity {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private name: Name,
    private company: string,
    private role: UserRole,
    private logoUrl?: string,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: ProfileProps): Profile {
    const id = props.id || crypto.randomUUID();
    const userId = UserId.create(props.userId);
    const name = Name.create(props.name);
    const role = UserRole.create(props.role);

    return new Profile(
      id,
      userId,
      name,
      props.company || '',
      role,
      props.logoUrl,
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      }
    );
  }

  updateName(newName: string): void {
    this.name = Name.create(newName);
    this.updateTimestamp();
  }

  updateCompany(newCompany: string): void {
    this.company = newCompany;
    this.updateTimestamp();
  }

  updateRole(newRole: string): void {
    this.role = UserRole.create(newRole);
    this.updateTimestamp();
  }

  updateLogo(newLogoUrl: string): void {
    this.logoUrl = newLogoUrl;
    this.updateTimestamp();
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): UserId { return this.userId; }
  getName(): Name { return this.name; }
  getCompany(): string { return this.company; }
  getRole(): UserRole { return this.role; }
  getLogoUrl(): string | undefined { return this.logoUrl; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}