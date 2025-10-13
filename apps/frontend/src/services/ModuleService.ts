import api from '../lib/api';
import { 
  SolarModule, 
  PaginatedModules 
} from '@bess-pro/shared';
import { 
  ModuleFilters, 
  CreateModuleRequest, 
  UpdateModuleRequest
} from '@bess-pro/shared';
import { ErrorHandler } from '../errors/ErrorHandler';
import { useAuthStore } from '../store/auth-store';

export class ModuleService {
  private static instance: ModuleService;

  private constructor() {}

  static getInstance(): ModuleService {
    if (!ModuleService.instance) {
      ModuleService.instance = new ModuleService();
    }
    return ModuleService.instance;
  }

  // Error handling - centralized error processing
  private handleError(error: unknown, operation: string): never {
    const appError = ErrorHandler.handle(error, `ModuleService.${operation}`);
    throw appError;
  }

  // CRUD operations
  async getModules(filters?: ModuleFilters): Promise<PaginatedModules> {
    try {
      // Obter teamId do usuário autenticado
      const { user } = useAuthStore.getState();
      
      // Adicionar teamId aos filtros
      const requestFilters = {
        ...filters,
        teamId: user?.teamId
      };
      
      const response = await api.get('/equipment/modules', { params: { filters: requestFilters } });
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
      // Obter teamId do usuário autenticado
      const { user } = useAuthStore.getState();
      
      if (!user?.teamId) {
        throw new Error('Usuário não possui teamId. Não é possível criar módulo.');
      }
      
      // Adicionar teamId aos dados
      const dataWithTeam = {
        ...moduleData,
        teamId: user.teamId
      };
      
      const response = await api.post('/equipment/modules', dataWithTeam);
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
      // Obter teamId do usuário autenticado
      const { user } = useAuthStore.getState();
      
      const filters: ModuleFilters = {
        searchTerm: query,
        teamId: user?.teamId,
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
      // Obter teamId do usuário autenticado
      const { user } = useAuthStore.getState();
      
      const filters: ModuleFilters = {
        manufacturerId,
        teamId: user?.teamId,
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