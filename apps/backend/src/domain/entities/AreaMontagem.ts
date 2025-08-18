import { Name } from "../value-objects/Name";
import { ProjectId } from "../value-objects/ProjectId";
import { UserId } from "../value-objects/UserId";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface AreaMontagemProps extends SoftDeleteProps {
  id?: string;
  projectId: string;
  userId: string;
  nome: string;
  coordinates?: Record<string, any>;
  moduleLayout?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AreaMontagem extends BaseEntity {
  private constructor(
    private readonly id: string,
    private readonly projectId: ProjectId,
    private readonly userId: UserId,
    private nome: Name,
    private coordinates: Record<string, any>,
    private moduleLayout: Record<string, any>,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: AreaMontagemProps): AreaMontagem {
    const id = props.id || crypto.randomUUID();
    const projectId = ProjectId.create(props.projectId);
    const userId = UserId.create(props.userId);
    const nome = Name.create(props.nome);

    return new AreaMontagem(
      id,
      projectId,
      userId,
      nome,
      props.coordinates || {},
      props.moduleLayout || {},
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      }
    );
  }

  updateNome(newNome: string): void {
    this.nome = Name.create(newNome);
  }

  updateCoordinates(newCoordinates: Record<string, any>): void {
    this.coordinates = { ...newCoordinates };
  }

  updateModuleLayout(newLayout: Record<string, any>): void {
    this.moduleLayout = { ...newLayout };
  }

  clearModuleLayout(): void {
    this.moduleLayout = {};
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  belongsToProject(projectId: ProjectId): boolean {
    return this.projectId.equals(projectId);
  }

  hasModules(): boolean {
    return Object.keys(this.moduleLayout).length > 0;
  }

  getModuleCount(): number {
    return this.moduleLayout.moduleCount || 0;
  }

  // Getters
  getId(): string { return this.id; }
  getProjectId(): ProjectId { return this.projectId; }
  getUserId(): UserId { return this.userId; }
  getNome(): Name { return this.nome; }
  getCoordinates(): Record<string, any> { return { ...this.coordinates }; }
  getModuleLayout(): Record<string, any> { return { ...this.moduleLayout }; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}