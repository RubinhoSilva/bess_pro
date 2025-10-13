import api from '../lib/api';
import { 
  Manufacturer, 
  PaginatedManufacturers 
} from '@bess-pro/shared';
import { 
  ManufacturerFilters, 
  CreateManufacturerRequest, 
  UpdateManufacturerRequest
} from '@bess-pro/shared';
import { ErrorHandler } from '../errors/ErrorHandler';
import { useAuthStore } from '../store/auth-store';

export class ManufacturerService {
  private static instance: ManufacturerService;

  private constructor() {}

  static getInstance(): ManufacturerService {
    if (!ManufacturerService.instance) {
      ManufacturerService.instance = new ManufacturerService();
    }
    return ManufacturerService.instance;
  }

  // Error handling - centralized error processing
  private handleError(error: unknown, operation: string): never {
    const appError = ErrorHandler.handle(error, `ManufacturerService.${operation}`);
    throw appError;
  }

  // CRUD operations
  async getManufacturers(filters?: ManufacturerFilters): Promise<PaginatedManufacturers> {
    try {
      // Obter teamId do usuário autenticado
      const { user } = useAuthStore.getState();
      
      if (!user?.teamId) {
        throw new Error('Usuário não possui teamId. Não é possível listar fabricantes.');
      }
      
      // Adicionar teamId aos filtros
      const requestFilters = {
        ...filters,
        teamId: user.teamId
      };
      
      const response = await api.get('/equipment/manufacturers', { params: { filters: requestFilters } });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getManufacturers');
    }
  }

  async getManufacturerById(id: string): Promise<Manufacturer> {
    try {
      const response = await api.get(`/equipment/manufacturers/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getManufacturerById');
    }
  }

  async createManufacturer(manufacturerData: CreateManufacturerRequest): Promise<Manufacturer> {
    try {
      // Obter teamId do usuário autenticado
      const { user } = useAuthStore.getState();
      
      if (!user?.teamId) {
        throw new Error('Usuário não possui teamId. Não é possível criar fabricante.');
      }
      
      // Adicionar teamId aos dados da requisição
      const requestData = {
        ...manufacturerData,
        teamId: user.teamId
      };
      
      const response = await api.post('/equipment/manufacturers', requestData);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'createManufacturer');
    }
  }

  async updateManufacturer(id: string, manufacturerData: UpdateManufacturerRequest): Promise<Manufacturer> {
    try {
      const response = await api.put(`/equipment/manufacturers/${id}`, manufacturerData);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'updateManufacturer');
    }
  }

  async deleteManufacturer(id: string): Promise<void> {
    try {
      await api.delete(`/equipment/manufacturers/${id}`);
    } catch (error) {
      this.handleError(error, 'deleteManufacturer');
    }
  }

  async toggleManufacturerStatus(id: string, isActive: boolean): Promise<Manufacturer> {
    try {
      const response = await api.patch(`/equipment/manufacturers/${id}/status`, { isActive });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'toggleManufacturerStatus');
    }
  }

  // Bulk operations
  async bulkDeleteManufacturers(ids: string[]): Promise<void> {
    try {
      await api.post('/equipment/manufacturers/bulk-delete', { ids });
    } catch (error) {
      this.handleError(error, 'bulkDeleteManufacturers');
    }
  }

  async bulkToggleStatus(ids: string[], isActive: boolean): Promise<void> {
    try {
      await api.post('/equipment/manufacturers/bulk-toggle-status', { ids, isActive });
    } catch (error) {
      this.handleError(error, 'bulkToggleStatus');
    }
  }

  // Search and filter helpers
  async searchManufacturers(query: string, limit: number = 10): Promise<Manufacturer[]> {
    try {
      const response = await api.get('/equipment/manufacturers/search', {
        params: { query, limit }
      });
      return response.data.data.manufacturers || [];
    } catch (error) {
      this.handleError(error, 'searchManufacturers');
    }
  }

  async getManufacturersByCountry(country: string): Promise<Manufacturer[]> {
    try {
      const filters: ManufacturerFilters = {
        country,
      };

      const response = await api.get('/equipment/manufacturers', { 
        params: { filters }
      });
      
      return response.data.data.manufacturers || [];
    } catch (error) {
      this.handleError(error, 'getManufacturersByCountry');
    }
  }

  async getActiveManufacturers(): Promise<Manufacturer[]> {
    try {
      const response = await api.get('/equipment/manufacturers/active');
      return response.data.data.manufacturers || [];
    } catch (error) {
      this.handleError(error, 'getActiveManufacturers');
    }
  }

  // Statistics and analytics
  async getManufacturerStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCountry: Record<string, number>;
  }> {
    try {
      const response = await api.get('/equipment/manufacturers/stats');
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getManufacturerStats');
    }
  }
}

// Export singleton instance
export const manufacturerService = ManufacturerService.getInstance();