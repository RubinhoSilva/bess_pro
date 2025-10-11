import api from '../lib/api';
import { 
  SolarModule, 
  PaginatedModules 
} from '../types/legacy-equipment';
import { 
  ModuleFilters, 
  CreateModuleRequest, 
  UpdateModuleRequest
} from '@bess-pro/shared';

export class ModuleService {
  private static instance: ModuleService;

  private constructor() {}

  static getInstance(): ModuleService {
    if (!ModuleService.instance) {
      ModuleService.instance = new ModuleService();
    }
    return ModuleService.instance;
  }

  // Error handling - apenas repassa erro do backend
  private handleError(error: any, operation: string): never {
    console.error(`ModuleService ${operation} error:`, error);
    
    // Repassa exatamente o erro do backend sem modificar
    const backendMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
    
    throw new Error(backendMessage);
  }

  // CRUD operations
  async getModules(filters?: ModuleFilters): Promise<PaginatedModules> {
    try {
      const response = await api.get('/equipment/modules', { params: { filters } });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getModules');
    }
  }

  async getModuleById(id: string): Promise<SolarModule> {
    try {
      const response = await api.get(`/equipment/modules/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getModuleById');
    }
  }

  async createModule(moduleData: CreateModuleRequest): Promise<SolarModule> {
    try {
      const response = await api.post('/equipment/modules', moduleData);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'createModule');
    }
  }

  async updateModule(id: string, moduleData: UpdateModuleRequest): Promise<SolarModule> {
    try {
      const response = await api.put(`/equipment/modules/${id}`, moduleData);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'updateModule');
    }
  }

  async deleteModule(id: string): Promise<void> {
    try {
      await api.delete(`/equipment/modules/${id}`);
    } catch (error) {
      this.handleError(error, 'deleteModule');
    }
  }

  async toggleModuleStatus(id: string, isActive: boolean): Promise<SolarModule> {
    try {
      const response = await api.patch(`/equipment/modules/${id}/status`, { isActive });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'toggleModuleStatus');
    }
  }

  // Bulk operations
  async bulkDeleteModules(ids: string[]): Promise<void> {
    try {
      await api.post('/equipment/modules/bulk-delete', { ids });
    } catch (error) {
      this.handleError(error, 'bulkDeleteModules');
    }
  }

  async bulkToggleStatus(ids: string[], isActive: boolean): Promise<void> {
    try {
      await api.post('/equipment/modules/bulk-toggle-status', { ids, isActive });
    } catch (error) {
      this.handleError(error, 'bulkToggleStatus');
    }
  }

  // Validation methods
  async validateModuleConfiguration(moduleIds: string[], inverterId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    try {
      const response = await api.post('/equipment/modules/validate-configuration', {
        moduleIds,
        inverterId,
      });
      
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'validateModuleConfiguration');
    }
  }

  // Search and filter helpers
  async searchModules(query: string, limit: number = 10): Promise<SolarModule[]> {
    try {
      const filters: ModuleFilters = {
        searchTerm: query,
      };

      const response = await api.get('/equipment/modules', { 
        params: { 
          filters,
          pagination: { page: 1, limit }
        }
      });
      
      return response.data.data.modules || [];
    } catch (error) {
      this.handleError(error, 'searchModules');
    }
  }

  async getModulesByManufacturer(manufacturerId: string): Promise<SolarModule[]> {
    try {
      const filters: ModuleFilters = {
        manufacturerId,
      };

      const response = await api.get('/equipment/modules', { 
        params: { filters }
      });
      
      return response.data.data.modules || [];
    } catch (error) {
      this.handleError(error, 'getModulesByManufacturer');
    }
  }
}

// Export singleton instance
export const moduleService = ModuleService.getInstance();