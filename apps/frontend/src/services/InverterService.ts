import api from '../lib/api';
import { 
  Inverter, 
  PaginatedInverters 
} from '../types/legacy-equipment';
import { 
  InverterFilters, 
  CreateInverterRequest, 
  UpdateInverterRequest
} from '@bess-pro/shared';

export class InverterService {
  private static instance: InverterService;

  private constructor() {}

  static getInstance(): InverterService {
    if (!InverterService.instance) {
      InverterService.instance = new InverterService();
    }
    return InverterService.instance;
  }

  // Error handling - apenas repassa erro do backend
  private handleError(error: any, operation: string): never {
    console.error(`InverterService ${operation} error:`, error);
    
    // Repassa exatamente o erro do backend sem modificar
    const backendMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
    
    throw new Error(backendMessage);
  }

  // CRUD operations
  async getInverters(filters?: InverterFilters): Promise<PaginatedInverters> {
    try {
      const response = await api.get('/equipment/inverters', { params: { filters } });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getInverters');
    }
  }

  async getInverterById(id: string): Promise<Inverter> {
    try {
      const response = await api.get(`/equipment/inverters/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getInverterById');
    }
  }

  async createInverter(inverterData: CreateInverterRequest): Promise<Inverter> {
    try {
      const response = await api.post('/equipment/inverters', inverterData);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'createInverter');
    }
  }

  async updateInverter(id: string, inverterData: UpdateInverterRequest): Promise<Inverter> {
    try {
      const response = await api.put(`/equipment/inverters/${id}`, inverterData);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'updateInverter');
    }
  }

  async deleteInverter(id: string): Promise<void> {
    try {
      await api.delete(`/equipment/inverters/${id}`);
    } catch (error) {
      this.handleError(error, 'deleteInverter');
    }
  }

  async toggleInverterStatus(id: string, isActive: boolean): Promise<Inverter> {
    try {
      const response = await api.patch(`/equipment/inverters/${id}/status`, { isActive });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'toggleInverterStatus');
    }
  }

  // Bulk operations
  async bulkDeleteInverters(ids: string[]): Promise<void> {
    try {
      await api.post('/equipment/inverters/bulk-delete', { ids });
    } catch (error) {
      this.handleError(error, 'bulkDeleteInverters');
    }
  }

  async bulkToggleStatus(ids: string[], isActive: boolean): Promise<void> {
    try {
      await api.post('/equipment/inverters/bulk-toggle-status', { ids, isActive });
    } catch (error) {
      this.handleError(error, 'bulkToggleStatus');
    }
  }

  // Validation methods
  async validateInverterConfiguration(inverterId: string, moduleIds: string[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    try {
      const response = await api.post('/equipment/inverters/validate-configuration', {
        inverterId,
        moduleIds,
      });
      
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'validateInverterConfiguration');
    }
  }

  // Search and filter helpers
  async searchInverters(query: string, limit: number = 10): Promise<Inverter[]> {
    try {
      const filters: InverterFilters = {
        searchTerm: query,
      };

      const response = await api.get('/equipment/inverters', { 
        params: { 
          filters,
          pagination: { page: 1, limit }
        }
      });
      
      return response.data.data.inverters || [];
    } catch (error) {
      this.handleError(error, 'searchInverters');
    }
  }

  async getInvertersByManufacturer(manufacturerId: string): Promise<Inverter[]> {
    try {
      const filters: InverterFilters = {
        manufacturerId,
      };

      const response = await api.get('/equipment/inverters', { 
        params: { filters }
      });
      
      return response.data.data.inverters || [];
    } catch (error) {
      this.handleError(error, 'getInvertersByManufacturer');
    }
  }

  async getInvertersByPowerRange(minPower: number, maxPower: number): Promise<Inverter[]> {
    try {
      const response = await api.get('/equipment/inverters/power-range', {
        params: { minPower, maxPower }
      });
      return response.data.data.inverters || [];
    } catch (error) {
      this.handleError(error, 'getInvertersByPowerRange');
    }
  }
}

// Export singleton instance
export const inverterService = InverterService.getInstance();