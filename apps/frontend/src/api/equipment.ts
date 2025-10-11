import api from '../lib/api';
import { 
  Inverter, 
  CreateInverterRequest, 
  UpdateInverterRequest,
  PaginatedInverters 
} from '@bess-pro/shared';
import { useInverterQueryParams } from '../store/inverter-store';

export const inverterApi = {
  // Get all inverters with filtering and pagination
  getInverters: async (params: ReturnType<typeof useInverterQueryParams>): Promise<PaginatedInverters> => {
    const response = await api.get('/equipment/inverters', { params });
    return response.data.data;
  },

  // Get inverter by ID
  getInverterById: async (id: string): Promise<Inverter> => {
    const response = await api.get(`/equipment/inverters/${id}`);
    return response.data.data;
  },

  // Create a new inverter
  createInverter: async (data: CreateInverterRequest): Promise<Inverter> => {
    const response = await api.post('/equipment/inverters', data);
    return response.data.data;
  },

  // Update an inverter
  updateInverter: async (id: string, data: UpdateInverterRequest): Promise<Inverter> => {
    const response = await api.put(`/equipment/inverters/${id}`, data);
    return response.data.data;
  },

  // Delete an inverter
  deleteInverter: async (id: string): Promise<void> => {
    await api.delete(`/equipment/inverters/${id}`);
  },

  // Toggle inverter active status
  toggleInverterStatus: async (id: string, isActive: boolean): Promise<Inverter> => {
    const response = await api.patch(`/equipment/inverters/${id}/status`, { isActive });
    return response.data.data;
  },

  // Bulk operations
  bulkDeleteInverters: async (ids: string[]): Promise<void> => {
    await api.post('/equipment/inverters/bulk-delete', { ids });
  },

  bulkToggleStatus: async (ids: string[], isActive: boolean): Promise<void> => {
    await api.post('/equipment/inverters/bulk-status', { ids, isActive });
  }
};

import { 
  SolarModule, 
  CreateModuleRequest, 
  UpdateModuleRequest,
  PaginatedModules 
} from '@bess-pro/shared';
import { useModuleQueryParams } from '../store/module-store';

export const moduleApi = {
  // Get all modules with filtering and pagination
  getModules: async (params: ReturnType<typeof useModuleQueryParams>): Promise<PaginatedModules> => {
    const response = await api.get('/equipment/modules', { params });
    return response.data.data;
  },

  // Get module by ID
  getModuleById: async (id: string): Promise<SolarModule> => {
    const response = await api.get(`/equipment/modules/${id}`);
    return response.data.data;
  },

  // Create a new module
  createModule: async (data: CreateModuleRequest): Promise<SolarModule> => {
    const response = await api.post('/equipment/modules', data);
    return response.data.data;
  },

  // Update a module
  updateModule: async (id: string, data: UpdateModuleRequest): Promise<SolarModule> => {
    const response = await api.put(`/equipment/modules/${id}`, data);
    return response.data.data;
  },

  // Delete a module
  deleteModule: async (id: string): Promise<void> => {
    await api.delete(`/equipment/modules/${id}`);
  },

  // Toggle module active status
  toggleModuleStatus: async (id: string, isActive: boolean): Promise<SolarModule> => {
    const response = await api.patch(`/equipment/modules/${id}/status`, { isActive });
    return response.data.data;
  },

  // Bulk operations
  bulkDeleteModules: async (ids: string[]): Promise<void> => {
    await api.post('/equipment/modules/bulk-delete', { ids });
  },

  bulkToggleStatus: async (ids: string[], isActive: boolean): Promise<void> => {
    await api.post('/equipment/modules/bulk-status', { ids, isActive });
  }
};

import { 
  Manufacturer, 
  CreateManufacturerRequest, 
  UpdateManufacturerRequest,
  PaginatedManufacturers 
} from '@bess-pro/shared';
import { useManufacturerQueryParams } from '../store/manufacturer-store';

export const manufacturerApi = {
  // Get all manufacturers with filtering and pagination
  getManufacturers: async (params: ReturnType<typeof useManufacturerQueryParams>): Promise<PaginatedManufacturers> => {
    const response = await api.get('/equipment/manufacturers', { params });
    return response.data.data;
  },

  // Get manufacturer by ID
  getManufacturerById: async (id: string): Promise<Manufacturer> => {
    const response = await api.get(`/equipment/manufacturers/${id}`);
    return response.data.data;
  },

  // Create a new manufacturer
  createManufacturer: async (data: CreateManufacturerRequest): Promise<Manufacturer> => {
    const response = await api.post('/equipment/manufacturers', data);
    return response.data.data;
  },

  // Update a manufacturer
  updateManufacturer: async (id: string, data: UpdateManufacturerRequest): Promise<Manufacturer> => {
    const response = await api.put(`/equipment/manufacturers/${id}`, data);
    return response.data.data;
  },

  // Delete a manufacturer
  deleteManufacturer: async (id: string): Promise<void> => {
    await api.delete(`/equipment/manufacturers/${id}`);
  },

  // Toggle manufacturer active status
  toggleManufacturerStatus: async (id: string, isActive: boolean): Promise<Manufacturer> => {
    const response = await api.patch(`/equipment/manufacturers/${id}/status`, { isActive });
    return response.data.data;
  },

  // Bulk operations
  bulkDeleteManufacturers: async (ids: string[]): Promise<void> => {
    await api.post('/equipment/manufacturers/bulk-delete', { ids });
  },

  bulkToggleStatus: async (ids: string[], isActive: boolean): Promise<void> => {
    await api.post('/equipment/manufacturers/bulk-status', { ids, isActive });
  }
};