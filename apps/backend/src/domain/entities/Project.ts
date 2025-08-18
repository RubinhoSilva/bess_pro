import { Coordinates } from "../value-objects/Coordinates";
import { Name } from "../value-objects/Name";
import { ProjectId } from "../value-objects/ProjectId";
import { UserId } from "../value-objects/UserId";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export enum ProjectType {
  PV = 'pv',
  BESS = 'bess',
  HYBRID = 'hybrid'
}

export interface ProjectProps extends SoftDeleteProps {
  id?: string;
  projectName: string;
  userId: string;
  projectType: ProjectType;
  address?: string;
  leadId?: string;
  projectData?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Project extends BaseEntity {
  private constructor(
    private readonly id: ProjectId,
    private projectName: Name,
    private readonly userId: UserId,
    private readonly projectType: ProjectType,
    private address: string,
    private leadId?: string,
    private projectData: Record<string, any> = {},
    private savedAt: Date = new Date(),
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: ProjectProps): Project {
    const id = props.id ? ProjectId.create(props.id) : ProjectId.generate();
    const projectName = Name.create(props.projectName);
    const userId = UserId.create(props.userId);

    if (!Object.values(ProjectType).includes(props.projectType)) {
      throw new Error('Tipo de projeto inválido');
    }

    return new Project(
      id,
      projectName,
      userId,
      props.projectType,
      props.address || '',
      props.leadId,
      props.projectData || {},
      new Date(),
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt
      }
    );
  }

  updateProjectName(newName: string): void {
    this.projectName = Name.create(newName);
    this.updateSavedAt();
  }

  updateAddress(newAddress: string): void {
    this.address = newAddress;
    this.updateSavedAt();
  }

  updateProjectData(newData: Record<string, any>): void {
    this.projectData = { ...this.projectData, ...newData };
    this.updateSavedAt();
  }

  setProjectData(data: Record<string, any>): void {
    this.projectData = data;
    this.updateSavedAt();
  }

  linkToLead(leadId: string): void {
    this.leadId = leadId;
    this.updateSavedAt();
  }

  unlinkFromLead(): void {
    this.leadId = undefined;
    this.updateSavedAt();
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  hasLocation(): boolean {
    return this.projectData.location && 
           this.projectData.location.latitude && 
           this.projectData.location.longitude;
  }

  getLocation(): Coordinates | null {
    if (!this.hasLocation()) return null;
    
    return Coordinates.create(
      this.projectData.location.latitude,
      this.projectData.location.longitude
    );
  }

  private updateSavedAt(): void {
    this.savedAt = new Date();
  }

  // Getters
  getId(): string { return this.id.getValue(); }
  getProjectId(): ProjectId { return this.id; }
  getProjectName(): Name { return this.projectName; }
  getUserId(): UserId { return this.userId; }
  getProjectType(): ProjectType { return this.projectType; }
  getAddress(): string { return this.address; }
  getLeadId(): string | undefined { return this.leadId; }
  getProjectData(): Record<string, any> { return { ...this.projectData }; }
  getSavedAt(): Date { return this.savedAt; }
  getCreatedAt(): Date { return this._createdAt; }
}