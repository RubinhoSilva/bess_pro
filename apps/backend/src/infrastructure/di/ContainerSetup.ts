import { Container } from './Container';
import { AppConfig } from '../config/AppConfig';
import { ServiceTokens } from './ServiceTokens';

// Infrastructure - Database
import { MongoUserRepository } from '../database/mongodb/repositories/MongoUserRepository';
import { MongoTeamRepository } from '../database/mongodb/repositories/MongoTeamRepository';
import { MongoKanbanColumnRepository } from '../database/mongodb/repositories/MongoKanbanColumnRepository';
import { MongoProjectRepository } from '../database/mongodb/repositories/MongoProjectRepository';
import { MongoLeadRepository } from '../database/mongodb/repositories/MongoLeadRepository';
import { MongoLeadInteractionRepository } from '../database/mongodb/repositories/MongoLeadInteractionRepository';
import { MongoClientRepository } from '../database/mongodb/repositories/MongoClientRepository';
import { MongoAlertRepository } from '../database/mongodb/repositories/MongoAlertRepository';
import { MongoSolarModuleRepository } from '../database/mongodb/repositories/MongoSolarModuleRepository';
import { MongoInverterRepository } from '../database/mongodb/repositories/MongoInverterRepository';
import { MongoManufacturerRepository } from '../database/mongodb/repositories/MongoManufacturerRepository';
import { MongoEquipmentCatalogRepository } from '../database/mongodb/repositories/MongoEquipmentCatalogRepository';
import { DeleteManufacturerUseCaseV2 } from '../../application/use-cases/equipment/DeleteManufacturerUseCaseV2';
import { MongoProposalTemplateRepository } from '../database/mongodb/repositories/MongoProposalTemplateRepository';
import { MongoProposalSettingsRepository } from '../database/mongodb/repositories/MongoProposalSettingsRepository';
import { MongoAdvancedProposalTemplateRepository } from '../database/mongodb/repositories/MongoAdvancedProposalTemplateRepository';
import { MongoAreaMontagemRepository } from '../database/mongodb/repositories/MongoAreaMontagemRepository';
import { MongoModel3DRepository } from '../database/mongodb/repositories/MongoModel3DRepository';
import { MongoClientAlertRepository } from '../database/mongodb/repositories/MongoClientAlertRepository';
import { MongoEnergyCompanyRepository } from '../database/mongodb/repositories/MongoEnergyCompanyRepository';
import { MongoCompanyProfileRepository } from '../database/mongodb/repositories/MongoCompanyProfileRepository';
import { ProposalSettingsModel } from '../database/mongodb/schemas/ProposalSettingsSchema';

// Infrastructure - External Services
import { BcryptPasswordHashService } from '../security/BcryptPasswordHashService';
import { JwtTokenService } from '../security/JwtTokenService';
import { NodemailerEmailService } from '../email/NodemailerEmailService';
import { LocalFileStorageService } from '../storage/LocalFileStorageService';
import { S3FileStorageService } from '../storage/S3FileStorageService';
import { CompanyLogoService } from '../storage/CompanyLogoService';
import { PvgisApiService } from '../external-apis/PvgisApiService';
import { PaymentGatewayService } from '../external-apis/PaymentGatewayService';
import { SimplePvlibServiceClient } from '../external-apis/SimplePvlibServiceClient';

// Domain Services
import { ProjectDomainService } from '../../domain/services/ProjectDomainService';
import { SolarCalculationService } from '../../domain/services/SolarCalculationService';
import { UserPermissionService } from '../../domain/services/UserPermissionService';
import { LocationService } from '../../domain/services/LocationService';
import { Model3DValidationService } from '../../domain/services/Model3DValidationService';
import { AreaCalculationService } from '../../domain/services/AreaCalculationService';
import { KanbanColumnSeederService } from '../../domain/services/KanbanColumnSeederService';
import { DefaultEmailInvitationService } from '../../domain/services/EmailInvitationService';

// Application Services
import { NotificationService } from '../../application/services/NotificationService';

// Use Cases - User
import { RegisterUserUseCase } from '../../application/use-cases/user/RegisterUserUseCase';
import { SetupPasswordUseCase } from '../../application/use-cases/auth/SetupPasswordUseCase';
import { LoginUserUseCase } from '../../application/use-cases/user/LoginUserUseCase';
import { UpdateProfileUseCase } from '../../application/use-cases/user/UpdateProfileUseCase';

// Use Cases - Project
import { CreateProjectUseCase } from '../../application/use-cases/project/CreateProjectUseCase';
import { UpdateProjectUseCase } from '../../application/use-cases/project/UpdateProjectUseCase';
import { DeleteProjectUseCase } from '../../application/use-cases/project/DeleteProjectUseCase';
import { GetProjectListUseCase } from '../../application/use-cases/project/GetProjectListUseCase';
import { GetProjectDetailsUseCase } from '../../application/use-cases/project/GetProjectDetailsUseCase';
import { CloneProjectUseCase } from '../../application/use-cases/project/CloneProjectUseCase';
import { ExportProjectBackupUseCase } from '../../application/use-cases/project/ExportProjectBackupUseCase';
import { ImportProjectBackupUseCase } from '../../application/use-cases/project/ImportProjectBackupUseCase';

// Use Cases - Lead
import { CreateLeadUseCase } from '../../application/use-cases/lead/CreateLeadUseCase';
import { GetLeadsUseCase } from '../../application/use-cases/lead/GetLeadsUseCase';
import { UpdateLeadUseCase } from '../../application/use-cases/lead/UpdateLeadUseCase';
import { DeleteLeadUseCase } from '../../application/use-cases/lead/DeleteLeadUseCase';
import { GetLeadByIdUseCase } from '../../application/use-cases/lead/GetLeadByIdUseCase';
import { UpdateLeadStageUseCase } from '../../application/use-cases/lead/UpdateLeadStageUseCase';
import { ConvertLeadToProjectUseCase } from '../../application/use-cases/lead/ConvertLeadToProjectUseCase';

// Use Cases - Lead Interaction
import { CreateLeadInteractionUseCase } from '../../application/use-cases/lead-interaction/CreateLeadInteractionUseCase';
import { GetLeadInteractionsUseCase } from '../../application/use-cases/lead-interaction/GetLeadInteractionsUseCase';
import { UpdateLeadInteractionUseCase } from '../../application/use-cases/lead-interaction/UpdateLeadInteractionUseCase';
import { DeleteLeadInteractionUseCase } from '../../application/use-cases/lead-interaction/DeleteLeadInteractionUseCase';

