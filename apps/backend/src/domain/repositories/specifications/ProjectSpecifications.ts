import { Project, ProjectType } from "@/domain/entities/Project";
import { ISpecification } from "./ISpecification";
import { UserId } from "@/domain/value-objects/UserId";
import { Coordinates } from "@/domain/value-objects/Coordinates";

export interface IProjectSpecification extends ISpecification<Project> {}

export interface IProjectSpecificationFactory {
  createUserProjectsSpec(userId: UserId): IProjectSpecification;
  createProjectTypeSpec(type: ProjectType): IProjectSpecification;
  createHasLocationSpec(): IProjectSpecification;
  createHasLeadSpec(): IProjectSpecification;
  createCreatedBetweenSpec(start: Date, end: Date): IProjectSpecification;
  createNearLocationSpec(coordinates: Coordinates, radiusKm: number): IProjectSpecification;
  createRecentlyModifiedSpec(daysAgo: number): IProjectSpecification;
}