// Re-export from shared package to maintain backward compatibility
export type { UpdateCompanyProfileRequest } from '@bess-pro/shared';

// Legacy type alias for backward compatibility
import type { UpdateCompanyProfileRequest } from '@bess-pro/shared';
export type UpdateCompanyProfileCommand = UpdateCompanyProfileRequest;