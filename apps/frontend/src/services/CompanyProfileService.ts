import { api } from '../lib/api';
import {
  CompanyProfile,
  CompanyProfileListResponse,
  CreateCompanyProfileRequest,
  UpdateCompanyProfileRequest,
  UploadCompanyLogoResponse
} from '@bess-pro/shared';

// Tipo para a resposta da API que inclui o wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class CompanyProfileService {
  private readonly baseUrl = '/company-profiles';

  /**
   * Get company profile of the current team
   */
  async getMyCompanyProfile(): Promise<CompanyProfile> {
    const response = await api.get<ApiResponse<CompanyProfile>>(`${this.baseUrl}/me`);
    return response.data.data;
  }

  /**
   * Create new company profile
   */
  async createCompanyProfile(data: CreateCompanyProfileRequest): Promise<CompanyProfile> {
    const response = await api.post<ApiResponse<CompanyProfile>>(this.baseUrl, data);
    return response.data.data;
  }

  /**
   * Update company profile of the current team
   */
  async updateMyCompanyProfile(data: UpdateCompanyProfileRequest): Promise<CompanyProfile> {
    const response = await api.put<ApiResponse<CompanyProfile>>(`${this.baseUrl}/me`, data);
    return response.data.data;
  }

  /**
   * Delete company profile of the current team
   */
  async deleteMyCompanyProfile(hardDelete?: boolean): Promise<void> {
    await api.delete(`${this.baseUrl}/me`, {
      params: hardDelete ? { hard: true } : {}
    });
  }

  /**
   * Upload company logo for the current team
   */
  async uploadMyCompanyLogo(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadCompanyLogoResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post<ApiResponse<UploadCompanyLogoResponse>>(
      `${this.baseUrl}/me/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
    return response.data.data;
  }

  /**
   * Delete company logo of the current team
   */
  async deleteMyCompanyLogo(): Promise<void> {
    await api.delete(`${this.baseUrl}/me/logo`);
  }

}

// Export singleton instance
export const companyProfileService = new CompanyProfileService();
export { CompanyProfileService };