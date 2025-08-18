import { Result } from "./common/Result";
import type { IQuery } from "./common/IQuery";
import type { IUseCase } from "./common/IUseCase";
import type { CreateLeadCommand } from "./dtos/input/lead/CreateLeadCommand";
import type { CreateProjectCommand } from "./dtos/input/project/CreateProjectCommand";
import type { UpdateProjectCommand } from "./dtos/input/project/UpdateProjectCommand";
import type { LoginUserCommand } from "./dtos/input/user/LoginUserCommand";
import type { RegisterUserCommand } from "./dtos/input/user/RegisterUserCommand";
import type { LeadResponseDto } from "./dtos/output/LeadResponseDto";
import type { ProjectListDto } from "./dtos/output/ProjectListDto";
import type { ProjectResponseDto } from "./dtos/output/ProjectResponseDto";
import type { UserResponseDto } from "./dtos/output/UserResponseDto";
import { AreaMontagemMapper } from "./mappers/AreaMontagemMapper";
import { LeadMapper } from "./mappers/LeadMapper";
import { LeadInteractionMapper } from "./mappers/LeadInteractionMapper";
import { Model3DMapper } from "./mappers/Model3DMapper";
import { ProjectMapper } from "./mappers/ProjectMapper";
import { UserMapper } from "./mappers/UserMapper";
import { NotificationService } from "./services/NotificationService";
import { CreateAreaMontagemUseCase } from "./use-cases/area/CreateAreaMontagemUseCase";
import { CalculateSolarSystemUseCase } from "./use-cases/calculation/CalculateSolarSystemUseCase";
import { AnalyzeFinancialUseCase } from "./use-cases/financial/AnalyzeFinancialUseCase";
import { ConvertLeadToProjectUseCase } from "./use-cases/lead/ConvertLeadToProjectUseCase";
import { CreateLeadUseCase } from "./use-cases/lead/CreateLeadUseCase";
import { GetLeadsUseCase } from "./use-cases/lead/GetLeadsUseCase";
import { UpdateLeadUseCase } from "./use-cases/lead/UpdateLeadUseCase";
import { DeleteLeadUseCase } from "./use-cases/lead/DeleteLeadUseCase";
import { GetLeadByIdUseCase } from "./use-cases/lead/GetLeadByIdUseCase";
import { UpdateLeadStageUseCase } from "./use-cases/lead/UpdateLeadStageUseCase";
import { CreateLeadInteractionUseCase } from "./use-cases/lead-interaction/CreateLeadInteractionUseCase";
import { GetLeadInteractionsUseCase } from "./use-cases/lead-interaction/GetLeadInteractionsUseCase";
import { UpdateLeadInteractionUseCase } from "./use-cases/lead-interaction/UpdateLeadInteractionUseCase";
import { DeleteLeadInteractionUseCase } from "./use-cases/lead-interaction/DeleteLeadInteractionUseCase";
import { UploadModel3DUseCase } from "./use-cases/model3d/UploadModel3DUseCase";
import { CreateProjectUseCase } from "./use-cases/project/CreateProjectUseCase";
import { DeleteProjectUseCase } from "./use-cases/project/DeleteProjectUseCase";
import { GetProjectDetailsUseCase } from "./use-cases/project/GetProjectDetailsUseCase";
import { GetProjectListUseCase } from "./use-cases/project/GetProjectListUseCase";
import { UpdateProjectUseCase } from "./use-cases/project/UpdateProjectUseCase";
import { LoginUserUseCase } from "./use-cases/user/LoginUserUseCase";
import { RegisterUserUseCase } from "./use-cases/user/RegisterUserUseCase";
import { UpdateProfileUseCase } from "./use-cases/user/UpdateProfileUseCase";

export {
  // Use Cases - User
  RegisterUserUseCase,
  LoginUserUseCase,
  UpdateProfileUseCase,

  // Use Cases - Project
  CreateProjectUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectListUseCase,
  GetProjectDetailsUseCase,

  // Use Cases - Lead
  CreateLeadUseCase,
  GetLeadsUseCase,
  UpdateLeadUseCase,
  DeleteLeadUseCase,
  GetLeadByIdUseCase,
  UpdateLeadStageUseCase,
  ConvertLeadToProjectUseCase,

  // Use Cases - Lead Interaction
  CreateLeadInteractionUseCase,
  GetLeadInteractionsUseCase,
  UpdateLeadInteractionUseCase,
  DeleteLeadInteractionUseCase,

  // Use Cases - Model3D
  UploadModel3DUseCase,

  // Use Cases - Area
  CreateAreaMontagemUseCase,

  // Use Cases - Calculation
  CalculateSolarSystemUseCase,
  AnalyzeFinancialUseCase,

  // Mappers
  UserMapper,
  ProjectMapper,
  LeadMapper,
  LeadInteractionMapper,
  Model3DMapper,
  AreaMontagemMapper,

  // Common
  Result,
};

// Type exports
export type {
  // DTOs
  RegisterUserCommand,
  LoginUserCommand,
  CreateProjectCommand,
  UpdateProjectCommand,
  CreateLeadCommand,
  UserResponseDto,
  ProjectResponseDto,
  LeadResponseDto,
  ProjectListDto,

  // Services
  NotificationService,

  // Common interfaces
  IUseCase,
  IQuery,
};
