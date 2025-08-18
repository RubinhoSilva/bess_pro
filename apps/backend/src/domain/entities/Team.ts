import { TeamId } from "../value-objects/TeamId";
import { Name } from "../value-objects/Name";
import { Email } from "../value-objects/Email";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface TeamProps extends SoftDeleteProps {
  id?: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  isActive: boolean;
  planType?: string;
  maxUsers?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Team extends BaseEntity {
  private constructor(
    private readonly id: TeamId,
    private name: Name,
    private description: string,
    private readonly ownerId: string,
    private readonly ownerEmail: Email,
    private isActive: boolean,
    private planType: string,
    private maxUsers: number,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: TeamProps): Team {
    const id = props.id ? TeamId.create(props.id) : TeamId.generate();
    const name = Name.create(props.name);
    const ownerEmail = Email.create(props.ownerEmail);

    return new Team(
      id,
      name,
      props.description || '',
      props.ownerId,
      ownerEmail,
      props.isActive ?? true,
      props.planType || 'basic',
      props.maxUsers || 10,
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      }
    );
  }

  changeName(newName: string): void {
    this.name = Name.create(newName);
    this._updatedAt = new Date();
  }

  changeDescription(newDescription: string): void {
    this.description = newDescription;
    this._updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this._updatedAt = new Date();
  }

  changePlan(newPlanType: string, newMaxUsers: number): void {
    this.planType = newPlanType;
    this.maxUsers = newMaxUsers;
    this._updatedAt = new Date();
  }

  canAddUser(currentUserCount: number): boolean {
    return this.isActive && currentUserCount < this.maxUsers;
  }

  // Getters
  getId(): string { return this.id.getValue(); }
  getTeamId(): TeamId { return this.id; }
  getName(): Name { return this.name; }
  getDescription(): string { return this.description; }
  getOwnerId(): string { return this.ownerId; }
  getOwnerEmail(): Email { return this.ownerEmail; }
  getIsActive(): boolean { return this.isActive; }
  getPlanType(): string { return this.planType; }
  getMaxUsers(): number { return this.maxUsers; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}