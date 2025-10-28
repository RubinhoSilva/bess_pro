// Re-export from shared package to maintain backward compatibility
export type { CreateCompanyProfileRequest } from '@bess-pro/shared';

// Legacy type alias for backward compatibility
import type { CreateCompanyProfileRequest } from '@bess-pro/shared';
export type CreateCompanyProfileCommand = CreateCompanyProfileRequest;