import { ServiceRegistration } from './Container';
import { ServiceTokens } from './ServiceTokens';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ProposalController } from '../presentation/controllers/ProposalController';

export class ContainerSetup {
  static registerServices(container: Container): void {
    // Repositories
    container.register(ServiceTokens.USER_REPOSITORY, {
      implementation: require('../database/mongodb/repositories/MongoUserRepository').MongoUserRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.TEAM_REPOSITORY, {
      implementation: require('../database/mongodb/repositories/MongoTeamRepository').MongoTeamRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.KANBAN_COLUMN_REPOSITORY, {
      implementation: require('../database/mongodb/repositories/MongoKanbanColumnRepository').MongoKanbanColumnRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.ProjectRepository, {
      implementation: require('../database/mongodb/repositories/MongoProjectRepository').MongoProjectRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.LeadRepository, {
      implementation: require('../database/mongodb/repositories/MongoLeadRepository').MongoLeadRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.LeadInteractionRepository, {
      implementation: require('../database/mongodb/repositories/MongoLeadInteractionRepository').MongoLeadInteractionRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.ClientRepository, {
      implementation: require('../database/mongodb/repositories/MongoClientRepository').MongoClientRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.Model3DRepository, {
      implementation: require('../database/mongodb/repositories/MongoModel3DRepository').MongoModel3DRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.AreaMontagemRepository, {
      implementation: require('../database/mongodb/repositories/MongoAreaMontagemRepository').MongoAreaMontagemRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.GoogleApiKeyRepository, {
      implementation: require('../database/mongodb/repositories/MongoGoogleApiKeyRepository').MongoGoogleApiKeyRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.AlertRepository, {
      implementation: require('../database/mongodb/repositories/MongoAlertRepository').MongoAlertRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.SolarModuleRepository, {
      implementation: require('../database/mongodb/repositories/MongoSolarModuleRepository').MongoSolarModuleRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.InverterRepository, {
      implementation: require('../database/mongodb/repositories/MongoInverterRepository').MongoInverterRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.ManufacturerRepository, {
      implementation: require('../database/mongodb/repositories/MongoManufacturerRepository').MongoManufacturerRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.ProposalTemplateRepository, {
      implementation: require('../database/mongodb/repositories/MongoProposalTemplateRepository').MongoProposalTemplateRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.ProposalSettingsRepository, {
      implementation: require('../database/mongodb/repositories/MongoProposalSettingsRepository').MongoProposalSettingsRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.AdvancedProposalTemplateRepository, {
      implementation: require('../database/mongodb/repositories/MongoAdvancedProposalTemplateRepository').MongoAdvancedProposalTemplateRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.EnergyCompanyRepository, {
      implementation: require('../database/mongodb/repositories/MongoEnergyCompanyRepository').MongoEnergyCompanyRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.PasswordResetTokenRepository, {
      implementation: require('../database/mongodb/repositories/MongoPasswordResetTokenRepository').MongoPasswordResetTokenRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.RefreshTokenRepository, {
      implementation: require('../database/mongodb/repositories/MongoRefreshTokenRepository').MongoRefreshTokenRepository,
      singleton: true
    });
    
    container.register(ServiceTokens.TeamInviteRepository, {
      implementation: require('../database/mongodb/repositories/MongoTeamInviteRepository').MongoTeamInviteRepository,
      singleton: true
    });
    
    // Services
    container.register(ServiceTokens.PASSWORD_HASH_SERVICE, {
      implementation: require('../security/BcryptPasswordHashService').BcryptPasswordHashService,
      singleton: true
    });
    
    container.register(ServiceTokens.TOKEN_SERVICE, {
      implementation: require('../security/JwtTokenService').JwtTokenService,
      singleton: true
    });
    
    container.register(ServiceTokens.EMAIL_SERVICE, {
      implementation: require('../email/NodemailerEmailService').NodemailerEmailService,
      singleton: true
    });
    
    container.register(ServiceTokens.EMAIL_INVITATION_SERVICE, {
      implementation: require('../email/SendGridEmailService').SendGridEmailService,
      singleton: true
    });
    
    container.register(ServiceTokens.FILE_STORAGE_SERVICE, {
      implementation: require('../storage/LocalFileStorageService').LocalFileStorageService,
      singleton: true
    });
    
    container.register(ServiceTokens.CACHE_SERVICE, {
      implementation: require('../cache/MemoryCache').MemoryCache,
      singleton: true
    });
    
    container.register(ServiceTokens.KANBAN_COLUMN_SEEDER_SERVICE, {
      implementation: require('../cache/PaginationCacheService').PaginationCacheService,
      singleton: true
    });
    
    // External APIs
    container.register(ServiceTokens.PVGIS_API_SERVICE, {
      implementation: require('../external-apis/PvgisApiService').PvgisApiService,
      singleton: true
    });
    
    container.register(ServiceTokens.PAYMENT_GATEWAY_SERVICE, {
      implementation: require('../external-apis/PaymentGatewayService').PaymentGatewayService,
      singleton: true
    });
    
    container.register(ServiceTokens.PVLIB_SERVICE_CLIENT, {
      implementation: require('../external-apis/SimplePvlibServiceClient').SimplePvlibServiceClient,
      singleton: true
    });
    
    container.register(ServiceTokens.BESS_CALCULATION_CLIENT, {
      implementation: require('../external-apis/BessCalculationClient').BessCalculationClient,
      singleton: true
    });
    
    // WebSockets
    container.register(ServiceTokens.SOCKET_IO_SERVER, {
      implementation: require('../websockets/SocketIOServer').SocketIOServer,
      singleton: true
    });
    
    // Middlewares
    container.register(ServiceTokens.AuthMiddleware, {
      implementation: AuthMiddleware,
      singleton: true
    });
    
    // Controllers
    container.register(ServiceTokens.TEAM_CONTROLLER, {
      implementation: require('../presentation/controllers/TeamController').TeamController,
      singleton: false
    });
    
    container.register(ServiceTokens.KANBAN_CONTROLLER, {
      implementation: require('../presentation/controllers/KanbanController').KanbanController,
      singleton: false
    });
    
    container.register(ServiceTokens.SolarModuleController, {
      implementation: require('../presentation/controllers/SolarModuleController').SolarModuleController,
      singleton: false
    });
    
    container.register(ServiceTokens.InverterController, {
      implementation: require('../presentation/controllers/InverterController').InverterController,
      singleton: false
    });
    
    container.register(ServiceTokens.ManufacturerController, {
      implementation: require('../presentation/controllers/ManufacturerController').ManufacturerController,
      singleton: false
    });
    
    container.register(ServiceTokens.ProposalTemplateController, {
      implementation: require('../presentation/controllers/ProposalTemplateController').ProposalTemplateController,
      singleton: false
    });
    
    container.register(ServiceTokens.ProposalSettingsController, {
      implementation: require('../presentation/controllers/ProposalSettingsController').ProposalSettingsController,
      singleton: false
    });
    
    container.register(ServiceTokens.SolarAnalysisController, {
      implementation: require('../presentation/controllers/SolarAnalysisController').SolarAnalysisController,
      singleton: false
    });
    
    container.register(ServiceTokens.AdvancedProposalTemplateController, {
      implementation: require('../presentation/controllers/AdvancedProposalTemplateController').AdvancedProposalTemplateController,
      singleton: false
    });
    
    container.register(ServiceTokens.EnergyCompanyController, {
      implementation: require('../presentation/controllers/EnergyCompanyController').EnergyCompanyController,
      singleton: false
    });
    
    container.register(ServiceTokens.FinancialCalculationController, {
      implementation: require('../presentation/controllers/FinancialCalculationController').FinancialCalculationController,
      singleton: false
    });
    
    // Proposal Controller
    container.register(ServiceTokens.ProposalController, {
      implementation: ProposalController,
      singleton: false
    });
  }
}