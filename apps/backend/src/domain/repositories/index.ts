import type { IRepositoryEventPublisher, RepositoryEvent } from "./events/RepositoryEvents";
import type { IAreaMontagemRepository } from "./IAreaMontagemRepository";
import type { IBaseRepository } from "./IBaseRepository";
import type { IGoogleApiKeyRepository } from "./IGoogleApiKeyRepository";
import type { ILeadRepository } from "./ILeadRepository";
import type { IModel3DRepository } from "./IModel3DRepository";
import type { IProfileRepository } from "./IProfileRepository";
import type { IProjectRepository, ProjectSearchFilters, ProjectSummary } from "./IProjectRepository";
import type { IRepositoryFactory } from "./IRepositoryFactory";
import type { ISolarProjectRepository } from "./ISolarProjectRepository";
import type { IUnitOfWork } from "./IUnitOfWork";
import type { IUserRepository } from "./IUserRepository";
import type { LeadQuery } from "./queries/LeadQueries";
import type { ProjectQuery, ProjectSummaryQuery } from "./queries/ProjectQueries";
import type { ISpecification } from "./specifications/ISpecification";
import type { IProjectSpecification, IProjectSpecificationFactory } from "./specifications/ProjectSpecifications";

export type {
  // Base
  IBaseRepository,
  
  // Main Repositories
  IUserRepository,
  ILeadRepository,
  IProjectRepository,
  IModel3DRepository,
  IAreaMontagemRepository,
  IGoogleApiKeyRepository,
  ISolarProjectRepository,
  IProfileRepository,
  
  // Patterns
  IUnitOfWork,
  IRepositoryFactory,
  ISpecification,
  IProjectSpecification,
  IProjectSpecificationFactory,
  IRepositoryEventPublisher,
  
  // Types
  ProjectSearchFilters,
  ProjectSummary,
  ProjectQuery,
  ProjectSummaryQuery,
  LeadQuery,
  RepositoryEvent
};