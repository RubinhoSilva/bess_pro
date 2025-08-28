export const ServiceTokens = {
  // Repositories
  USER_REPOSITORY: 'UserRepository',
  TEAM_REPOSITORY: 'TeamRepository',
  KANBAN_COLUMN_REPOSITORY: 'KanbanColumnRepository',
  ProjectRepository: 'ProjectRepository',
  LeadRepository: 'LeadRepository',
  LeadInteractionRepository: 'LeadInteractionRepository',
  ClientRepository: 'ClientRepository',
  Model3DRepository: 'Model3DRepository',
  AreaMontagemRepository: 'AreaMontagemRepository',
  GoogleApiKeyRepository: 'GoogleApiKeyRepository',
  AlertRepository: 'AlertRepository',
  SolarModuleRepository: 'SolarModuleRepository',
  InverterRepository: 'InverterRepository',
  ProposalTemplateRepository: 'ProposalTemplateRepository',
  ProposalSettingsRepository: 'ProposalSettingsRepository',
  AdvancedProposalTemplateRepository: 'AdvancedProposalTemplateRepository',

  // Services
  PASSWORD_HASH_SERVICE: 'PasswordHashService',
  TOKEN_SERVICE: 'TokenService',
  EMAIL_SERVICE: 'EmailService',
  EMAIL_INVITATION_SERVICE: 'EmailInvitationService',
  FILE_STORAGE_SERVICE: 'FileStorageService',
  CACHE_SERVICE: 'CacheService',
  KANBAN_COLUMN_SEEDER_SERVICE: 'KanbanColumnSeederService',

  // External APIs
  PVGIS_API_SERVICE: 'PvgisApiService',
  PAYMENT_GATEWAY_SERVICE: 'PaymentGatewayService',

  // WebSockets
  SOCKET_IO_SERVER: 'SocketIOServer',

  // Use Cases
  REGISTER_USER_USE_CASE: 'RegisterUserUseCase',
  LOGIN_USER_USE_CASE: 'LoginUserUseCase',
  SETUP_PASSWORD_USE_CASE: 'SetupPasswordUseCase',
  FORGOT_PASSWORD_USE_CASE: 'ForgotPasswordUseCase',
  RESET_PASSWORD_USE_CASE: 'ResetPasswordUseCase',
  PASSWORD_RESET_TOKEN_REPOSITORY: 'PasswordResetTokenRepository',
  CREATE_PROJECT_USE_CASE: 'CreateProjectUseCase',
  UPDATE_PROJECT_USE_CASE: 'UpdateProjectUseCase',
  DELETE_PROJECT_USE_CASE: 'DeleteProjectUseCase',
  GET_PROJECT_LIST_USE_CASE: 'GetProjectListUseCase',
  GET_PROJECT_DETAILS_USE_CASE: 'GetProjectDetailsUseCase',
  CLONE_PROJECT_USE_CASE: 'CloneProjectUseCase',
  CREATE_LEAD_USE_CASE: 'CreateLeadUseCase',
  GET_LEADS_USE_CASE: 'GetLeadsUseCase',
  UPDATE_LEAD_USE_CASE: 'UpdateLeadUseCase',
  DELETE_LEAD_USE_CASE: 'DeleteLeadUseCase',
  GET_LEAD_BY_ID_USE_CASE: 'GetLeadByIdUseCase',
  UPDATE_LEAD_STAGE_USE_CASE: 'UpdateLeadStageUseCase',
  CONVERT_LEAD_TO_PROJECT_USE_CASE: 'ConvertLeadToProjectUseCase',
  CREATE_LEAD_INTERACTION_USE_CASE: 'CreateLeadInteractionUseCase',
  GET_LEAD_INTERACTIONS_USE_CASE: 'GetLeadInteractionsUseCase',
  UPDATE_LEAD_INTERACTION_USE_CASE: 'UpdateLeadInteractionUseCase',
  DELETE_LEAD_INTERACTION_USE_CASE: 'DeleteLeadInteractionUseCase',
  UPLOAD_MODEL3D_USE_CASE: 'UploadModel3DUseCase',
  CALCULATE_SOLAR_SYSTEM_USE_CASE: 'CalculateSolarSystemUseCase',
  ANALYZE_FINANCIAL_USE_CASE: 'AnalyzeFinancialUseCase',
  CREATE_ALERT_USE_CASE: 'CreateAlertUseCase',
  CREATE_PROPOSAL_SETTINGS_USE_CASE: 'CreateProposalSettingsUseCase',
  GET_PROPOSAL_SETTINGS_USE_CASE: 'GetProposalSettingsUseCase',
  UPDATE_PROPOSAL_SETTINGS_USE_CASE: 'UpdateProposalSettingsUseCase',
  GET_USER_ALERTS_USE_CASE: 'GetUserAlertsUseCase',
  UPDATE_ALERT_STATUS_USE_CASE: 'UpdateAlertStatusUseCase',
  CreateClientUseCase: 'CreateClientUseCase',
  GetClientListUseCase: 'GetClientListUseCase',
  GetClientDetailsUseCase: 'GetClientDetailsUseCase',
  UpdateClientUseCase: 'UpdateClientUseCase',
  DeleteClientUseCase: 'DeleteClientUseCase',
  ConvertLeadToClientUseCase: 'ConvertLeadToClientUseCase',
  ConvertClientToLeadUseCase: 'ConvertClientToLeadUseCase',
  GenerateFinancialReportUseCase: 'GenerateFinancialReportUseCase',
  CalculateBessSystemUseCase: 'CalculateBessSystemUseCase',
  GetSolarIrradiationUseCase: 'GetSolarIrradiationUseCase',
  CREATE_TEAM_USE_CASE: 'CreateTeamUseCase',
  GET_TEAMS_USE_CASE: 'GetTeamsUseCase',
  UPDATE_TEAM_USE_CASE: 'UpdateTeamUseCase',
  INACTIVATE_TEAM_USE_CASE: 'InactivateTeamUseCase',
  INVITE_USER_TO_TEAM_USE_CASE: 'InviteUserToTeamUseCase',
  GET_KANBAN_COLUMNS_USE_CASE: 'GetKanbanColumnsUseCase',
  CREATE_KANBAN_COLUMN_USE_CASE: 'CreateKanbanColumnUseCase',
  UPDATE_KANBAN_COLUMN_USE_CASE: 'UpdateKanbanColumnUseCase',
  REORDER_KANBAN_COLUMNS_USE_CASE: 'ReorderKanbanColumnsUseCase',
  
  // Equipment Use Cases
  CreateSolarModuleUseCase: 'CreateSolarModuleUseCase',
  GetSolarModulesUseCase: 'GetSolarModulesUseCase',
  UpdateSolarModuleUseCase: 'UpdateSolarModuleUseCase',
  DeleteSolarModuleUseCase: 'DeleteSolarModuleUseCase',
  CreateInverterUseCase: 'CreateInverterUseCase',
  GetInvertersUseCase: 'GetInvertersUseCase',
  UpdateInverterUseCase: 'UpdateInverterUseCase',
  DeleteInverterUseCase: 'DeleteInverterUseCase',

  // Proposal Template Use Cases
  CreateProposalTemplateUseCase: 'CreateProposalTemplateUseCase',
  GetProposalTemplatesUseCase: 'GetProposalTemplatesUseCase',
  UpdateProposalTemplateUseCase: 'UpdateProposalTemplateUseCase',
  GenerateProposalUseCase: 'GenerateProposalUseCase',

  // Project Backup Use Cases
  ExportProjectBackupUseCase: 'ExportProjectBackupUseCase',
  ImportProjectBackupUseCase: 'ImportProjectBackupUseCase',

  // Multi System Use Cases
  CalculateMultiSystemUseCase: 'CalculateMultiSystemUseCase',

  // Solar Analysis Use Cases
  AnalyzeSolarPotentialUseCase: 'AnalyzeSolarPotentialUseCase',

  // Advanced Template Use Cases
  CreateAdvancedTemplateUseCase: 'CreateAdvancedTemplateUseCase',
  GetAdvancedTemplatesUseCase: 'GetAdvancedTemplatesUseCase',
  UpdateAdvancedTemplateUseCase: 'UpdateAdvancedTemplateUseCase',
  DeleteAdvancedTemplateUseCase: 'DeleteAdvancedTemplateUseCase',
  GenerateProposalFromTemplateUseCase: 'GenerateProposalFromTemplateUseCase',

  // Controllers
  TEAM_CONTROLLER: 'TeamController',
  KANBAN_CONTROLLER: 'KanbanController',
  SolarModuleController: 'SolarModuleController',
  InverterController: 'InverterController',
  ProposalTemplateController: 'ProposalTemplateController',
  ProposalSettingsController: 'ProposalSettingsController',
  SolarAnalysisController: 'SolarAnalysisController',
  AdvancedProposalTemplateController: 'AdvancedProposalTemplateController',
  
  // Middlewares
  AuthMiddleware: 'AuthMiddleware',
} as const;

export const TYPES = ServiceTokens;
