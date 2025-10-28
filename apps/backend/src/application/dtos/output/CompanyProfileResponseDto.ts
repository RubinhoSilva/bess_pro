// Re-export from shared package to maintain backward compatibility
export type {
  CompanyProfileResponse,
  CompanyProfileListResponse
} from '@bess-pro/shared';

// Legacy type aliases for backward compatibility
import type {
  CompanyProfileResponse as SharedCompanyProfileResponse,
  CompanyProfileListResponse as SharedCompanyProfileListResponse
} from '@bess-pro/shared';

export type CompanyProfileResponseDto = SharedCompanyProfileResponse;
export type CompanyProfileListResponseDto = SharedCompanyProfileListResponse;