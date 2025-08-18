import { Coordinates } from "../value-objects/Coordinates";
import { Name } from "../value-objects/Name";
import { UserId } from "../value-objects/UserId";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export interface SolarProjectProps extends SoftDeleteProps {
  id?: string;
  userId: string;
  projectName: string;
  address: string;
  coordinates?: Coordinates;
  solarApiData?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SolarProject extends BaseEntity {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private projectName: Name,
    private address: string,
    private coordinates?: Coordinates,
    private solarApiData: Record<string, any> = {},
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: SolarProjectProps): SolarProject {
    const id = props.id || crypto.randomUUID();
    const userId = UserId.create(props.userId);
    const projectName = Name.create(props.projectName);

    if (!props.address || props.address.trim().length === 0) {
      throw new Error('Endereço é obrigatório');
    }

    return new SolarProject(
      id,
      userId,
      projectName,
      props.address.trim(),
      props.coordinates,
      props.solarApiData || {},
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      }
    );
  }

  updateProjectName(newName: string): void {
    this.projectName = Name.create(newName);
  }

  updateAddress(newAddress: string): void {
    if (!newAddress || newAddress.trim().length === 0) {
      throw new Error('Endereço não pode estar vazio');
    }
    this.address = newAddress.trim();
  }

  updateCoordinates(coordinates: Coordinates): void {
    this.coordinates = coordinates;
  }

  updateSolarApiData(data: Record<string, any>): void {
    this.solarApiData = { ...this.solarApiData, ...data };
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  hasCoordinates(): boolean {
    return this.coordinates !== undefined;
  }

  hasSolarData(): boolean {
    return Object.keys(this.solarApiData).length > 0;
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): UserId { return this.userId; }
  getProjectName(): Name { return this.projectName; }
  getAddress(): string { return this.address; }
  getCoordinates(): Coordinates | undefined { return this.coordinates; }
  getSolarApiData(): Record<string, any> { return { ...this.solarApiData }; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}