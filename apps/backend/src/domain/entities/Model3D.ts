import { Name } from "../value-objects/Name";
import { ProjectId } from "../value-objects/ProjectId";
import { UserId } from "../value-objects/UserId";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface Model3DProps extends SoftDeleteProps {
  id?: string;
  userId: string;
  projectId: string;
  name: string;
  description?: string;
  modelPath: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Model3D extends BaseEntity {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private readonly projectId: ProjectId,
    private name: Name,
    private description: string,
    private readonly modelPath: string,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: Model3DProps): Model3D {
    const id = props.id || crypto.randomUUID();
    const userId = UserId.create(props.userId);
    const projectId = ProjectId.create(props.projectId);
    const name = Name.create(props.name);

    if (!props.modelPath || props.modelPath.trim().length === 0) {
      throw new Error('Caminho do modelo é obrigatório');
    }

    const validExtensions = ['.obj', '.gltf', '.glb', '.fbx'];
    const hasValidExtension = validExtensions.some(ext => 
      props.modelPath.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error('Formato de modelo não suportado');
    }

    return new Model3D(
      id,
      userId,
      projectId,
      name,
      props.description || '',
      props.modelPath,
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
  }

  updateDescription(newDescription: string): void {
    this.description = newDescription;
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  belongsToProject(projectId: ProjectId): boolean {
    return this.projectId.equals(projectId);
  }

  getFileExtension(): string {
    return this.modelPath.split('.').pop()?.toLowerCase() || '';
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): UserId { return this.userId; }
  getProjectId(): ProjectId { return this.projectId; }
  getName(): Name { return this.name; }
  getDescription(): string { return this.description; }
  getModelPath(): string { return this.modelPath; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}