import { IAreaMontagemRepository } from "./IAreaMontagemRepository";
import { IGoogleApiKeyRepository } from "./IGoogleApiKeyRepository";
import { ILeadRepository } from "./ILeadRepository";
import { IModel3DRepository } from "./IModel3DRepository";
import { IProfileRepository } from "./IProfileRepository";
import { IProjectRepository } from "./IProjectRepository";
import { ISolarProjectRepository } from "./ISolarProjectRepository";
import { IUnitOfWork } from "./IUnitOfWork";
import { IUserRepository } from "./IUserRepository";

export interface IRepositoryFactory {
  createUserRepository(): IUserRepository;
  createLeadRepository(): ILeadRepository;
  createProjectRepository(): IProjectRepository;
  createModel3DRepository(): IModel3DRepository;
  createAreaMontagemRepository(): IAreaMontagemRepository;
  createGoogleApiKeyRepository(): IGoogleApiKeyRepository;
  createSolarProjectRepository(): ISolarProjectRepository;
  createProfileRepository(): IProfileRepository;
  createUnitOfWork(): IUnitOfWork;
}