// Use Cases - Model3D
import { UploadModel3DUseCase } from '../../application/use-cases/model3d/UploadModel3DUseCase';

// Use Cases - Area
import { CreateAreaMontagemUseCase } from '../../application/use-cases/area/CreateAreaMontagemUseCase';

// Use Cases - Calculation
import { CalculateStandaloneSolarSystemUseCase } from '../../application/use-cases/calculation/CalculateStandaloneSolarSystemUseCase';
import { CalculateProjectFinancialsUseCase } from '../../application/use-cases/calculation/CalculateProjectFinancialsUseCase';

// Use Cases - Financial
import { AnalyzeFinancialUseCase } from '../../application/use-cases/financial/AnalyzeFinancialUseCase';

// Use Cases - Report
import { GenerateFinancialReportUseCase } from '../../application/use-cases/report/GenerateFinancialReportUseCase';



// Use Cases - Advanced Template
import { CloneAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/CloneAdvancedTemplateUseCase';

// Use Cases - Irradiation
import { GetPVGISIrradiationUseCase } from '../../application/use-cases/irradiation/GetPVGISIrradiationUseCase';
import { GetPVGISMRDataUseCase } from '../../application/use-cases/irradiation/GetPVGISMRDataUseCase';
import { GetPVGISMonthlyComponentsUseCase } from '../../application/use-cases/irradiation/GetPVGISMonthlyComponentsUseCase';



// Use Cases - Irradiation
import { GetSolarIrradiationUseCase } from '../../application/use-cases/irradiation/GetSolarIrradiationUseCase';

// Use Cases - Alert
import { CreateAlertUseCase } from '../../application/use-cases/alert/CreateAlertUseCase';
import { GetUserAlertsUseCase } from '../../application/use-cases/alert/GetUserAlertsUseCase';
import { UpdateAlertStatusUseCase } from '../../application/use-cases/alert/UpdateAlertStatusUseCase';

// Use Cases - Client Alert
import { CreateClientAlertUseCase } from '../../application/use-cases/client-alerts/CreateClientAlertUseCase';
import { GetClientAlertsUseCase } from '../../application/use-cases/client-alerts/GetClientAlertsUseCase';
import { UpdateClientAlertUseCase } from '../../application/use-cases/client-alerts/UpdateClientAlertUseCase';
import { GetDashboardAlertsUseCase } from '../../application/use-cases/client-alerts/GetDashboardAlertsUseCase';

// Use Cases - Client
import { CreateClientUseCase } from '../../application/use-cases/client/CreateClientUseCase';
import { GetClientListUseCase } from '../../application/use-cases/client/GetClientListUseCase';
import { GetClientDetailsUseCase } from '../../application/use-cases/client/GetClientDetailsUseCase';
import { UpdateClientUseCase } from '../../application/use-cases/client/UpdateClientUseCase';
import { DeleteClientUseCase } from '../../application/use-cases/client/DeleteClientUseCase';
import { ConvertLeadToClientUseCase } from '../../application/use-cases/client/ConvertLeadToClientUseCase';
import { RevertClientToLeadUseCase } from '../../application/use-cases/client/RevertClientToLeadUseCase';

// Company Profile Use Cases
import { CreateCompanyProfileUseCase } from '../../application/use-cases/company-profile/CreateCompanyProfileUseCase';
import { GetCompanyProfileUseCase } from '../../application/use-cases/company-profile/GetCompanyProfileUseCase';
import { GetCompanyProfilesUseCase } from '../../application/use-cases/company-profile/GetCompanyProfilesUseCase';
import { UpdateCompanyProfileUseCase } from '../../application/use-cases/company-profile/UpdateCompanyProfileUseCase';
import { DeleteCompanyProfileUseCase } from '../../application/use-cases/company-profile/DeleteCompanyProfileUseCase';
import { UploadCompanyLogoUseCase } from '../../application/use-cases/company-profile/UploadCompanyLogoUseCase';
import { DeleteCompanyLogoUseCase } from '../../application/use-cases/company-profile/DeleteCompanyLogoUseCase';

// Use Cases - Team
import { CreateTeamUseCase } from '../../application/use-cases/team/CreateTeamUseCase';
import { GetTeamsUseCase } from '../../application/use-cases/team/GetTeamsUseCase';
import { UpdateTeamUseCase } from '../../application/use-cases/team/UpdateTeamUseCase';
import { InactivateTeamUseCase } from '../../application/use-cases/team/InactivateTeamUseCase';
import { InviteUserToTeamUseCase } from '../../application/use-cases/team/InviteUserToTeamUseCase';
import { ForgotPasswordUseCase } from '../../application/use-cases/auth/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/ResetPasswordUseCase';
import { MongoPasswordResetTokenRepository } from '../database/mongodb/repositories/MongoPasswordResetTokenRepository';

// Use Cases - Kanban
import { GetKanbanColumnsUseCase } from '../../application/use-cases/kanban/GetKanbanColumnsUseCase';
import { CreateKanbanColumnUseCase } from '../../application/use-cases/kanban/CreateKanbanColumnUseCase';
import { UpdateKanbanColumnUseCase } from '../../application/use-cases/kanban/UpdateKanbanColumnUseCase';
import { ReorderKanbanColumnsUseCase } from '../../application/use-cases/kanban/ReorderKanbanColumnsUseCase';

// Use Cases - Equipment
import { CreateSolarModuleUseCase } from '../../application/use-cases/equipment/CreateSolarModuleUseCase';
import { GetSolarModulesUseCase } from '../../application/use-cases/equipment/GetSolarModulesUseCase';
import { GetSolarModuleByIdUseCase } from '../../application/use-cases/equipment/GetSolarModuleByIdUseCase';
import { UpdateSolarModuleUseCase } from '../../application/use-cases/equipment/UpdateSolarModuleUseCase';
import { DeleteSolarModuleUseCase } from '../../application/use-cases/equipment/DeleteSolarModuleUseCase';
import { CreateInverterUseCase } from '../../application/use-cases/equipment/CreateInverterUseCase';
import { GetInvertersUseCase } from '../../application/use-cases/equipment/GetInvertersUseCase';
import { GetInverterByIdUseCase } from '../../application/use-cases/equipment/GetInverterByIdUseCase';
import { UpdateInverterUseCase } from '../../application/use-cases/equipment/UpdateInverterUseCase';
import { DeleteInverterUseCase } from '../../application/use-cases/equipment/DeleteInverterUseCase';

// Use Cases - Manufacturer
import { CreateManufacturerUseCase } from '../../application/use-cases/manufacturer/CreateManufacturerUseCase';
import { GetManufacturersUseCase } from '../../application/use-cases/manufacturer/GetManufacturersUseCase';
import { GetManufacturerByIdUseCase } from '../../application/use-cases/manufacturer/GetManufacturerByIdUseCase';
import { UpdateManufacturerUseCase } from '../../application/use-cases/manufacturer/UpdateManufacturerUseCase';
import { DeleteManufacturerUseCase } from '../../application/use-cases/manufacturer/DeleteManufacturerUseCase';

// Use Cases - Proposal Template
import { CreateProposalTemplateUseCase } from '../../application/use-cases/proposal-template/CreateProposalTemplateUseCase';
import { GetProposalTemplatesUseCase } from '../../application/use-cases/proposal-template/GetProposalTemplatesUseCase';
import { UpdateProposalTemplateUseCase } from '../../application/use-cases/proposal-template/UpdateProposalTemplateUseCase';
import { CreateProposalSettingsUseCase } from '../../application/use-cases/proposal-settings/CreateProposalSettingsUseCase';
import { GetProposalSettingsUseCase } from '../../application/use-cases/proposal-settings/GetProposalSettingsUseCase';
import { UpdateProposalSettingsUseCase } from '../../application/use-cases/proposal-settings/UpdateProposalSettingsUseCase';
import { GenerateProposalUseCase } from '../../application/use-cases/proposal-template/GenerateProposalUseCase';

// Use Cases - Solar Analysis
import { AnalyzeSolarPotentialUseCase } from '../../application/use-cases/solar/AnalyzeSolarPotentialUseCase';

// Use Cases - Advanced Templates
import { CreateAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/CreateAdvancedTemplateUseCase';
import { GetAdvancedTemplatesUseCase } from '../../application/use-cases/advanced-template/GetAdvancedTemplatesUseCase';
import { UpdateAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/UpdateAdvancedTemplateUseCase';
import { DeleteAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/DeleteAdvancedTemplateUseCase';
import { GenerateProposalFromTemplateUseCase } from '../../application/use-cases/advanced-template/GenerateProposalFromTemplateUseCase';

// Controllers
import { LeadInteractionController } from '../../presentation/controllers/LeadInteractionController';
import { ClientController } from '../../presentation/controllers/ClientController';
import { EnergyCompanyController } from '../../presentation/controllers/EnergyCompanyController';
import { ReportController } from '../../presentation/controllers/ReportController';
import { ProposalController } from '../../presentation/controllers/ProposalController';
import { CompanyProfileController } from '../../presentation/controllers/CompanyProfileController';

import { IrradiationController } from '../../presentation/controllers/IrradiationController';
import { TeamController } from '../../presentation/controllers/TeamController';
import { KanbanController } from '../../presentation/controllers/KanbanController';
import { SolarModuleController } from '../../presentation/controllers/SolarModuleController';
import { InverterController } from '../../presentation/controllers/InverterController';
import { ManufacturerController } from '../../presentation/controllers/ManufacturerController';
import { ProposalTemplateController } from '../../presentation/controllers/ProposalTemplateController';
import { ProposalSettingsController } from '../../presentation/controllers/ProposalSettingsController';
import { SolarAnalysisController } from '../../presentation/controllers/SolarAnalysisController';

import { AdvancedProposalTemplateController } from '../../presentation/controllers/AdvancedProposalTemplateController';
import { ClientAlertController } from '../../presentation/controllers/ClientAlertController';
import { FinancialCalculationController } from '../../presentation/controllers/FinancialCalculationController';

// Middlewares
import { AuthMiddleware } from '../../presentation/middleware/AuthMiddleware';
import { ValidationMiddleware } from '../../presentation/middleware/ValidationMiddleware';
import { FileUploadMiddleware } from '../../presentation/middleware/FileUploadMiddleware';

export class ContainerSetup {
  public static configure(container: Container, config: AppConfig): void {
    // Register Repositories (Singletons)
    container.register(ServiceTokens.USER_REPOSITORY, MongoUserRepository, true);
    container.register(ServiceTokens.TEAM_REPOSITORY, MongoTeamRepository, true);
    container.register(ServiceTokens.KANBAN_COLUMN_REPOSITORY, MongoKanbanColumnRepository, true);
    container.register(ServiceTokens.ProjectRepository, MongoProjectRepository, true);
    container.register(ServiceTokens.LeadRepository, MongoLeadRepository, true);
    container.register(ServiceTokens.LeadInteractionRepository, MongoLeadInteractionRepository, true);
    container.register(ServiceTokens.ClientRepository, MongoClientRepository, true);
    container.register(ServiceTokens.AlertRepository, MongoAlertRepository, true);
    container.register(ServiceTokens.SolarModuleRepository, MongoSolarModuleRepository, true);
    container.register(ServiceTokens.InverterRepository, MongoInverterRepository, true);
    container.register(ServiceTokens.ManufacturerRepository, MongoManufacturerRepository, true);
    
    // Equipment Catalog Repository (DDD Aggregate)
    container.registerFactory(ServiceTokens.EquipmentCatalogRepository, () => {
      return new MongoEquipmentCatalogRepository(
        container.resolve(ServiceTokens.ManufacturerRepository),
        container.resolve(ServiceTokens.SolarModuleRepository),
        container.resolve(ServiceTokens.InverterRepository)
      );
    });
    
    container.register(ServiceTokens.ProposalTemplateRepository, MongoProposalTemplateRepository, true);
    container.register(ServiceTokens.ProposalSettingsRepository, MongoProposalSettingsRepository, true);
    container.register(ServiceTokens.AdvancedProposalTemplateRepository, MongoAdvancedProposalTemplateRepository, true);
    container.register(ServiceTokens.AreaMontagemRepository, MongoAreaMontagemRepository, true);
    container.register(ServiceTokens.Model3DRepository, MongoModel3DRepository, true);
    container.register(ServiceTokens.PASSWORD_RESET_TOKEN_REPOSITORY, MongoPasswordResetTokenRepository, true);
    container.register('ClientAlertRepository', MongoClientAlertRepository, true);
    container.register(ServiceTokens.EnergyCompanyRepository, MongoEnergyCompanyRepository, true);
    container.register(ServiceTokens.CompanyProfileRepository, MongoCompanyProfileRepository, true);

    // Register Infrastructure Services (Singletons)
    container.register(ServiceTokens.PASSWORD_HASH_SERVICE, BcryptPasswordHashService, true);
    
    container.registerFactory(ServiceTokens.TOKEN_SERVICE, () => {
      return new JwtTokenService({
        secretKey: config.jwt.secretKey,
        refreshSecretKey: config.jwt.refreshSecretKey,
        expiresIn: config.jwt.expiresIn,
        refreshExpiresIn: config.jwt.refreshExpiresIn,
      });
    }, true);
    
    container.registerFactory(ServiceTokens.EMAIL_SERVICE, () => {
      return new NodemailerEmailService(config.email.nodemailer!);
    }, true);
    
    container.registerFactory(ServiceTokens.EMAIL_INVITATION_SERVICE, () => {
      return new DefaultEmailInvitationService();
    }, true);
    
    // File Storage - Choose based on configuration
    if (config.storage.provider === 's3') {
      container.register(ServiceTokens.FILE_STORAGE_SERVICE, S3FileStorageService, true);
    } else {
      container.register(ServiceTokens.FILE_STORAGE_SERVICE, LocalFileStorageService, true);
    }

    // Company Logo Service
    container.registerFactory(ServiceTokens.COMPANY_LOGO_SERVICE, () => {
      const s3Config = {
        accessKeyId: config.storage.s3?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config.storage.s3?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
        region: config.storage.s3?.region || process.env.AWS_REGION || 'us-east-1',
        bucket: config.storage.s3?.bucket || process.env.AWS_S3_BUCKET || '',
        cloudFrontUrl: config.storage.s3?.cloudFrontUrl || process.env.AWS_CLOUDFRONT_URL
      };
      return new CompanyLogoService(s3Config);
    }, true);

    // External API Services (Singletons)
    container.registerFactory(ServiceTokens.PVGIS_API_SERVICE, () => {
      const pvgisConfig = {
        baseUrl: config.externalApis.pvgis.baseUrl || 'https://re.jrc.ec.europa.eu/api/v5_2',
        defaultParams: {
          outputformat: 'json',
          browser: 1
        }
      };
      
      console.log('🔧 PvgisApiService config:', { baseUrl: pvgisConfig.baseUrl });
      return new PvgisApiService(pvgisConfig);
    }, true);
    container.register(ServiceTokens.PAYMENT_GATEWAY_SERVICE, PaymentGatewayService, true);

    // SimplePvlibServiceClient (Python Financial Service)
    container.registerFactory(ServiceTokens.PVLIB_SERVICE_CLIENT, () => {
      const pvlibUrl = config.externalApis.energyService?.baseUrl || process.env.ENERGY_SERVICE_URL || 'http://host.docker.internal:8110';

      console.log('🔧 SimplePvlibServiceClient config:', { baseUrl: pvlibUrl });
      return new SimplePvlibServiceClient(pvlibUrl);
    }, true);

    // Domain Services (Singletons)
    container.register('ProjectDomainService', ProjectDomainService, true);
    container.register('SolarCalculationService', SolarCalculationService, true);
    container.register('UserPermissionService', UserPermissionService, true);
    container.register('LocationService', LocationService, true);
    container.register('Model3DValidationService', Model3DValidationService, true);
    container.register('AreaCalculationService', AreaCalculationService, true);
    container.register(ServiceTokens.KANBAN_COLUMN_SEEDER_SERVICE, KanbanColumnSeederService, true);

    // Cache and Logger Services for Docker compatibility
    container.registerFactory(ServiceTokens.CACHE_SERVICE, () => {
      const { CacheService } = require('../cache/CacheService');
      return new CacheService({
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: 1800 // 30 minutes default
      });
    }, true);

    container.registerFactory('CalculationLogger', () => {
      const { CalculationLogger } = require('../../domain/services/CalculationLogger');
      return new CalculationLogger('Container');
    }, true);

    // Application Services (Singletons)
    container.register('NotificationService', NotificationService, true);

    // Use Cases - User
    container.registerFactory(ServiceTokens.REGISTER_USER_USE_CASE, () => {
      return new RegisterUserUseCase(
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.PASSWORD_HASH_SERVICE),
        container.resolve(ServiceTokens.EMAIL_SERVICE),
        container.resolve(ServiceTokens.TEAM_REPOSITORY),
        container.resolve(ServiceTokens.KANBAN_COLUMN_REPOSITORY),
        container.resolve(ServiceTokens.KANBAN_COLUMN_SEEDER_SERVICE)
      );
    });
    
    container.registerFactory(ServiceTokens.LOGIN_USER_USE_CASE, () => {
      return new LoginUserUseCase(
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.PASSWORD_HASH_SERVICE),
        container.resolve(ServiceTokens.TOKEN_SERVICE)
      );
    });

    container.registerFactory(ServiceTokens.SETUP_PASSWORD_USE_CASE, () => {
      return new SetupPasswordUseCase(
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.PASSWORD_HASH_SERVICE)
      );
    });

    container.registerFactory(ServiceTokens.FORGOT_PASSWORD_USE_CASE, () => {
      return new ForgotPasswordUseCase(
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.PASSWORD_RESET_TOKEN_REPOSITORY),
        container.resolve(ServiceTokens.EMAIL_INVITATION_SERVICE)
      );
    });

    container.registerFactory(ServiceTokens.RESET_PASSWORD_USE_CASE, () => {
      return new ResetPasswordUseCase(
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.PASSWORD_RESET_TOKEN_REPOSITORY),
        container.resolve(ServiceTokens.PASSWORD_HASH_SERVICE)
      );
    });
    
    container.register('UpdateProfileUseCase', UpdateProfileUseCase);

    // Use Cases - Team
    container.registerFactory(ServiceTokens.CREATE_TEAM_USE_CASE, () => {
      return new CreateTeamUseCase(
        container.resolve(ServiceTokens.TEAM_REPOSITORY),
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.KANBAN_COLUMN_REPOSITORY),
        container.resolve(ServiceTokens.KANBAN_COLUMN_SEEDER_SERVICE),
        container.resolve(ServiceTokens.EMAIL_INVITATION_SERVICE)
      );
    });

    container.registerFactory(ServiceTokens.GET_TEAMS_USE_CASE, () => {
      return new GetTeamsUseCase(
        container.resolve(ServiceTokens.TEAM_REPOSITORY),
        container.resolve(ServiceTokens.USER_REPOSITORY)
      );
    });

    container.registerFactory(ServiceTokens.UPDATE_TEAM_USE_CASE, () => {
      return new UpdateTeamUseCase(
        container.resolve(ServiceTokens.TEAM_REPOSITORY)
      );
    });

    container.registerFactory(ServiceTokens.INACTIVATE_TEAM_USE_CASE, () => {
      return new InactivateTeamUseCase(
        container.resolve(ServiceTokens.TEAM_REPOSITORY),
        container.resolve(ServiceTokens.USER_REPOSITORY)
      );
    });
    
    container.registerFactory(ServiceTokens.INVITE_USER_TO_TEAM_USE_CASE, () => {
      return new InviteUserToTeamUseCase(
        container.resolve(ServiceTokens.TEAM_REPOSITORY),
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.EMAIL_INVITATION_SERVICE)
      );
    });

    // Use Cases - Kanban
    container.registerFactory(ServiceTokens.GET_KANBAN_COLUMNS_USE_CASE, () => {
      return new GetKanbanColumnsUseCase(
        container.resolve(ServiceTokens.KANBAN_COLUMN_REPOSITORY)
      );
    });

    container.registerFactory(ServiceTokens.CREATE_KANBAN_COLUMN_USE_CASE, () => {
      return new CreateKanbanColumnUseCase(
        container.resolve(ServiceTokens.KANBAN_COLUMN_REPOSITORY)
      );
    });

    container.registerFactory(ServiceTokens.UPDATE_KANBAN_COLUMN_USE_CASE, () => {
      return new UpdateKanbanColumnUseCase(
        container.resolve(ServiceTokens.KANBAN_COLUMN_REPOSITORY)
      );
    });

    container.registerFactory(ServiceTokens.REORDER_KANBAN_COLUMNS_USE_CASE, () => {
      return new ReorderKanbanColumnsUseCase(
        container.resolve(ServiceTokens.KANBAN_COLUMN_REPOSITORY)
      );
    });

    // Use Cases - Equipment (Solar Modules)
    container.registerFactory(ServiceTokens.CreateSolarModuleUseCase, () => {
      return new CreateSolarModuleUseCase(
        container.resolve(ServiceTokens.SolarModuleRepository),
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetSolarModulesUseCase, () => {
      return new GetSolarModulesUseCase(
        container.resolve(ServiceTokens.SolarModuleRepository),
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetSolarModuleByIdUseCase, () => {
      return new GetSolarModuleByIdUseCase(
        container.resolve(ServiceTokens.SolarModuleRepository)
      );
    });

    container.registerFactory(ServiceTokens.UpdateSolarModuleUseCase, () => {
      return new UpdateSolarModuleUseCase(
        container.resolve(ServiceTokens.SolarModuleRepository),
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.DeleteSolarModuleUseCase, () => {
      return new DeleteSolarModuleUseCase(
        container.resolve(ServiceTokens.SolarModuleRepository)
      );
    });

    // Use Cases - Equipment (Inverters)
    container.registerFactory(ServiceTokens.CreateInverterUseCase, () => {
      return new CreateInverterUseCase(
        container.resolve(ServiceTokens.InverterRepository),
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetInvertersUseCase, () => {
      return new GetInvertersUseCase(
        container.resolve(ServiceTokens.InverterRepository),
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetInverterByIdUseCase, () => {
      return new GetInverterByIdUseCase(
        container.resolve(ServiceTokens.InverterRepository)
      );
    });

    container.registerFactory(ServiceTokens.UpdateInverterUseCase, () => {
      return new UpdateInverterUseCase(
        container.resolve(ServiceTokens.InverterRepository),
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.DeleteInverterUseCase, () => {
      return new DeleteInverterUseCase(
        container.resolve(ServiceTokens.InverterRepository)
      );
    });

    // Use Cases - Manufacturer
    container.registerFactory(ServiceTokens.CreateManufacturerUseCase, () => {
      return new CreateManufacturerUseCase(
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetManufacturersUseCase, () => {
      return new GetManufacturersUseCase(
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetManufacturerByIdUseCase, () => {
      return new GetManufacturerByIdUseCase(
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.UpdateManufacturerUseCase, () => {
      return new UpdateManufacturerUseCase(
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    container.registerFactory(ServiceTokens.DeleteManufacturerUseCase, () => {
      return new DeleteManufacturerUseCase(
        container.resolve(ServiceTokens.ManufacturerRepository)
      );
    });

    // Equipment Catalog Use Cases (DDD Aggregate)
    container.registerFactory(ServiceTokens.DeleteManufacturerUseCaseV2, () => {
      return new DeleteManufacturerUseCaseV2(
        container.resolve(ServiceTokens.EquipmentCatalogRepository)
      );
    });

    // Use Cases - Proposal Template
    container.registerFactory(ServiceTokens.CreateProposalTemplateUseCase, () => {
      return new CreateProposalTemplateUseCase(
        container.resolve(ServiceTokens.ProposalTemplateRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetProposalTemplatesUseCase, () => {
      return new GetProposalTemplatesUseCase(
        container.resolve(ServiceTokens.ProposalTemplateRepository)
      );
    });

    container.registerFactory(ServiceTokens.UpdateProposalTemplateUseCase, () => {
      return new UpdateProposalTemplateUseCase(
        container.resolve(ServiceTokens.ProposalTemplateRepository)
      );
    });

    container.registerFactory(ServiceTokens.CREATE_PROPOSAL_SETTINGS_USE_CASE, () => {
      return new CreateProposalSettingsUseCase(
        container.resolve(ServiceTokens.ProposalSettingsRepository)
      );
    });

    container.registerFactory(ServiceTokens.GET_PROPOSAL_SETTINGS_USE_CASE, () => {
      return new GetProposalSettingsUseCase(
        container.resolve(ServiceTokens.ProposalSettingsRepository)
      );
    });

    container.registerFactory(ServiceTokens.UPDATE_PROPOSAL_SETTINGS_USE_CASE, () => {
      return new UpdateProposalSettingsUseCase(
        container.resolve(ServiceTokens.ProposalSettingsRepository)
      );
    });

    container.registerFactory(ServiceTokens.GenerateProposalUseCase, () => {
      return new GenerateProposalUseCase(
        container.resolve(ServiceTokens.ProposalTemplateRepository),
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.ClientRepository)
      );
    });

    // Use Cases - Project
    container.registerFactory(ServiceTokens.CREATE_PROJECT_USE_CASE, () => {
      return new CreateProjectUseCase(
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.UPDATE_PROJECT_USE_CASE, () => {
      return new UpdateProjectUseCase(
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve('UserPermissionService')
      );
    });
    
    container.registerFactory(ServiceTokens.DELETE_PROJECT_USE_CASE, () => {
      return new DeleteProjectUseCase(
        container.resolve(ServiceTokens.ProjectRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.GET_PROJECT_LIST_USE_CASE, () => {
      return new GetProjectListUseCase(
        container.resolve(ServiceTokens.ProjectRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.GET_PROJECT_DETAILS_USE_CASE, () => {
      return new GetProjectDetailsUseCase(
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.USER_REPOSITORY)
      );
    });

    container.registerFactory(ServiceTokens.CLONE_PROJECT_USE_CASE, () => {
      return new CloneProjectUseCase(
        container.resolve(ServiceTokens.ProjectRepository)
      );
    });

    container.registerFactory(ServiceTokens.ExportProjectBackupUseCase, () => {
      return new ExportProjectBackupUseCase(
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.AreaMontagemRepository),
        container.resolve(ServiceTokens.Model3DRepository)
      );
    });

    container.registerFactory(ServiceTokens.ImportProjectBackupUseCase, () => {
      return new ImportProjectBackupUseCase(
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.AreaMontagemRepository),
        container.resolve(ServiceTokens.Model3DRepository)
      );
    });

    // Use Cases - Lead
    container.registerFactory(ServiceTokens.CREATE_LEAD_USE_CASE, () => {
      return new CreateLeadUseCase(
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.GET_LEADS_USE_CASE, () => {
      return new GetLeadsUseCase(
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.UPDATE_LEAD_USE_CASE, () => {
      return new UpdateLeadUseCase(
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.DELETE_LEAD_USE_CASE, () => {
      return new DeleteLeadUseCase(
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.GET_LEAD_BY_ID_USE_CASE, () => {
      return new GetLeadByIdUseCase(
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.UPDATE_LEAD_STAGE_USE_CASE, () => {
      return new UpdateLeadStageUseCase(
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.CONVERT_LEAD_TO_PROJECT_USE_CASE, () => {
      return new ConvertLeadToProjectUseCase(
        container.resolve(ServiceTokens.LeadRepository),
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.USER_REPOSITORY)
      );
    });

    // Use Cases - Lead Interaction
    container.register(ServiceTokens.CREATE_LEAD_INTERACTION_USE_CASE, CreateLeadInteractionUseCase);
    container.register(ServiceTokens.GET_LEAD_INTERACTIONS_USE_CASE, GetLeadInteractionsUseCase);
    container.register(ServiceTokens.UPDATE_LEAD_INTERACTION_USE_CASE, UpdateLeadInteractionUseCase);
    container.register(ServiceTokens.DELETE_LEAD_INTERACTION_USE_CASE, DeleteLeadInteractionUseCase);

    // Use Cases - Model3D
    container.register(ServiceTokens.UPLOAD_MODEL3D_USE_CASE, UploadModel3DUseCase);

    // Use Cases - Area
    container.register('CreateAreaMontagemUseCase', CreateAreaMontagemUseCase);

    // Use Cases - Calculation
    container.register(ServiceTokens.CALCULATE_STANDALONE_SOLAR_SYSTEM_USE_CASE, CalculateStandaloneSolarSystemUseCase);

    // Use Cases - Financial Calculation (Python Service)
    container.registerFactory(ServiceTokens.CalculateProjectFinancialsUseCase, () => {
      return new CalculateProjectFinancialsUseCase(
        container.resolve(ServiceTokens.PVLIB_SERVICE_CLIENT),
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.USER_REPOSITORY)
      );
    });

    // Use Cases - Financial
    container.register(ServiceTokens.ANALYZE_FINANCIAL_USE_CASE, AnalyzeFinancialUseCase);

    // Use Cases - Report
    container.registerFactory(ServiceTokens.GenerateFinancialReportUseCase, () => {
      return new GenerateFinancialReportUseCase(
        container.resolve(ServiceTokens.ProjectRepository),
        container.resolve(ServiceTokens.USER_REPOSITORY)
      );
    });



    // Use Cases - Irradiation
    container.registerFactory(ServiceTokens.GetSolarIrradiationUseCase, () => {
      return new GetSolarIrradiationUseCase();
    });

    // Use Cases - Alert
    container.registerFactory(ServiceTokens.CREATE_ALERT_USE_CASE, () => {
      return new CreateAlertUseCase(
        container.resolve(ServiceTokens.AlertRepository),
        container.resolve(ServiceTokens.LeadRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.GET_USER_ALERTS_USE_CASE, () => {
      return new GetUserAlertsUseCase(
        container.resolve(ServiceTokens.AlertRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.UPDATE_ALERT_STATUS_USE_CASE, () => {
      return new UpdateAlertStatusUseCase(
        container.resolve(ServiceTokens.AlertRepository)
      );
    });

    // Use Cases - Client Alert
    container.registerFactory('CreateClientAlertUseCase', () => {
      return new CreateClientAlertUseCase(
        container.resolve('ClientAlertRepository')
      );
    });

    container.registerFactory('GetClientAlertsUseCase', () => {
      return new GetClientAlertsUseCase(
        container.resolve('ClientAlertRepository')
      );
    });

    container.registerFactory('UpdateClientAlertUseCase', () => {
      return new UpdateClientAlertUseCase(
        container.resolve('ClientAlertRepository')
      );
    });

    container.registerFactory('GetDashboardAlertsUseCase', () => {
      return new GetDashboardAlertsUseCase(
        container.resolve('ClientAlertRepository')
      );
    });

    // Use Cases - Client
    container.registerFactory(ServiceTokens.CreateClientUseCase, () => {
      return new CreateClientUseCase(
        container.resolve(ServiceTokens.ClientRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.GetClientListUseCase, () => {
      return new GetClientListUseCase(
        container.resolve(ServiceTokens.ClientRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.GetClientDetailsUseCase, () => {
      return new GetClientDetailsUseCase(
        container.resolve(ServiceTokens.ClientRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.UpdateClientUseCase, () => {
      return new UpdateClientUseCase(
        container.resolve(ServiceTokens.ClientRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.DeleteClientUseCase, () => {
      return new DeleteClientUseCase(
        container.resolve(ServiceTokens.ClientRepository)
      );
    });
    
    container.registerFactory(ServiceTokens.ConvertLeadToClientUseCase, () => {
      return new ConvertLeadToClientUseCase(
        container.resolve(ServiceTokens.ClientRepository),
        container.resolve(ServiceTokens.LeadRepository)
      );
    });

    container.registerFactory(ServiceTokens.RevertClientToLeadUseCase, () => {
      return new RevertClientToLeadUseCase(
        container.resolve(ServiceTokens.ClientRepository),
        container.resolve(ServiceTokens.LeadRepository)
      );
    });

    // Controllers
    container.registerFactory('LeadInteractionController', () => {
      return new LeadInteractionController(
        container.resolve(ServiceTokens.CREATE_LEAD_INTERACTION_USE_CASE),
        container.resolve(ServiceTokens.GET_LEAD_INTERACTIONS_USE_CASE),
        container.resolve(ServiceTokens.UPDATE_LEAD_INTERACTION_USE_CASE),
        container.resolve(ServiceTokens.DELETE_LEAD_INTERACTION_USE_CASE)
      );
    });
    
    container.registerFactory('ClientController', () => {
      return new ClientController(
        container.resolve(ServiceTokens.CreateClientUseCase),
        container.resolve(ServiceTokens.GetClientListUseCase),
        container.resolve(ServiceTokens.GetClientDetailsUseCase),
        container.resolve(ServiceTokens.UpdateClientUseCase),
        container.resolve(ServiceTokens.DeleteClientUseCase),
        container.resolve(ServiceTokens.ConvertLeadToClientUseCase),
        container.resolve(ServiceTokens.RevertClientToLeadUseCase)
      );
    });

    container.registerFactory('ReportController', () => {
      return new ReportController(
        container.resolve(ServiceTokens.GenerateFinancialReportUseCase)
      );
    });



    container.registerFactory('IrradiationController', () => {
      return new IrradiationController(
        container.resolve(ServiceTokens.GetSolarIrradiationUseCase),
        container.resolve('GetPVGISIrradiationUseCase'),
        container.resolve('GetPVGISMRDataUseCase'),
        container.resolve('GetPVGISMonthlyComponentsUseCase')
      );
    });

    container.registerFactory(ServiceTokens.TEAM_CONTROLLER, () => {
      return new TeamController(
        container.resolve(ServiceTokens.CREATE_TEAM_USE_CASE),
        container.resolve(ServiceTokens.GET_TEAMS_USE_CASE),
        container.resolve(ServiceTokens.UPDATE_TEAM_USE_CASE),
        container.resolve(ServiceTokens.INACTIVATE_TEAM_USE_CASE)
      );
    });

    container.registerFactory(ServiceTokens.KANBAN_CONTROLLER, () => {
      return new KanbanController(
        container.resolve(ServiceTokens.GET_KANBAN_COLUMNS_USE_CASE),
        container.resolve(ServiceTokens.CREATE_KANBAN_COLUMN_USE_CASE),
        container.resolve(ServiceTokens.UPDATE_KANBAN_COLUMN_USE_CASE),
        container.resolve(ServiceTokens.REORDER_KANBAN_COLUMNS_USE_CASE),
        container.resolve(ServiceTokens.KANBAN_COLUMN_REPOSITORY),
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.TEAM_REPOSITORY),
        container.resolve(ServiceTokens.KANBAN_COLUMN_SEEDER_SERVICE)
      );
    });

    // Equipment Controllers
    container.registerFactory(ServiceTokens.SolarModuleController, () => {
      return new SolarModuleController(
        container.resolve(ServiceTokens.CreateSolarModuleUseCase),
        container.resolve(ServiceTokens.GetSolarModulesUseCase),
        container.resolve(ServiceTokens.GetSolarModuleByIdUseCase),
        container.resolve(ServiceTokens.UpdateSolarModuleUseCase),
        container.resolve(ServiceTokens.DeleteSolarModuleUseCase)
      );
    });

    container.registerFactory(ServiceTokens.InverterController, () => {
      return new InverterController(
        container.resolve(ServiceTokens.CreateInverterUseCase),
        container.resolve(ServiceTokens.GetInvertersUseCase),
        container.resolve(ServiceTokens.GetInverterByIdUseCase),
        container.resolve(ServiceTokens.UpdateInverterUseCase),
        container.resolve(ServiceTokens.DeleteInverterUseCase)
      );
    });

    container.registerFactory(ServiceTokens.ManufacturerController, () => {
      return new ManufacturerController(
        container.resolve(ServiceTokens.CreateManufacturerUseCase),
        container.resolve(ServiceTokens.GetManufacturersUseCase),
        container.resolve(ServiceTokens.GetManufacturerByIdUseCase),
        container.resolve(ServiceTokens.UpdateManufacturerUseCase),
        container.resolve(ServiceTokens.DeleteManufacturerUseCase)
      );
    });

    // Controllers - Proposal Template
    container.registerFactory(ServiceTokens.ProposalTemplateController, () => {
      return new ProposalTemplateController(
        container.resolve(ServiceTokens.CreateProposalTemplateUseCase),
        container.resolve(ServiceTokens.GetProposalTemplatesUseCase),
        container.resolve(ServiceTokens.UpdateProposalTemplateUseCase),
        container.resolve(ServiceTokens.GenerateProposalUseCase),
        container.resolve(ServiceTokens.USER_REPOSITORY),
        container.resolve(ServiceTokens.ProposalTemplateRepository)
      );
    });

    // Controllers - Proposal Settings
    container.registerFactory(ServiceTokens.ProposalSettingsController, () => {
      return new ProposalSettingsController(container);
    });

    // Use Cases - Solar Analysis
    container.registerFactory(ServiceTokens.AnalyzeSolarPotentialUseCase, () => {
      return new AnalyzeSolarPotentialUseCase(
        container.resolve(ServiceTokens.PVGIS_API_SERVICE)
      );
    });

    // Controllers - Solar Analysis
    container.registerFactory(ServiceTokens.SolarAnalysisController, () => {
      return new SolarAnalysisController(
        container.resolve(ServiceTokens.AnalyzeSolarPotentialUseCase)
      );
    });



    // Use Cases - Advanced Templates
    container.registerFactory(ServiceTokens.CreateAdvancedTemplateUseCase, () => {
      return new CreateAdvancedTemplateUseCase(
        container.resolve(ServiceTokens.AdvancedProposalTemplateRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetAdvancedTemplatesUseCase, () => {
      return new GetAdvancedTemplatesUseCase(
        container.resolve(ServiceTokens.AdvancedProposalTemplateRepository)
      );
    });

    container.registerFactory(ServiceTokens.UpdateAdvancedTemplateUseCase, () => {
      return new UpdateAdvancedTemplateUseCase(
        container.resolve(ServiceTokens.AdvancedProposalTemplateRepository)
      );
    });

    container.registerFactory(ServiceTokens.DeleteAdvancedTemplateUseCase, () => {
      return new DeleteAdvancedTemplateUseCase(
        container.resolve(ServiceTokens.AdvancedProposalTemplateRepository)
      );
    });

    container.registerFactory('CloneAdvancedTemplateUseCase', () => {
      return new CloneAdvancedTemplateUseCase(
        container.resolve(ServiceTokens.GetAdvancedTemplatesUseCase),
        container.resolve(ServiceTokens.CreateAdvancedTemplateUseCase)
      );
    });

    container.registerFactory(ServiceTokens.GenerateProposalFromTemplateUseCase, () => {
      return new GenerateProposalFromTemplateUseCase(
        container.resolve(ServiceTokens.AdvancedProposalTemplateRepository)
      );
    });

    // Use Cases - Irradiation (PVGIS)
    container.registerFactory('GetPVGISIrradiationUseCase', () => {
      return new GetPVGISIrradiationUseCase(
        container.resolve(ServiceTokens.PVGIS_API_SERVICE)
      );
    });

    container.registerFactory('GetPVGISMRDataUseCase', () => {
      return new GetPVGISMRDataUseCase(
        container.resolve(ServiceTokens.PVGIS_API_SERVICE),
        container.resolve('CalculationLogger')
      );
    });

    container.registerFactory('GetPVGISMonthlyComponentsUseCase', () => {
      return new GetPVGISMonthlyComponentsUseCase(
        container.resolve(ServiceTokens.PVGIS_API_SERVICE),
        container.resolve('CalculationLogger')
      );
    });

    // Use Cases - Hybrid System


    // Controllers - Client Alert
    container.registerFactory('ClientAlertController', () => {
      return new ClientAlertController(
        container.resolve('CreateClientAlertUseCase'),
        container.resolve('GetClientAlertsUseCase'),
        container.resolve('UpdateClientAlertUseCase'),
        container.resolve('GetDashboardAlertsUseCase')
      );
    });

    // Controllers - Advanced Templates
    container.registerFactory(ServiceTokens.AdvancedProposalTemplateController, () => {
      return new AdvancedProposalTemplateController(
        container.resolve(ServiceTokens.CreateAdvancedTemplateUseCase),
        container.resolve(ServiceTokens.GetAdvancedTemplatesUseCase),
        container.resolve(ServiceTokens.UpdateAdvancedTemplateUseCase),
        container.resolve(ServiceTokens.DeleteAdvancedTemplateUseCase),
        container.resolve(ServiceTokens.GenerateProposalFromTemplateUseCase),
        container.resolve('CloneAdvancedTemplateUseCase')
      );
    });

    // Controllers - Energy Company
    container.registerFactory(ServiceTokens.EnergyCompanyController, () => {
      return new EnergyCompanyController(
        container.resolve(ServiceTokens.EnergyCompanyRepository)
      );
    });

    // Controllers - Financial Calculation
    container.registerFactory(ServiceTokens.FinancialCalculationController, () => {
      return new FinancialCalculationController(
        container.resolve(ServiceTokens.CalculateProjectFinancialsUseCase)
      );
    });

    // Controllers - Proposal
    container.registerFactory(ServiceTokens.ProposalController, () => {
      return new ProposalController();
    });

    // Middlewares
    container.registerFactory('AuthMiddleware', () => {
      return new AuthMiddleware(container);
    });

    container.register(ServiceTokens.FileUploadMiddleware, FileUploadMiddleware, true);

    // Company Profile Use Cases
    container.registerFactory(ServiceTokens.CreateCompanyProfileUseCase, () => {
      return new CreateCompanyProfileUseCase(
        container.resolve(ServiceTokens.CompanyProfileRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetCompanyProfileUseCase, () => {
      return new GetCompanyProfileUseCase(
        container.resolve(ServiceTokens.CompanyProfileRepository)
      );
    });

    container.registerFactory(ServiceTokens.GetCompanyProfilesUseCase, () => {
      return new GetCompanyProfilesUseCase(
        container.resolve(ServiceTokens.CompanyProfileRepository)
      );
    });

    container.registerFactory(ServiceTokens.UpdateCompanyProfileUseCase, () => {
      return new UpdateCompanyProfileUseCase(
        container.resolve(ServiceTokens.CompanyProfileRepository)
      );
    });

    container.registerFactory(ServiceTokens.DeleteCompanyProfileUseCase, () => {
      return new DeleteCompanyProfileUseCase(
        container.resolve(ServiceTokens.CompanyProfileRepository)
      );
    });

    container.registerFactory(ServiceTokens.UploadCompanyLogoUseCase, () => {
      return new UploadCompanyLogoUseCase(
        container.resolve(ServiceTokens.CompanyProfileRepository),
        container.resolve(ServiceTokens.COMPANY_LOGO_SERVICE)
      );
    });

    container.registerFactory(ServiceTokens.DeleteCompanyLogoUseCase, () => {
      return new DeleteCompanyLogoUseCase(
        container.resolve(ServiceTokens.CompanyProfileRepository),
        container.resolve(ServiceTokens.COMPANY_LOGO_SERVICE)
      );
    });

    // Controllers - Company Profile
    container.registerFactory(ServiceTokens.CompanyProfileController, () => {
      return new CompanyProfileController(
        container.resolve(ServiceTokens.CreateCompanyProfileUseCase),
        container.resolve(ServiceTokens.GetCompanyProfileUseCase),
        container.resolve(ServiceTokens.GetCompanyProfilesUseCase),
        container.resolve(ServiceTokens.UpdateCompanyProfileUseCase),
        container.resolve(ServiceTokens.DeleteCompanyProfileUseCase),
        container.resolve(ServiceTokens.UploadCompanyLogoUseCase),
        container.resolve(ServiceTokens.DeleteCompanyLogoUseCase)
      );
    });
    
    container.register('ValidationMiddleware', ValidationMiddleware, true);
  }

  /**
   * Register factory-based services that require complex initialization
   */
  public static configureFactories(container: Container, config: AppConfig): void {
    // Database connection factory
    container.registerFactory('DatabaseConnection', () => {
      // This would typically initialize MongoDB connection
      // Return the connection instance
      return null; // Placeholder
    }, true);

    // Redis connection factory
    container.registerFactory('RedisConnection', () => {
      // This would typically initialize Redis connection
      // Return the connection instance
      return null; // Placeholder
    }, true);

    // Logger factory
    container.registerFactory('Logger', () => {
      // Configure and return Winston logger instance
      return console; // Placeholder - replace with actual Winston logger
    }, true);
  }

  /**
   * Register environment-specific instances
   */
  public static configureInstances(container: Container, config: AppConfig): void {
    // Register configuration object
    container.registerInstance('Config', config);
  }

  /**
   * Configure the entire container with all dependencies
   */
  public static setup(config: AppConfig): Container {
    const container = new Container();

    // Configure all registrations
    this.configure(container, config);
    this.configureFactories(container, config);
    this.configureInstances(container, config);

    return container;
  }
}