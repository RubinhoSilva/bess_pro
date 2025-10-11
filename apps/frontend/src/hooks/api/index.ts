// Modules API hooks
export {
  useModulesList,
  useModule,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useToggleModuleStatus,
  moduleQueryKeys,
} from './useModulesApi';

// Inverters API hooks
export {
  useInvertersList,
  useInverter,
  useCreateInverter,
  useUpdateInverter,
  useDeleteInverter,
  useToggleInverterStatus,
  inverterQueryKeys,
} from './useInvertersApi';

// Manufacturers API hooks
export {
  useManufacturersList,
  useManufacturer,
  useCreateManufacturer,
  useUpdateManufacturer,
  useDeleteManufacturer,
  useToggleManufacturerStatus,
  manufacturerQueryKeys,
} from './useManufacturersApi';

// Configuration API hooks
export {
  useValidateConfiguration,
  useCalculateOptimalConfiguration,
  useSimulateSystemPerformance,
  useFinancialAnalysis,
  configurationQueryKeys,
  type ConfigurationValidationRequest,
  type ConfigurationValidationResponse,
  type OptimalConfigurationRequest,
  type OptimalConfigurationResponse,
} from './useConfigurationApi';